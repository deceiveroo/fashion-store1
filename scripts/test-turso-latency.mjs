// Проверка latency до Turso из текущей сети.
// Делает 5 SELECT 1 запросов через HTTP API и печатает время каждого.
//
// Использование:
//   1. Создай базу в Turso (CLI: `turso db create test-db` или web UI)
//   2. Получи URL базы: `turso db show test-db --url`
//      Формат: libsql://<имя>-<org>.turso.io
//      Для HTTP API заменяем libsql:// на https://
//   3. Положи URL и токен в .env.local:
//        TURSO_TEST_URL=https://test-db-yourorg.turso.io
//        TURSO_TEST_TOKEN=<новый_токен_не_тот_что_слил>
//   4. Запусти: node scripts/test-turso-latency.mjs
//
// Что смотрим:
//   - <200ms = отлично, edge близко
//   - 200-500ms = терпимо, для prod нормально, для hot-path БД (как у тебя) пограничный
//   - >500ms = ехать на каждый запрос ~полсекунды; при 6 параллельных запросах = страница загрузится за 3+ сек
//   - таймаут / network error = заблокировано/недоступно из РФ

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {}
  }
}

loadEnv();

const URL = process.env.TURSO_TEST_URL;
const TOKEN = process.env.TURSO_TEST_TOKEN;

if (!URL || !TOKEN) {
  console.error('❌ Нужны TURSO_TEST_URL и TURSO_TEST_TOKEN в .env.local');
  console.error('   Пример URL: https://my-db-myorg.turso.io');
  process.exit(1);
}

const endpoint = URL.replace(/\/$/, '') + '/v2/pipeline';

async function ping(i) {
  const start = performance.now();
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          { type: 'execute', stmt: { sql: 'SELECT 1 as one' } },
          { type: 'close' },
        ],
      }),
    });
    const ms = Math.round(performance.now() - start);
    const body = await res.text();
    const ok = res.ok && body.includes('"one"');
    console.log(`[${i}] ${ok ? '✅' : '⚠️'} ${res.status} ${ms}ms`);
    if (!ok) console.log('    body:', body.slice(0, 200));
    return { ok, ms };
  } catch (err) {
    const ms = Math.round(performance.now() - start);
    console.log(`[${i}] ❌ ${ms}ms — ${err.message}`);
    return { ok: false, ms };
  }
}

console.log(`Тестирую: ${endpoint}\n`);

const results = [];
for (let i = 1; i <= 5; i++) {
  results.push(await ping(i));
  await new Promise((r) => setTimeout(r, 300));
}

const okResults = results.filter((r) => r.ok);
if (okResults.length === 0) {
  console.log('\n❌ Все запросы провалились. Turso скорее всего недоступен из этой сети.');
  process.exit(2);
}

const times = okResults.map((r) => r.ms).sort((a, b) => a - b);
const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
const median = times[Math.floor(times.length / 2)];
const min = times[0];
const max = times[times.length - 1];

console.log(`\n📊 Результаты (${okResults.length}/5 успешных):`);
console.log(`   min:    ${min}ms`);
console.log(`   median: ${median}ms`);
console.log(`   avg:    ${avg}ms`);
console.log(`   max:    ${max}ms`);

console.log('\n💡 Вердикт:');
if (median < 200) console.log('   ✅ Отлично — Turso edge рядом, можно мигрировать');
else if (median < 500) console.log('   ⚠️  Терпимо — но при 6 параллельных запросах страница будет ~1-1.5 сек');
else console.log('   ❌ Плохо — будет хуже чем сейчас с Supabase. Не мигрируй.');
