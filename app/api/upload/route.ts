import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

async function getUserId(request: NextRequest): Promise<string | null> {
  let userId: string | null = null;

  // Try NextAuth session (cookies)
  const session = await auth();
  if (session?.user?.id) {
    userId = session.user.id;
  } else {
    // Try Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { payload } = await jwtVerify(token, secret);
        userId = payload.userId as string;
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }

  return userId;
}

export async function POST(request: NextRequest) {
  try {
    // Проверяем что пользователь авторизован (любой, не обязательно админ)
    const userId = await getUserId(request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Необходимо авторизоваться' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Файл не предоставлен' }, { status: 400 });
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Неподдерживаемый формат файла. Разрешены: JPEG, PNG, WebP, GIF' },
        { status: 400 }
      );
    }

    // Проверка размера файла (5MB максимум)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой. Максимальный размер: 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Создаем уникальное имя файла
    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Путь для сохранения файла - в папку uploads/products
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    
    // Создаем папку если не существует
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, fileName);

    // Сохраняем файл
    await writeFile(filePath, buffer);

    // URL для доступа к файлу
    const url = `/uploads/products/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      url,
      fileName: file.name,
      message: 'Файл успешно загружен'
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: 'Ошибка при загрузке файла',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
