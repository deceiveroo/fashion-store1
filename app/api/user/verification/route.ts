import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userVerificationRequests, users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/server-auth';

/**
 * Получить статус верификации текущего пользователя
 * GET /api/user/verification/status
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем есть ли активная заявка
    const existingRequest = await db.query.userVerificationRequests.findFirst({
      where: eq(userVerificationRequests.userId, session.user.id),
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });

    // Получаем статус верификации пользователя
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        isVerified: true,
        verifiedAt: true,
      },
    });

    return NextResponse.json({
      isVerified: user?.isVerified || false,
      verifiedAt: user?.verifiedAt,
      hasPendingRequest: existingRequest?.status === 'pending',
      latestRequest: existingRequest ? {
        id: existingRequest.id,
        status: existingRequest.status,
        createdAt: existingRequest.createdAt,
        rejectionReason: existingRequest.rejectionReason,
      } : null,
    });
  } catch (error) {
    console.error('[VERIFICATION] Error getting status:', error);
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}

/**
 * Подать заявку на верификацию
 * POST /api/user/verification/submit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const {
      firstName,
      lastName,
      middleName,
      passportSeries,
      passportNumber,
      issuedBy,
      issueDate,
      departmentCode,
      dateOfBirth,
      phoneNumber,
      additionalInfo,
      passportPhotoFrontUrl,
      passportPhotoBackUrl,
      selfieWithPassportUrl,
    } = body;

    // Валидация обязательных полей
    if (!firstName || !lastName || !passportSeries || !passportNumber || 
        !issuedBy || !issueDate || !dateOfBirth || !phoneNumber) {
      return NextResponse.json(
        { error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      );
    }

    // Проверка что нет активной заявки
    const existingRequest = await db.query.userVerificationRequests.findFirst({
      where: eq(userVerificationRequests.userId, session.user.id),
    });

    if (existingRequest && existingRequest.status === 'pending') {
      return NextResponse.json(
        { error: 'У вас уже есть активная заявка на верификацию' },
        { status: 400 }
      );
    }

    // Создаем новую заявку
    const requestId = crypto.randomUUID();
    await db.insert(userVerificationRequests).values({
      id: requestId,
      userId: session.user.id,
      firstName: firstName as string,
      lastName: lastName as string,
      middleName: middleName || null,
      passportSeries: passportSeries as string,
      passportNumber: passportNumber as string,
      issuedBy: issuedBy as string,
      issueDate: new Date(issueDate),
      departmentCode: departmentCode || null,
      dateOfBirth: new Date(dateOfBirth),
      phoneNumber: phoneNumber as string,
      additionalInfo: additionalInfo || null,
      passportPhotoFrontUrl: passportPhotoFrontUrl || null,
      passportPhotoBackUrl: passportPhotoBackUrl || null,
      selfieWithPassportUrl: selfieWithPassportUrl || null,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Заявка на верификацию успешно подана',
    });
  } catch (error) {
    console.error('[VERIFICATION] Error submitting request:', error);
    return NextResponse.json(
      { error: 'Не удалось подать заявку на верификацию' },
      { status: 500 }
    );
  }
}
