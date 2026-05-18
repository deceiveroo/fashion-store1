import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { inArray } from 'drizzle-orm';

// GET /api/maintenance/status - Get public maintenance status (no auth required)
export async function GET() {
  try {
    // Fetch all maintenance-related settings
    const keys = [
      'maintenance_mode',
      'maintenance_title',
      'maintenance_description',
      'maintenance_end_time',
      'maintenance_background_image',
      'maintenance_enable_subscription',
    ];

    const result = await db.select().from(settings).where(
      inArray(settings.key, keys)
    );

    // Convert to key-value object
    const config: Record<string, string | null> = {};
    result.forEach((row) => {
      config[row.key] = row.value;
    });

    return NextResponse.json({
      maintenanceMode: config.maintenance_mode === 'true',
      title: config.maintenance_title || 'Сайт на обслуживании',
      description: config.maintenance_description || 'Мы проводим технические работы. Сайт скоро будет доступен.',
      endTime: config.maintenance_end_time || null,
      backgroundImage: config.maintenance_background_image || null,
      enableSubscription: config.maintenance_enable_subscription !== 'false',
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
