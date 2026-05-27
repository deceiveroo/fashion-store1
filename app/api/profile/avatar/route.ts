import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db, safeQuery } from '@/lib/db';
import { userProfiles, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/jwt-secret';

// Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const secret = getJwtSecret();

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

async function uploadToSupabase(buffer: Buffer, fileName: string, contentType: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('[avatar] Supabase URL configured:', !!supabaseUrl);
  console.log('[avatar] Service Role Key configured:', !!supabaseServiceRoleKey);
  
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('[avatar] Supabase credentials missing, will use local storage');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  console.log('[avatar] Uploading to Supabase:', fileName);
  
  const { error } = await supabase.storage.from('uploads').upload(fileName, buffer, {
    contentType,
    upsert: true,
  });
  
  if (error) {
    console.error('[avatar] Supabase upload error:', error.message);
    throw error;
  }

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  console.log('[avatar] Upload successful:', data.publicUrl);
  return data.publicUrl;
}

async function uploadToLocal(buffer: Buffer, userId: string, ext: string) {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(dir, { recursive: true });
  const fileName = `${userId}-${Date.now()}${ext}`;
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/avatars/${fileName}`;
}

async function deleteOldAvatar(oldUrl: string | null) {
  if (!oldUrl) return;
  
  try {
    // Проверяем что это URL из Supabase
    if (oldUrl.includes('supabase.co/storage')) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceRoleKey) return;
      
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      // Извлекаем путь к файлу из URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/uploads/avatars/userId/file.jpg
      const match = oldUrl.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
      if (match && match[1]) {
        const filePath = match[1];
        const { error } = await supabase.storage.from('uploads').remove([filePath]);
        
        if (error) {
          console.warn('[avatar] Failed to delete old avatar:', error.message);
        } else {
          console.log('[avatar] Old avatar deleted:', filePath);
        }
      }
    }
  } catch (error) {
    console.error('[avatar] Error deleting old avatar:', error);
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Необходимо авторизоваться' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Получаем старый URL аватара для удаления
    const oldUrl = formData.get('oldUrl') as string | null;
    
    // Удаляем старый аватар из Supabase Storage
    if (oldUrl) {
      console.log('[avatar] Deleting old avatar:', oldUrl);
      await deleteOldAvatar(oldUrl);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Разрешены только изображения' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимум 5MB' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.jpg';
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storagePath = `avatars/${userId}/${uuidv4()}${ext}`;

    console.log('[avatar] File size:', file.size, 'bytes');
    console.log('[avatar] Storage path:', storagePath);

    let publicUrl: string | null = null;
    
    // Сначала пробуем загрузить в Supabase
    try {
      console.log('[avatar] Attempting Supabase upload...');
      publicUrl = await uploadToSupabase(buffer, storagePath, file.type);
      console.log('[avatar] Supabase upload successful:', publicUrl);
    } catch (e: any) {
      console.error('[avatar] Supabase upload failed:', e.message);
      console.warn('[avatar] Will try local storage as fallback');
    }
    
    // Fallback на локальное хранилище (только для development)
    if (!publicUrl) {
      console.error('[avatar] ERROR: Supabase upload failed and local storage is not available on production');
      console.error('[avatar] Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables');
      throw new Error('Не удалось загрузить аватар. Пожалуйста, настройте переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в Vercel.');
    }

    if (!publicUrl) {
      throw new Error('Failed to upload avatar to any storage');
    }

    console.log('[avatar] Saving to database for user:', userId);

    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      console.log('[avatar] Updating existing profile');
      await safeQuery(() =>
        db
          .update(userProfiles)
          .set({ avatar: publicUrl, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId))
      );
    } else {
      console.log('[avatar] Creating new profile');
      await safeQuery(() =>
        db.insert(userProfiles).values({
          id: crypto.randomUUID(),
          userId,
          avatar: publicUrl,
        })
      );
    }

    console.log('[avatar] Updating users table');
    await safeQuery(() =>
      db.update(users).set({ image: publicUrl, updatedAt: new Date() }).where(eq(users.id, userId))
    );

    console.log('[avatar] Success! Avatar URL:', publicUrl);
    return NextResponse.json({ success: true, url: publicUrl, avatar: publicUrl });
  } catch (error) {
    console.error('[avatar]', error);
    return NextResponse.json({ error: 'Ошибка загрузки аватара' }, { status: 500 });
  }
}
