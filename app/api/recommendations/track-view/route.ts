import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { productViews } from '@/lib/schema';
import { safeQuery } from '@/lib/db';

// POST /api/recommendations/track-view
export async function POST(request: NextRequest) {
  try {
    const { productId, userId, sessionId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Track the view
    await safeQuery(() =>
      db.insert(productViews).values({
        productId,
        userId: userId || null,
        sessionId: sessionId || null,
        viewedAt: new Date(),
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking product view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
