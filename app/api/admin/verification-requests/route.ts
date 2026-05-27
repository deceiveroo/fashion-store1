import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { userProfiles, userVerificationRequests, users } from '@/lib/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';
import { decrypt } from '@/lib/encryption';
import { logAudit } from '@/lib/audit';

/**
 * Получить все заявки на верификацию (только для админов)
 * GET /api/admin/verification-requests
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin?.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await db
      .select({
        id: userVerificationRequests.id,
        userId: userVerificationRequests.userId,
        firstName: userVerificationRequests.firstName,
        lastName: userVerificationRequests.lastName,
        middleName: userVerificationRequests.middleName,
        passportSeries: userVerificationRequests.passportSeries,
        passportNumber: userVerificationRequests.passportNumber,
        issuedBy: userVerificationRequests.issuedBy,
        issueDate: userVerificationRequests.issueDate,
        departmentCode: userVerificationRequests.departmentCode,
        dateOfBirth: userVerificationRequests.dateOfBirth,
        phoneNumber: userVerificationRequests.phoneNumber,
        additionalInfo: userVerificationRequests.additionalInfo,
        passportPhotoFrontUrl: userVerificationRequests.passportPhotoFrontUrl,
        passportPhotoBackUrl: userVerificationRequests.passportPhotoBackUrl,
        selfieWithPassportUrl: userVerificationRequests.selfieWithPassportUrl,
        status: userVerificationRequests.status,
        reviewedBy: userVerificationRequests.reviewedBy,
        reviewedAt: userVerificationRequests.reviewedAt,
        rejectionReason: userVerificationRequests.rejectionReason,
        createdAt: userVerificationRequests.createdAt,
        updatedAt: userVerificationRequests.updatedAt,
      })
      .from(userVerificationRequests)
      .orderBy(desc(userVerificationRequests.createdAt));

    // Audit: admin viewed the entire verification queue (sensitive — passport data exposed).
    await logAudit({
      actorId: admin.id,
      actorEmail: admin.email,
      action: 'verification.list',
      resourceType: 'verification_request',
      headers: request.headers,
      meta: { count: requests.length },
    });

    const ids = Array.from(
      new Set(
        [
          ...requests.map((r) => r.userId),
          ...requests.map((r) => r.reviewedBy).filter((x): x is string => Boolean(x)),
        ].filter(Boolean)
      )
    );

    const usersWithProfiles = ids.length
      ? await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            image: users.image,
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            avatar: userProfiles.avatar,
          })
          .from(users)
          .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
          .where(inArray(users.id, ids))
      : [];

    const userMap = new Map(
      usersWithProfiles.map((u) => [
        u.id,
        {
          id: u.id,
          email: u.email,
          firstName: u.firstName ?? null,
          lastName: u.lastName ?? null,
          avatarUrl: u.avatar ?? u.image ?? null,
        },
      ])
    );

    return NextResponse.json({
      requests: requests.map((req) => {
        // Дешифруем паспортные данные для администратора с поддержкой обратной совместимости
        let passportSeries = req.passportSeries || '';
        let passportNumber = req.passportNumber || '';
        let issuedBy = req.issuedBy || '';
        let departmentCode = req.departmentCode || '';

        try {
          if (passportSeries && passportSeries.includes(':')) {
            passportSeries = decrypt(passportSeries);
          }
          if (passportNumber && passportNumber.includes(':')) {
            passportNumber = decrypt(passportNumber);
          }
          if (issuedBy && issuedBy.includes(':')) {
            issuedBy = decrypt(issuedBy);
          }
          if (departmentCode && departmentCode.includes(':')) {
            departmentCode = decrypt(departmentCode);
          }
        } catch (e) {
          console.error('Decryption failed for verification request:', req.id, e);
        }

        return {
          ...req,
          passportSeries,
          passportNumber,
          issuedBy,
          departmentCode: departmentCode || null,
          userInfo:
            userMap.get(req.userId) ??
            ({
              id: req.userId,
              email: '',
              firstName: null,
              lastName: null,
              avatarUrl: null,
            } as const),
          reviewerInfo: req.reviewedBy ? userMap.get(req.reviewedBy) ?? null : null,
        };
      }),
    });
  } catch (error) {
    console.error('[ADMIN VERIFICATION] Error fetching requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification requests' },
      { status: 500 }
    );
  }
}
