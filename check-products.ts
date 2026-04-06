import { db } from './lib/db';
import { products } from './lib/schema';

(async () => {
  try {
    const result = await db.select().from(products).limit(5);
    console.log('Products found:', result.length);
    if (result.length > 0) {
      console.log('Sample product:', result[0]);
    } else {
      console.log('No products in database');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
