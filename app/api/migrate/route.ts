import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Allow migration to run without auth check for initial setup

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Add missing columns to orders table
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0;
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'courier';
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient JSONB;
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS comment TEXT;
      `);
      
      await client.query(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
      `);

      // Add missing columns to order_items table
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT;
      `);
      
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT;
      `);
      
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size TEXT;
      `);
      
      await client.query(`
        ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT;
      `);

      // Update existing order_items to have a name
      await client.query(`
        UPDATE order_items 
        SET name = COALESCE(
          (SELECT products.name FROM products WHERE products.id = order_items.product_id),
          'Product'
        )
        WHERE name IS NULL;
      `);

      // Make name NOT NULL after populating
      await client.query(`
        ALTER TABLE order_items ALTER COLUMN name SET NOT NULL;
      `);

      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Migration completed successfully' 
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
