import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteContent } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret');

// GET /api/admin/content - Get all content items
export async function GET(request: NextRequest) {
  try {
    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // filter by type
    const published = searchParams.get('published'); // filter by published status

    let query = db.select().from(siteContent);

    const conditions = [];
    if (type) {
      conditions.push(eq(siteContent.type, type));
    }
    if (published !== null) {
      conditions.push(eq(siteContent.published, published === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : and(...conditions));
    }

    const content = await query.orderBy(siteContent.sortOrder, siteContent.createdAt);

    return NextResponse.json({
      content: content || [],
      total: content?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

// POST /api/admin/content - Create new content
export async function POST(request: NextRequest) {
  try {
    const staffUser = await isStaff();
    if (!staffUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, slug, content, imageUrl, published, sortOrder, metaDescription } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    // If slug provided, check uniqueness
    if (slug) {
      const existing = await db
        .select()
        .from(siteContent)
        .where(eq(siteContent.slug, slug))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 409 }
        );
      }
    }

    const newContent = await db
      .insert(siteContent)
      .values({
        type,
        title,
        slug: slug || null,
        content: content || null,
        imageUrl: imageUrl || null,
        published: published !== undefined ? published : false,
        sortOrder: sortOrder || 0,
        metaDescription: metaDescription || null,
        createdBy: staffUser.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      content: newContent[0],
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
