import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bundleDeals } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';
import { isStaff } from '@/lib/server-auth';

// GET /api/admin/bundles - Get all bundles
export async function GET() {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const bundles = await safeQuery(() =>
      db.select().from(bundleDeals).orderBy(eq(bundleDeals.isActive, true))
    );

    return NextResponse.json({
      bundles: bundles || [],
    });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/bundles - Create new bundle
export async function POST(request: NextRequest) {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await request.json();
    const { name, slug, description, discountPercent, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await safeQuery(() =>
      db.select().from(bundleDeals).where(eq(bundleDeals.slug, slug)).limit(1)
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const [bundle] = await safeQuery(() =>
      db.insert(bundleDeals).values({
        name,
        slug,
        description: description || null,
        discountPercent: discountPercent || 0,
        isActive: isActive !== undefined ? isActive : true,
      }).returning()
    ) || [];

    return NextResponse.json({
      success: true,
      bundle,
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle' },
      { status: 500 }
    );
  }
}
