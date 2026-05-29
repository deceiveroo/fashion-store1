import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { getJwtSecret } from '@/lib/jwt-secret';
import { processProductImage } from '@/lib/image-processing';

// sharp требует Node.js runtime (не работает на Edge).
export const runtime = 'nodejs';

const secret = getJwtSecret();

// 创建 Supabase 客户端的函数，仅在运行时调用
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase URL и/или Service Role Key не настроены в переменных окружения');
  }
  
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) return session.user.id;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string;
    } catch {}
  }
  return null;
}

// Extract storage path from public URL
function extractStoragePath(url: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/uploads/file.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 初始化 Supabase 客户端（仅在运行时）
    const supabase = getSupabaseClient();
    
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const oldUrl = formData.get('oldUrl') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Разрешены только изображения: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимум: 5MB' }, { status: 400 });
    }

    // Delete old file if provided
    if (oldUrl) {
      const oldPath = extractStoragePath(oldUrl);
      if (oldPath) {
        await supabase.storage.from('uploads').remove([oldPath]);
      }
    }

    const bytes = await file.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes);
    let contentType = file.type;
    let ext = path.extname(file.name) || '.jpg';

    // Нормализуем фото через sharp: resize до 2000px + WebP q90 + EXIF-поворот.
    // При сбое на редком формате — откат на оригинальный буфер.
    try {
      const processed = await processProductImage(buffer, file.type);
      buffer = processed.buffer;
      contentType = processed.contentType;
      ext = processed.ext;
    } catch (e) {
      console.error('[UPLOAD] Image processing failed, using original:', e);
    }

    const fileName = `products/${uuidv4()}${ext}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('[UPLOAD] Supabase error:', error.message);
      return NextResponse.json({ error: 'Ошибка загрузки файла' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[UPLOAD] Error:', errorMessage);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}