import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userVerificationRequests, users } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { isStaff } from '@/lib/server-auth';

/**
 * Получить все заявки на верификацию (для админа)
 * GET /api/admin/verification-requests
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isStaff();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, approved, rejected
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Строим запрос
    let query = db.query.userVerificationRequests.findMany({
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [desc(userVerificationRequests.createdAt)],
      limit,
      offset,
    });

    // Фильтр по статусу если указан
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query = db.query.userVerificationRequests.findMany({
        where: eq(userVerificationRequests.status, status as 'pending' | 'approved' | 'rejected'),
        with: {
          user: {
            columns: {
              id: true,
              email: true,
              name: true,
            },
          },
          reviewer: {
            columns: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: [desc(userVerificationRequests.createdAt)],
        limit,
        offset,
      });
    }

    const requests = await query;

    // Получаем общее количество
    const countQuery = status
      ? db.$count(userVerificationRequests, eq(userVerificationRequests.status, status as 'pending' | 'approved' | 'rejected'))
      : db.$count(userVerificationRequests);
    
    const total = await countQuery;

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching verification requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}

/**
 * Одобрить или отклонить заявку на верификацию
 * POST /api/admin/verification-requests/[id]/review
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isStaff();
    
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const requestId = url.pathname.split('/').pop();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    const { action, rejectionReason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Если отклоняем, нужна причина
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Проверяем существование заявки
    const existingRequest = await db.query.userVerificationRequests.findFirst({
      where: eq(userVerificationRequests.id, requestId),
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    if (existingRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been reviewed' },
        { status: 400 }
      );
    }

    // Обновляем заявку
    await db
      .update(userVerificationRequests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason : null,
      })
      .where(eq(userVerificationRequests.id, requestId));

    // Если одобрено, помечаем пользователя как верифицированного
    if (action === 'approve') {
      await db
        .update(users)
        .set({
          isVerified: true,
          verifiedAt: new Date(),
        })
        .where(eq(users.id, existingRequest.userId));
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Заявка одобрена. Пользователь верифицирован.'
        : 'Заявка отклонена.',
    });
  } catch (error) {
    console.error('[ADMIN] Error reviewing verification request:', error);
    return NextResponse.json(
      { error: 'Failed to review verification request' },
      { status: 500 }
    );
  }
}
