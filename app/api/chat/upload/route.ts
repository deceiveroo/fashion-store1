import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Только изображения: JPEG, PNG, WebP, GIF' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Максимум 5MB' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.jpg';
    const fileName = `chat/${uuidv4()}${ext}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, Buffer.from(bytes), {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[CHAT UPLOAD]', error.message);
      return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('[CHAT UPLOAD]', error.message);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
