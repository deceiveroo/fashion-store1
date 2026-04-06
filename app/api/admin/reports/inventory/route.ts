import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { getSession, isStaff } from '@/lib/server-auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !(await isStaff())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        price: products.price,
        inStock: products.inStock,
      })
      .from(products);

    const inventory = productsList.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.id,
      stock: product.inStock ? 'В наличии' : 'Нет в наличии',
      price: Number(product.price),
      inStock: product.inStock,
    }));

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Inventory report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
