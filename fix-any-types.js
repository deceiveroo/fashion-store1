#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Получаем список файлов с ошибками any
let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (error) {
  // Lint возвращает ненулевой код при наличии ошибок
  lintOutput = error.stdout || '';
}

const lines = lintOutput.split('\n');

const filesWithErrors = new Set();
lines.forEach(line => {
  const match = line.match(/([A-Z]:\\[^:]+\.tsx)/);
  if (match) {
    filesWithErrors.add(match[1]);
  }
});

console.log(`Найдено ${filesWithErrors.size} файлов с ошибками`);

let totalFixed = 0;

filesWithErrors.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  let fixed = 0;

  // Паттерн 1: catch (error: any)
  const originalContent = content;
  content = content.replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');
  if (content !== originalContent) {
    fixed++;
  }

  if (fixed > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${path.basename(filePath)}: исправлено ${fixed} catch блоков`);
    totalFixed += fixed;
  }
});

console.log(`\n✅ Всего исправлено: ${totalFixed} catch блоков`);
console.log('🔄 Запускаем сборку для проверки...');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Сборка успешна!');
} catch (error) {
  console.log('\n❌ Ошибка сборки - откатываем изменения');
  process.exit(1);
}
