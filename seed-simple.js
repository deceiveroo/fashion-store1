const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Creating products...\n');
    
    for (let i = 1; i <= 10; i++) {
      const productId = `prod-${i}`;
      const gender = i <= 5 ? 'male' : 'female';
      const name = gender === 'male' ? `Мужской товар ${i}` : `Женский товар ${i}`;
      const price = Math.floor(Math.random() * 10000) + 1000;
      const categoryId = gender === 'male' ? 'men' : 'women';
      
      // Insert product
      await pool.query(
        "INSERT INTO products (id, name, description, price, in_stock, featured) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
        [productId, name, `Описание для ${name}`, price, true, i <= 3]
      );
      
      // Insert image  
      await pool.query(
        'INSERT INTO product_images (id, product_id, url, is_main, "order") VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
        [`img-${productId}`, productId, `https://placehold.co/400x400/3b82f6/white?text=Product+${i}`, true, 0]
      );
      
      // Insert category link with generated UUID
      const pcId = uuidv4();
      await pool.query(
        'INSERT INTO product_category (id, product_id, category_id) VALUES ($1, $2, $3)',
        [pcId, productId, categoryId]
      );
      
      console.log(`✓ Product ${i}/10: ${name}`);
    }
    
    console.log('\n✓ Successfully created 10 products!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
  
  process.exit(0);
})();
