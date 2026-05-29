import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bundleDeals } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { safeQuery } from '@/lib/db';
import { isStaff } from '@/lib/server-auth';

// PUT /api/admin/bundles/[id] - Update bundle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, discountPercent, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug exists for another bundle
    const existing = await safeQuery(() =>
      db.select().from(bundleDeals).where(eq(bundleDeals.slug, slug)).limit(1)
    );

    if (existing && existing.length > 0 && existing[0].id !== id) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const [updated] = await safeQuery(() =>
      db.update(bundleDeals)
        .set({
          name,
          slug,
          description: description || null,
          discountPercent: discountPercent || 0,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        })
        .where(eq(bundleDeals.id, id))
        .returning()
    ) || [];

    if (!updated) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      bundle: updated,
    });
  } catch (error) {
    console.error('Error updating bundle:', error);
    return NextResponse.json(
      { error: 'Failed to update bundle' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/bundles/[id] - Delete bundle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await isStaff()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id } = await params;

    const deleted = await safeQuery(() =>
      db.delete(bundleDeals).where(eq(bundleDeals.id, id)).returning()
    );

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting bundle:', error);
    return NextResponse.json(
      { error: 'Failed to delete bundle' },
      { status: 500 }
    );
  }
}
