import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/server-auth';
import { db } from '@/lib/db';
import { productImages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { processProductImage } from '@/lib/image-processing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// sharp требует Node.js runtime (не работает на Edge).
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const mediaType = formData.get('mediaType') as string || 'image';
    const order = parseInt(formData.get('order') as string || '0');
    const isMain = formData.get('isMain') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (mediaType === 'video' && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid video format. Allowed: MP4, WebM, MOV' },
        { status: 400 }
      );
    }

    if (mediaType === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image format. Allowed: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // File size limits: 10MB for images, 50MB for videos
    const maxSize = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${mediaType === 'video' ? '50MB' : '10MB'}` },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Для фото: нормализуем через sharp (resize до 2000px + WebP q90 + EXIF-поворот).
    // Видео заливаем как есть. При сбое sharp на редком формате — откат на оригинал.
    let uploadBody: Buffer | File = file;
    let uploadContentType = file.type;
    let fileExt = file.name.split('.').pop();

    if (mediaType === 'image') {
      try {
        const processed = await processProductImage(await file.arrayBuffer(), file.type);
        uploadBody = processed.buffer;
        uploadContentType = processed.contentType;
        fileExt = 'webp';
      } catch (e) {
        console.error('Image processing failed, uploading original:', e);
      }
    }

    // Generate unique filename
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${productId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, uploadBody, {
        cacheControl: '3600',
        upsert: false,
        contentType: uploadContentType,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // For videos, generate thumbnail (optional - can be done client-side)
    let thumbnailUrl = null;
    let duration = null;

    // If it's a video and a thumbnail was provided
    const thumbnailFile = formData.get('thumbnail') as File;
    if (thumbnailFile && mediaType === 'video') {
      const thumbFileName = `${crypto.randomUUID()}-thumb.jpg`;
      const thumbPath = `products/${productId}/${thumbFileName}`;
      
      const { error: thumbError } = await supabase.storage
        .from('uploads')
        .upload(thumbPath, thumbnailFile, {
          cacheControl: '3600',
          contentType: 'image/jpeg',
        });

      if (!thumbError) {
        const { data: { publicUrl: thumbUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrl;
      }
    }

    // Get duration if provided
    const durationParam = formData.get('duration');
    if (durationParam) {
      duration = parseInt(durationParam as string);
    }

    // If this is marked as main, unmark other main images/videos
    if (isMain) {
      await db
        .update(productImages)
        .set({ isMain: false })
        .where(eq(productImages.productId, productId));
    }

    // Save to database
    const [newMedia] = await db
      .insert(productImages)
      .values({
        productId,
        url: publicUrl,
        altText: file.name,
        isMain,
        order,
        mediaType,
        duration,
        thumbnailUrl,
      })
      .returning();

    return NextResponse.json({
      success: true,
      media: newMedia,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Извлекает путь внутри бакета `uploads` из публичного URL Supabase.
// Формат: https://xxx.supabase.co/storage/v1/object/public/uploads/products/<id>/<file>
function extractStoragePath(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/uploads\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Удаление одного фото/видео товара.
 * Принимает ?imageId=... (или ?url=...). Удаляет запись из productImages
 * И физический файл из Supabase Storage (+ thumbnail для видео).
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userRole = (session.user as any).role;
    if (userRole !== 'admin' && userRole !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    const urlParam = searchParams.get('url');

    if (!imageId && !urlParam) {
      return NextResponse.json({ error: 'imageId or url is required' }, { status: 400 });
    }

    // Находим запись, чтобы узнать url/thumbnail для очистки Storage.
    const rows = imageId
      ? await db.select().from(productImages).where(eq(productImages.id, imageId)).limit(1)
      : await db.select().from(productImages).where(eq(productImages.url, urlParam!)).limit(1);

    const row = rows[0];

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Чистим Storage по тем URL, что знаем (из БД или из параметра).
    const urlsToRemove = [row?.url, row?.thumbnailUrl, urlParam].filter(
      (u): u is string => Boolean(u)
    );
    const paths = Array.from(
      new Set(urlsToRemove.map(extractStoragePath).filter((p): p is string => Boolean(p)))
    );
    if (paths.length > 0) {
      const { error: removeError } = await supabase.storage.from('uploads').remove(paths);
      if (removeError) {
        // Не валим запрос — запись из БД всё равно удалим, файл можно дочистить позже.
        console.error('Storage remove error:', removeError.message);
      }
    }

    // Удаляем запись из БД (по id, если он есть, иначе по url).
    if (row?.id) {
      await db.delete(productImages).where(eq(productImages.id, row.id));
    } else if (urlParam) {
      await db.delete(productImages).where(eq(productImages.url, urlParam));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
