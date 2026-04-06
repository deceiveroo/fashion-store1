import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const categoriesList = await db.select().from(categories);
    
    return NextResponse.json(categoriesList);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    return NextResponse.json(
      { error: 'Ошибка сервера при получении категорий' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, parentId, isFeatured } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Название и slug обязательны' },
        { status: 400 }
      );
    }

    const newCategory = await db.insert(categories).values({
      id: uuidv4(),
      name,
      slug,
      parentId: parentId || null,
      isFeatured: isFeatured || false,
    }).returning();

    return NextResponse.json(newCategory[0], { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании категории' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, name, slug, parentId, isFeatured } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID категории обязателен' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

    const updated = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: 'ID категории обязателен' },
        { status: 400 }
      );
    }

    const deleted = await db.delete(categories)
      .where(eq(categories.id, categoryId))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении категории' },
      { status: 500 }
    );
  }
}
