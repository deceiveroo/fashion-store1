const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Конфигурация
const OLD_SUPABASE_URL = process.env.OLD_SUPABASE_URL;
const OLD_SUPABASE_KEY = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
const NEW_SUPABASE_URL = process.env.NEW_SUPABASE_URL;
const NEW_SUPABASE_KEY = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!OLD_SUPABASE_URL || !OLD_SUPABASE_KEY || !NEW_SUPABASE_URL || !NEW_SUPABASE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required:');
  console.error('  OLD_SUPABASE_URL');
  console.error('  OLD_SUPABASE_SERVICE_ROLE_KEY');
  console.error('  NEW_SUPABASE_URL');
  console.error('  NEW_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const oldSupabase = createClient(OLD_SUPABASE_URL, OLD_SUPABASE_KEY);
const newSupabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);

async function listBuckets(supabase) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  return data;
}

async function listFiles(supabase, bucketName, folderPath = '') {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list(folderPath, { limit: 1000 });
  
  if (error) throw error;
  return data;
}

async function downloadFile(supabase, bucketName, filePath) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);
  
  if (error) throw error;
  return data;
}

async function uploadFile(supabase, bucketName, filePath, fileData) {
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileData, { upsert: true });
  
  if (error) throw error;
}

async function migrateBucket(bucketName) {
  console.log(`\n📦 Migrating bucket: ${bucketName}`);
  
  // Создаём бакет в новом проекте если не существует
  const { data: existingBuckets } = await newSupabase.storage.listBuckets();
  const bucketExists = existingBuckets.some(b => b.name === bucketName);
  
  if (!bucketExists) {
    console.log(`  Creating bucket: ${bucketName}`);
    const { error } = await newSupabase.storage.createBucket(bucketName, {
      public: true,
    });
    if (error) {
      console.error(`  ❌ Failed to create bucket: ${error.message}`);
      return;
    }
  } else {
    console.log(`  ✓ Bucket already exists`);
  }
  
  // Получаем список файлов
  console.log(`  Scanning files...`);
  const files = await listFiles(oldSupabase, bucketName);
  
  if (!files || files.length === 0) {
    console.log(`  ⚠️  No files in bucket`);
    return;
  }
  
  console.log(`  Found ${files.length} files/folders`);
  
  // Рекурсивно обрабатываем файлы
  async function processFiles(fileList, currentPath = '') {
    for (const file of fileList) {
      const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      
      if (file.id) { // Это файл
        console.log(`  Downloading: ${fullPath}`);
        try {
          const fileData = await downloadFile(oldSupabase, bucketName, fullPath);
          
          console.log(`  Uploading: ${fullPath}`);
          await uploadFile(newSupabase, bucketName, fullPath, fileData);
          
          console.log(`  ✓ Migrated: ${fullPath}`);
        } catch (err) {
          console.error(`  ❌ Failed: ${fullPath} - ${err.message}`);
        }
      } else { // Это папка
        console.log(`  Processing folder: ${fullPath}`);
        const subFiles = await listFiles(oldSupabase, bucketName, fullPath);
        if (subFiles && subFiles.length > 0) {
          await processFiles(subFiles, fullPath);
        }
      }
    }
  }
  
  await processFiles(files);
  console.log(`  ✅ Bucket migration complete`);
}

async function main() {
  console.log('🚀 Starting Supabase Storage Migration\n');
  console.log(`Old project: ${OLD_SUPABASE_URL}`);
  console.log(`New project: ${NEW_SUPABASE_URL}\n`);
  
  try {
    // Получаем список бакетов
    const buckets = await listBuckets(oldSupabase);
    console.log(`Found ${buckets.length} buckets: ${buckets.map(b => b.name).join(', ')}\n`);
    
    // Мигрируем каждый бакет
    for (const bucket of buckets) {
      await migrateBucket(bucket.name);
    }
    
    console.log('\n✅ Storage migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();
