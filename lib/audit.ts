import { db } from '@/lib/db';
import { auditLog } from '@/lib/schema';

interface AuditEntry {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;             // 'verification.view', 'verification.approve', 'verification.reject'
  resourceType: string;       // 'verification_request'
  resourceId?: string | null;
  headers?: Headers;
  meta?: Record<string, unknown>;
}

function clientIp(headers: Headers | undefined): string | null {
  if (!headers) return null;
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') || null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorId: entry.actorId ?? null,
      actorEmail: entry.actorEmail ?? null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      ip: clientIp(entry.headers),
      userAgent: entry.headers?.get('user-agent') || null,
      meta: (entry.meta as any) ?? null,
    });
  } catch (err) {
    // Audit failures must not break the underlying request.
    console.error('[audit] failed to write entry:', err);
  }
}
