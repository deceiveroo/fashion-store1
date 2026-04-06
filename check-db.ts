import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

async function checkDatabaseConnection() {
  console.log('Attempting to connect to the database...');
  
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL is not set in environment variables');
    return;
  }
  
  // Update connection string to include sslmode
  if (!connectionString.includes('sslmode')) {
    connectionString += '?sslmode=require';
  }
  
  console.log(`Connecting to: ${connectionString.replace(/:[^:]*@/, ':***@')}`); // Mask the password
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      // Use a more permissive SSL setup for Supabase
      rejectUnauthorized: false
    }
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to the database!');
    
    // Query the current database
    const dbResult = await client.query('SELECT current_database();');
    console.log(`📊 Current database: ${dbResult.rows[0].current_database}`);
    
    // Query the server address
    const addrResult = await client.query('SELECT inet_server_addr();');
    console.log(`📍 Server address: ${addrResult.rows[0].inet_server_addr}`);
    
    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`📋 Tables in public schema (${tablesResult.rows.length}):`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('📋 No tables found in public schema');
    }
    
    client.release();
    await pool.end();
    console.log('\n✅ Database check completed successfully!');
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
    await pool.end();
  }
}

// Run the check
checkDatabaseConnection();