#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Поиск файлов с ошибками any...\n');

let lintOutput;
try {
  lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
} catch (error) {
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

console.log(`Найдено ${filesWithErrors.size} файлов\n`);

let totalFixed = 0;
let filesFixed = 0;

filesWithErrors.forEach(filePath => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let fileFixed = 0;

  // 1. catch (error: any) -> catch (error: unknown)
  content = content.replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, (match, varName) => {
    fileFixed++;
    return `catch (${varName}: unknown)`;
  });

  // 2. : any) -> : unknown) в параметрах
  content = content.replace(/(\w+)\s*:\s*any\s*\)/g, (match, varName) => {
    // Проверяем что это не часть большего выражения
    if (!match.includes('(')) {
      fileFixed++;
      return `${varName}: unknown)`;
    }
    return match;
  });

  // 3. : any, -> : unknown, в параметрах
  content = content.replace(/(\w+)\s*:\s*any\s*,/g, (match, varName) => {
    fileFixed++;
    return `${varName}: unknown,`;
  });

  // 4. : any; -> : unknown; в интерфейсах
  content = content.replace(/(\w+)\s*:\s*any\s*;/g, (match, varName) => {
    fileFixed++;
    return `${varName}: unknown;`;
  });

  // 5. : any[] -> : unknown[]
  content = content.replace(/:\s*any\[\]/g, ': unknown[]');

  // 6. <any> -> <unknown>
  content = content.replace(/<any>/g, '<unknown>');

  // 7. Record<string, any> -> Record<string, unknown>
  content = content.replace(/Record<string,\s*any>/g, 'Record<string, unknown>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${path.basename(filePath)}: исправлено ~${fileFixed} мест`);
    totalFixed += fileFixed;
    filesFixed++;
  }
});

console.log(`\n📊 Итого:`);
console.log(`   Файлов обработано: ${filesFixed}`);
console.log(`   Исправлений: ~${totalFixed}`);
console.log('\n🔄 Проверяем сборку...\n');

try {
  execSync('npm run build > /dev/null 2>&1', { stdio: 'inherit' });
  console.log('✅ Сборка успешна!\n');

  // Проверяем сколько ошибок осталось
  try {
    const newLint = execSync('npm run lint 2>&1', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const output = error.stdout || '';
    const match = output.match(/✖ (\d+) problems \((\d+) errors, (\d+) warnings\)/);
    if (match) {
      console.log(`📊 Осталось: ${match[2]} ошибок, ${match[3]} предупреждений\n`);
    }
  }
} catch (error) {
  console.log('❌ Ошибка сборки!\n');
  process.exit(1);
}
