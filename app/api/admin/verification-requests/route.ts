import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userVerificationRequests, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

/**
 * Получить все заявки на верификацию (только для админов)
 * GET /api/admin/verification-requests
 */
export async function GET() {
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

    // Получаем все заявки с данными пользователей
    const requests = await db.query.userVerificationRequests.findMany({
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });

    return NextResponse.json({
      requests: requests.map(req => ({
        id: req.id,
        userId: req.userId,
        userInfo: req.user,
        firstName: req.firstName,
        lastName: req.lastName,
        middleName: req.middleName,
        passportSeries: req.passportSeries,
        passportNumber: req.passportNumber,
        issuedBy: req.issuedBy,
        issueDate: req.issueDate,
        departmentCode: req.departmentCode,
        dateOfBirth: req.dateOfBirth,
        phoneNumber: req.phoneNumber,
        additionalInfo: req.additionalInfo,
        passportPhotoFrontUrl: req.passportPhotoFrontUrl,
        passportPhotoBackUrl: req.passportPhotoBackUrl,
        selfieWithPassportUrl: req.selfieWithPassportUrl,
        status: req.status,
        reviewedBy: req.reviewedBy,
        reviewerInfo: req.reviewer,
        reviewedAt: req.reviewedAt,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      })),
    });
  } catch (error) {
    console.error('[ADMIN VERIFICATION] Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}
