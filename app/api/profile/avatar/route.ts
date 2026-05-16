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

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

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
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { error } = await supabase.storage.from('uploads').upload(fileName, buffer, {
    contentType,
    upsert: true,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

async function uploadToLocal(buffer: Buffer, userId: string, ext: string) {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(dir, { recursive: true });
  const fileName = `${userId}-${Date.now()}${ext}`;
  await writeFile(path.join(dir, fileName), buffer);
  return `/uploads/avatars/${fileName}`;
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

    let publicUrl: string | null = null;
    try {
      publicUrl = await uploadToSupabase(buffer, storagePath, file.type);
    } catch (e) {
      console.warn('[avatar] Supabase upload failed, using local storage', e);
    }
    if (!publicUrl) {
      publicUrl = await uploadToLocal(buffer, userId, ext);
    }

    const existing = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await safeQuery(() =>
        db
          .update(userProfiles)
          .set({ avatar: publicUrl, updatedAt: new Date() })
          .where(eq(userProfiles.userId, userId))
      );
    } else {
      await safeQuery(() =>
        db.insert(userProfiles).values({
          id: crypto.randomUUID(),
          userId,
          avatar: publicUrl,
        })
      );
    }

    await safeQuery(() =>
      db.update(users).set({ image: publicUrl, updatedAt: new Date() }).where(eq(users.id, userId))
    );

    return NextResponse.json({ success: true, url: publicUrl, avatar: publicUrl });
  } catch (error) {
    console.error('[avatar]', error);
    return NextResponse.json({ error: 'Ошибка загрузки аватара' }, { status: 500 });
  }
}
