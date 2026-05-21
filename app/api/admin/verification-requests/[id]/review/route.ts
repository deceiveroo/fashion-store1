import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userVerificationRequests, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

/**
 * Одобрить или отклонить заявку на верификацию
 * POST /api/admin/verification-requests/[id]/review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем что пользователь - админ
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        role: true,
      },
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requestId = params.id;
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Находим заявку
    const verificationRequest = await db.query.userVerificationRequests.findFirst({
      where: eq(userVerificationRequests.id, requestId),
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: 'Verification request not found' },
        { status: 404 }
      );
    }

    if (verificationRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been reviewed' },
        { status: 400 }
      );
    }

    // Обновляем заявку и статус пользователя в транзакции
    await db.transaction(async (tx) => {
      // Обновляем заявку
      await tx.update(userVerificationRequests).set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: action === 'reject' ? rejectionReason || null : null,
      }).where(eq(userVerificationRequests.id, requestId));

      // Если одобрено - обновляем статус пользователя
      if (action === 'approve') {
        await tx.update(users).set({
          isVerified: true,
          verifiedAt: new Date(),
        }).where(eq(users.id, verificationRequest.userId));
      } else {
        // Если отклонено - снимаем верификацию если была
        await tx.update(users).set({
          isVerified: false,
          verifiedAt: null,
        }).where(eq(users.id, verificationRequest.userId));
      }
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Заявка одобрена. Пользователь верифицирован.' 
        : 'Заявка отклонена.',
    });
  } catch (error) {
    console.error('[ADMIN VERIFICATION REVIEW] Error:', error);
    return NextResponse.json(
      { error: 'Failed to review verification request' },
      { status: 500 }
    );
  }
}
