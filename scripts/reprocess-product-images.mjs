/**
 * Массовая переобработка существующих фото товаров.
 *
 * Скачивает каждое фото из бакета `uploads`, прогоняет через sharp
 * (resize до 2000px по большей стороне + WebP q90 + EXIF-поворот),
 * заливает новый .webp, обновляет product_images.url и удаляет старый файл.
 *
 * Безопасно: пропускает видео и уже сжатые .webp (если не передан --force),
 * поддерживает --dry-run (ничего не меняет, только отчёт) и --limit=N.
 *
 * Запуск:
 *   node scripts/reprocess-product-images.mjs --dry-run
 *   node scripts/reprocess-product-images.mjs
 *   node scripts/reprocess-product-images.mjs --limit=50 --force
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'uploads';
const MAX_DIM = 2000;
const WEBP_QUALITY = 90;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Нет NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY в .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const limitArg = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Путь внутри бакета из публичного URL.
function storagePath(url) {
  const m = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function main() {
  console.log(`\n🖼  Переобработка фото товаров${DRY_RUN ? ' (DRY RUN)' : ''}`);
  console.log(`   target: ${MAX_DIM}px / WebP q${WEBP_QUALITY}${FORCE ? ' / FORCE' : ''}\n`);

  // Берём только изображения (не видео).
  const { data: rows, error } = await supabase
    .from('product_images')
    .select('id, url, media_type, thumbnail_url')
    .eq('media_type', 'image')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Ошибка чтения product_images:', error.message);
    process.exit(1);
  }

  const targets = rows.filter((r) => {
    if (!r.url || !r.url.includes('supabase.co')) return false;
    if (!FORCE && /\.webp(\?|$)/i.test(r.url)) return false; // уже сжато
    return true;
  });

  console.log(`Всего изображений в БД: ${rows.length}`);
  console.log(`К обработке: ${Math.min(targets.length, LIMIT)}${targets.length > LIMIT ? ` (из ${targets.length}, лимит ${LIMIT})` : ''}\n`);

  let done = 0;
  let savedBytes = 0;
  let failed = 0;
  let processed = 0;

  for (const row of targets) {
    if (processed >= LIMIT) break;
    processed++;

    const oldPath = storagePath(row.url);
    if (!oldPath) {
      console.log(`⏭  [${row.id}] не похоже на файл uploads — пропуск`);
      continue;
    }

    try {
      // 1. Скачиваем оригинал.
      const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(oldPath);
      if (dlErr || !blob) throw new Error(`download: ${dlErr?.message || 'нет данных'}`);
      const inputBuf = Buffer.from(await blob.arrayBuffer());

      // 2. Обрабатываем.
      const outputBuf = await sharp(inputBuf, { failOn: 'none' })
        .rotate()
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toBuffer();

      const delta = inputBuf.length - outputBuf.length;
      const pct = ((delta / inputBuf.length) * 100).toFixed(0);
      const sizeInfo = `${(inputBuf.length / 1024).toFixed(0)}KB → ${(outputBuf.length / 1024).toFixed(0)}KB (${pct}%)`;

      if (DRY_RUN) {
        console.log(`🔎 [${processed}/${Math.min(targets.length, LIMIT)}] ${oldPath}  ${sizeInfo}`);
        savedBytes += Math.max(0, delta);
        done++;
        continue;
      }

      // 3. Заливаем новый .webp (новый путь, чтобы сбросить CDN-кэш).
      const newPath = oldPath.replace(/\.[^/.]+$/, '') + '-opt.webp';
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, outputBuf, { contentType: 'image/webp', upsert: true });
      if (upErr) throw new Error(`upload: ${upErr.message}`);

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(newPath);
      const newUrl = pub.publicUrl;

      // 4. Обновляем запись в БД.
      const { error: updErr } = await supabase
        .from('product_images')
        .update({ url: newUrl })
        .eq('id', row.id);
      if (updErr) throw new Error(`db update: ${updErr.message}`);

      // 5. Удаляем старый файл (если путь изменился).
      if (newPath !== oldPath) {
        await supabase.storage.from(BUCKET).remove([oldPath]);
      }

      savedBytes += Math.max(0, delta);
      done++;
      console.log(`✅ [${processed}/${Math.min(targets.length, LIMIT)}] ${sizeInfo}  ${newPath}`);
    } catch (e) {
      failed++;
      console.error(`❌ [${row.id}] ${oldPath}: ${e.message}`);
    }
  }

  console.log(`\n— Готово —`);
  console.log(`Обработано: ${done}, ошибок: ${failed}`);
  console.log(`Экономия: ~${(savedBytes / 1024 / 1024).toFixed(1)} MB${DRY_RUN ? ' (оценка)' : ''}`);
  if (DRY_RUN) console.log(`\nЭто был dry-run. Запусти без --dry-run, чтобы применить.`);
}

main().catch((e) => {
  console.error('Фатальная ошибка:', e);
  process.exit(1);
});
