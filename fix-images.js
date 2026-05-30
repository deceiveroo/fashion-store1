#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\about\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\admin\\collections\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\admin\\coupons\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\admin\\customers\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\admin\\users\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\app\\profile\\orders\\page.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\components\\admin\\AdminShell.tsx',
  'C:\\Users\\ahter\\OneDrive\\Desktop\\fashion-store1\\components\\admin\\MaintenanceSettings.tsx',
];

let totalFixed = 0;
let filesFixed = 0;

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${path.basename(filePath)}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileFixed = 0;

  // Проверяем есть ли уже импорт Image
  const hasImageImport = /import\s+.*Image.*from\s+['"]next\/image['"]/.test(content);

  // Находим все <img теги
  const imgMatches = content.match(/<img\s[^>]*>/g);

  if (!imgMatches) {
    console.log(`✓ ${path.basename(filePath)}: нет <img> тегов`);
    return;
  }

  console.log(`\n📝 ${path.basename(filePath)}: найдено ${imgMatches.length} <img> тегов`);

  // Добавляем импорт Image если его нет
  if (!hasImageImport) {
    // Ищем существующие импорты из next
    const nextImportMatch = content.match(/import\s+{[^}]+}\s+from\s+['"]next\/[^'"]+['"]/);

    if (nextImportMatch) {
      // Добавляем после существующих импортов из next
      content = content.replace(
        /(import\s+{[^}]+}\s+from\s+['"]next\/[^'"]+['"];?\n)/,
        '$1import Image from \'next/image\';\n'
      );
    } else {
      // Добавляем в начало после 'use client' если есть
      if (content.includes("'use client'")) {
        content = content.replace(
          /('use client';\n)/,
          '$1\nimport Image from \'next/image\';\n'
        );
      } else {
        content = 'import Image from \'next/image\';\n' + content;
      }
    }
    console.log('  ✓ Добавлен импорт Image');
  }

  // Заменяем <img> на <Image>
  imgMatches.forEach((imgTag, index) => {
    // Извлекаем атрибуты
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/);
    const altMatch = imgTag.match(/alt=["']([^"']*)["']/);
    const classMatch = imgTag.match(/className=["']([^"']+)["']/);
    const widthMatch = imgTag.match(/width=["']?(\d+)["']?/);
    const heightMatch = imgTag.match(/height=["']?(\d+)["']?/);

    if (!srcMatch) return;

    const src = srcMatch[1];
    const alt = altMatch ? altMatch[1] : '';
    const className = classMatch ? classMatch[1] : '';

    // Определяем нужен ли fill или width/height
    let imageTag;

    if (widthMatch && heightMatch) {
      // Есть размеры - используем их
      imageTag = `<Image src="${src}" alt="${alt}" width={${widthMatch[1]}} height={${heightMatch[1]}}${className ? ` className="${className}"` : ''} />`;
    } else if (className.includes('w-full') || className.includes('h-full') || className.includes('object-cover')) {
      // Похоже на fill image
      imageTag = `<Image src="${src}" alt="${alt}" fill${className ? ` className="${className}"` : ''} />`;
    } else {
      // По умолчанию используем fill
      imageTag = `<Image src="${src}" alt="${alt}" fill${className ? ` className="${className}"` : ''} />`;
    }

    content = content.replace(imgTag, imageTag);
    fileFixed++;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Заменено ${fileFixed} тегов`);
    totalFixed += fileFixed;
    filesFixed++;
  }
});

console.log(`\n📊 Итого:`);
console.log(`   Файлов обработано: ${filesFixed}`);
console.log(`   Тегов заменено: ${totalFixed}`);
console.log('\n🔄 Проверяем сборку...\n');

const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Сборка успешна!\n');

  // Проверяем lint
  try {
    execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const output = error.stdout || '';
    const match = output.match(/✖ (\d+) problems \((\d+) errors, (\d+) warnings\)/);
    if (match) {
      console.log(`📊 Осталось: ${match[2]} ошибок, ${match[3]} предупреждений\n`);
    }
  }
} catch (error) {
  console.log('\n❌ Ошибка сборки - откатываем...\n');
  execSync('git checkout .', { stdio: 'inherit' });
  process.exit(1);
}
