/**
 * Создаёт или обновляет учётные записи staff с bcrypt-паролями (совместимо с NextAuth).
 * Важно: сначала dotenv, затем динамический import `./db`, иначе DATABASE_URL не подхватится.
 */
import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });
config({ path: '.env' });

/** Один пароль для всех трёх тестовых учёток (смените в продакшене). */
const SHARED_PASSWORD = 'FashionStore2026!';

const STAFF = [
  { id: 'staff-admin-fs', email: 'admin@fashionstore.com', name: 'Fashion Admin', role: 'admin' as const },
  { id: 'staff-manager-fs', email: 'manager@fashionstore.com', name: 'Fashion Manager', role: 'manager' as const },
  { id: 'staff-support-fs', email: 'support@fashionstore.com', name: 'Fashion Support', role: 'support' as const },
];

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error('DATABASE_URL не задан. Проверьте .env / .env.local');
    process.exit(1);
  }

  const { db, pool } = await import('./db');
  const { users } = await import('./schema');

  const hash = await bcrypt.hash(SHARED_PASSWORD, 12);

  try {
    for (let i = 0; i < STAFF.length; i++) {
      const u = STAFF[i];
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 800));
      }

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);

      if (existing) {
        await db
          .update(users)
          .set({
            password: hash,
            role: u.role,
            name: u.name,
            updatedAt: new Date(),
          })
          .where(eq(users.email, u.email));
        console.log(`Обновлён: ${u.email} → ${u.role}`);
      } else {
        await db.insert(users).values({
          id: u.id,
          email: u.email,
          name: u.name,
          password: hash,
          role: u.role,
        });
        console.log(`Создан: ${u.email} → ${u.role}`);
      }
    }
  } finally {
    await pool.end();
  }

  console.log('\nГотово. Пароль для всех трёх аккаунтов:', SHARED_PASSWORD);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
