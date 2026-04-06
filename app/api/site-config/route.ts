import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema'; // Используем settings вместо siteConfig
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Fetch all site configuration values from the database
    const configRows = await db.select().from(settings);
    
    // Convert the rows to a key-value object
    const config: Record<string, any> = {};
    configRows.forEach(row => {
      try {
        // Attempt to parse the value as JSON, fallback to raw value
        config[row.key] = typeof row.value === 'string' && row.value.startsWith('{') 
          ? JSON.parse(row.value) 
          : row.value;
      } catch {
        // If parsing fails, use the raw value
        config[row.key] = row.value;
      }
    });

    return NextResponse.json({
      theme: config.theme || 'minimal',
      accentColor: config.accentColor || '#6366f1',
      cardStyle: config.cardStyle || 'lifted',
      buttonStyle: config.buttonStyle || 'rounded',
      ...config
    });
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch site configuration',
        config: {
          theme: 'minimal',
          accentColor: '#6366f1',
          cardStyle: 'lifted',
          buttonStyle: 'rounded',
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { key, value, description } = await request.json();
    
    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }
    
    // Check if config already exists
    const [existingConfig] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    
    if (existingConfig) {
      // Update existing config
      await db
        .update(settings)
        .set({ 
          value: JSON.stringify(value), 
          description: description || existingConfig.description,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key));
    } else {
      // Insert new config
      await db.insert(settings).values({
        key,
        value: JSON.stringify(value),
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Configuration ${key} updated successfully` 
    });
  } catch (error) {
    console.error('Error updating site config:', error);
    return NextResponse.json(
      { error: 'Failed to update site configuration' },
      { status: 500 }
    );
  }
}