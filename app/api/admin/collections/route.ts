import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { curatedCollections } from '@/lib/schema';
import { asc } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';

// GET /api/admin/collections - Get all collections
export async function GET() {
  try {
    const collections = await safeQuery(() =>
      db
        .select()
        .from(curatedCollections)
        .orderBy(asc(curatedCollections.sortOrder), asc(curatedCollections.createdAt))
    );

    return NextResponse.json({
      collections: collections || [],
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/admin/collections - Create new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, coverImage, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const collection = await safeQuery(() =>
      db.insert(curatedCollections).values({
        name,
        slug,
        description: description || null,
        coverImage: coverImage || null,
        isActive: isActive !== undefined ? isActive : true,
      }).returning()
    );

    return NextResponse.json({
      collection: collection?.[0],
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
