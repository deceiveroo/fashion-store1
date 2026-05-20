const { createClient } = require('@supabase/supabase-js');

// Get service role key from command line argument or .env.local
const supabaseKey = process.argv[2] || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseUrl = 'https://norjvtaujxlbdbqgkmwd.supabase.co';

if (!supabaseKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('\nUsage:');
  console.error('  node check-achievements.js <SERVICE_ROLE_KEY>');
  console.error('\nOr set environment variable:');
  console.error('  export SUPABASE_SERVICE_ROLE_KEY=your_key');
  console.error('  node check-achievements.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAchievements() {
  console.log('🔍 Checking achievements table...\n');

  // Check if achievements table exists and has data
  const { data: achievements, error } = await supabase
    .from('achievements')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ Error checking achievements:', error.message);
    
    if (error.message.includes('does not exist')) {
      console.log('\n⚠️  Achievements table does not exist!');
      console.log('You need to run the migration first:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy content from: migrations/complete-achievement-system.sql');
      console.log('3. Click "Run" to execute\n');
    }
    return;
  }

  console.log(`✅ Found ${achievements?.length || 0} achievements (showing first 5):\n`);
  
  if (achievements && achievements.length > 0) {
    achievements.forEach((ach, i) => {
      console.log(`${i + 1}. ${ach.code}`);
      console.log(`   Name: ${ach.name}`);
      console.log(`   XP: ${ach.xp_reward}, Coins: ${ach.coins_reward}`);
      console.log(`   Category: ${ach.category}\n`);
    });
  } else {
    console.log('⚠️  Achievements table is EMPTY!');
    console.log('\nTo populate it, run:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste content from: migrations/complete-achievement-system.sql');
    console.log('3. Click "Run"\n');
  }

  // Check user_achievements table
  console.log('Checking user_achievements table...');
  const { count: userAchCount, error: userAchError } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true });

  if (userAchError) {
    console.error('❌ Error checking user_achievements:', userAchError.message);
  } else {
    console.log(`✅ Found ${userAchCount || 0} unlocked achievements across all users\n`);
  }

  // Check user_levels table
  console.log('Checking user_levels table...');
  const { count: userLevelsCount, error: userLevelsError } = await supabase
    .from('user_levels')
    .select('*', { count: 'exact', head: true });

  if (userLevelsError) {
    console.error('❌ Error checking user_levels:', userLevelsError.message);
  } else {
    console.log(`✅ Found ${userLevelsCount || 0} user level records\n`);
  }

  console.log('═══════════════════════════════════════');
  console.log('Summary:');
  console.log(`- Achievements in DB: ${achievements?.length || 0}`);
  console.log(`- User achievements: ${userAchCount || 0}`);
  console.log(`- User levels: ${userLevelsCount || 0}`);
  console.log('═══════════════════════════════════════\n');

  if (!achievements || achievements.length === 0) {
    console.log('📝 TO FIX: Run the migration SQL file');
    console.log('   File: migrations/complete-achievement-system.sql');
    console.log('   Location: Supabase Dashboard → SQL Editor\n');
  }
}

checkAchievements().catch(console.error);
