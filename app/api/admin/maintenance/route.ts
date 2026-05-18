import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// GET /api/admin/maintenance - Get maintenance settings
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all maintenance-related settings
    const keys = [
      'maintenance_mode',
      'maintenance_title',
      'maintenance_description',
      'maintenance_end_time',
      'maintenance_background_image',
      'maintenance_enable_subscription',
      'maintenance_gallery_images',
    ];

    const result = await db.select().from(settings).where(
      // @ts-ignore - Drizzle type issue with inArray
      require('drizzle-orm').inArray(settings.key, keys)
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
      galleryImages: (() => {
        try {
          return JSON.parse(config.maintenance_gallery_images || '[]');
        } catch {
          return [];
        }
      })(),
    });
  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/maintenance - Update maintenance settings
export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      maintenanceMode,
      title,
      description,
      endTime,
      backgroundImage,
      enableSubscription,
      galleryImages,
    } = body;

    // Prepare updates
    const updates = [
      { key: 'maintenance_mode', value: String(maintenanceMode ?? false) },
      { key: 'maintenance_title', value: title || 'Сайт на обслуживании' },
      { key: 'maintenance_description', value: description || 'Мы проводим технические работы. Сайт скоро будет доступен.' },
      { key: 'maintenance_end_time', value: endTime || '' },
      { key: 'maintenance_background_image', value: backgroundImage || '' },
      { key: 'maintenance_enable_subscription', value: String(enableSubscription ?? true) },
      { key: 'maintenance_gallery_images', value: JSON.stringify(galleryImages || []) },
    ];

    // Upsert each setting
    for (const update of updates) {
      await db.insert(settings)
        .values({
          key: update.key,
          value: update.value ?? '',
          description: `Maintenance mode setting: ${update.key}`,
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value: update.value ?? '',
            updatedAt: new Date(),
          },
        });
    }

    // Log the action
    console.log(`[Maintenance Mode] Updated by ${session.user.email}:`, {
      maintenanceMode,
      title,
      endTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
