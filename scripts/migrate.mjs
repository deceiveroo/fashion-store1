import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = "postgresql://postgres:12Botovo3d45-@db.mgprrbrevhzsvgizypov.supabase.co:5432/postgres";

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');

    // Add missing columns to orders table
    console.log('Adding columns to orders table...');
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(10, 2) DEFAULT 0;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'courier';`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS recipient JSONB;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS comment TEXT;`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';`);

    // Add missing columns to order_items table
    console.log('Adding columns to order_items table...');
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS name TEXT;`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS image TEXT;`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size TEXT;`);
    await client.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS color TEXT;`);

    // Update existing order_items to have a name
    console.log('Updating existing order_items...');
    await client.query(`
      UPDATE order_items 
      SET name = COALESCE(
        (SELECT products.name FROM products WHERE products.id = order_items.product_id),
        'Product'
      )
      WHERE name IS NULL;
    `);

    // Make name NOT NULL after populating
    await client.query(`ALTER TABLE order_items ALTER COLUMN name SET NOT NULL;`);

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
