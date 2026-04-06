import { config } from 'dotenv'
import { execSync } from 'child_process'

config({ path: '.env' })
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

if (!process.env.DATABASE_URL) { 
  console.error('DATABASE_URL missing'); 
  process.exit(1); 
}

try {
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit', 
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL, NODE_TLS_REJECT_UNAUTHORIZED: '0' } 
  });
} catch (error) {
  process.exit(1);
}
