#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🖼️  Замена <img> на <Image> из Next.js...\n');

const filesToFix = [
  'app/admin/collections/page.tsx',
  'app/admin/coupons/page.tsx',
  'app/admin/customers/page.tsx',
  'app/profile/orders/page.tsx',
  'components/admin/AdminShell.tsx',
  'components/admin/MaintenanceSettings.tsx',
];

let totalFixed = 0;
let filesFixed = 0;

filesToFix.forEach(relativePath => {
  const filePath = path.join(process.cwd(), relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Файл не найден: ${relativePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileFixed = 0;

  // Проверяем есть ли уже импорт Image
  const hasImageImport = /import\s+.*Image.*from\s+['"]next\/image['"]/.test(content);

  // Находим все <img теги (многострочные тоже)
  const imgRegex = /<img\s+[^>]*>/gs;
  const imgMatches = content.match(imgRegex);

  if (!imgMatches || imgMatches.length === 0) {
    console.log(`✓ ${relativePath}: нет <img> тегов`);
    return;
  }

  console.log(`\n📝 ${relativePath}:`);
  console.log(`   Найдено ${imgMatches.length} <img> тегов`);

  // Добавляем импорт Image если его нет
  if (!hasImageImport) {
    // Ищем первый импорт
    const firstImportMatch = content.match(/^import\s/m);

    if (firstImportMatch) {
      const insertPos = firstImportMatch.index;
      content = content.slice(0, insertPos) +
                "import Image from 'next/image';\n" +
                content.slice(insertPos);
    } else {
      // Добавляем в начало после 'use client' если есть
      if (content.includes("'use client'")) {
        content = content.replace(/('use client';\n)/, "$1\nimport Image from 'next/image';\n");
      } else {
        content = "import Image from 'next/image';\n" + content;
      }
    }
    console.log('   ✓ Добавлен импорт Image');
  }

  // Заменяем каждый <img> на <Image>
  imgMatches.forEach((imgTag) => {
    // Извлекаем атрибуты
    const srcMatch = imgTag.match(/src=["'{]([^"'}]+)["'}]/);
    const altMatch = imgTag.match(/alt=["'{]([^"'}]*)["'}]/);
    const classMatch = imgTag.match(/className=["'{]([^"'}]+)["'}]/);
    const widthMatch = imgTag.match(/width=["'{]?(\d+)["'}]?/);
    const heightMatch = imgTag.match(/height=["'{]?(\d+)["'}]?/);

    if (!srcMatch) return;

    const src = srcMatch[1];
    const alt = altMatch ? altMatch[1] : '';
    const className = classMatch ? classMatch[1] : '';

    let imageTag;

    // Проверяем нужен ли fill
    const needsFill = className.includes('w-full') ||
                      className.includes('h-full') ||
                      className.includes('object-cover') ||
                      className.includes('aspect-');

    if (widthMatch && heightMatch && !needsFill) {
      // Есть размеры и не нужен fill
      imageTag = `<Image src={${src.startsWith('{') ? src : `"${src}"`}} alt="${alt}" width={${widthMatch[1]}} height={${heightMatch[1]}}${className ? ` className="${className}"` : ''} />`;
    } else {
      // Используем fill
      imageTag = `<Image src={${src.startsWith('{') ? src : `"${src}"`}} alt="${alt}" fill${className ? ` className="${className}"` : ''} />`;
    }

    content = content.replace(imgTag, imageTag);
    fileFixed++;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`   ✅ Заменено ${fileFixed} тегов`);
    totalFixed += fileFixed;
    filesFixed++;
  }
});

console.log(`\n📊 Итого:`);
console.log(`   Файлов обработано: ${filesFixed}`);
console.log(`   Тегов заменено: ${totalFixed}\n`);
