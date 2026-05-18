require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function checkProductImages() {
  try {
    console.log('Checking images for product elevate-c-001...\n');
    
    // Check product_images table
    const result = await pool.query(`
      SELECT id, product_id, url, is_primary, sort_order
      FROM product_images
      WHERE product_id = 'elevate-c-001'
      ORDER BY sort_order
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No images found in product_images table');
    } else {
      console.log(`✅ Found ${result.rows.length} image(s):\n`);
      result.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. ID: ${row.id}`);
        console.log(`   URL: ${row.url}`);
        console.log(`   Is Main: ${row.is_primary}`);
        console.log(`   Order: ${row.sort_order}\n`);
      });
    }
    
    // Also check products table for mainImage field
    const productResult = await pool.query(`
      SELECT id, name, images
      FROM products
      WHERE id = 'elevate-c-001'
    `);
    
    if (productResult.rows.length > 0) {
      const product = productResult.rows[0];
      console.log('\nProduct info:');
      console.log(`Name: ${product.name}`);
      console.log(`Images (JSON column): ${product.images ? product.images : 'NULL'}`);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkProductImages();
