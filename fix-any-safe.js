#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Безопасное исправление типов any...\n');

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

  // ТОЛЬКО БЕЗОПАСНЫЕ ЗАМЕНЫ:

  // 1. catch (error: any) -> catch (error: unknown)
  const catchMatches = content.match(/catch\s*\(\s*\w+\s*:\s*any\s*\)/g);
  if (catchMatches) {
    content = content.replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');
    fileFixed += catchMatches.length;
  }

  // 2. Record<string, any> -> Record<string, unknown>
  const recordMatches = content.match(/Record<string,\s*any>/g);
  if (recordMatches) {
    content = content.replace(/Record<string,\s*any>/g, 'Record<string, unknown>');
    fileFixed += recordMatches.length;
  }

  // 3. : any[] -> : unknown[]
  const arrayMatches = content.match(/:\s*any\[\]/g);
  if (arrayMatches) {
    content = content.replace(/:\s*any\[\]/g, ': unknown[]');
    fileFixed += arrayMatches.length;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${path.basename(filePath)}: ${fileFixed} исправлений`);
    totalFixed += fileFixed;
    filesFixed++;
  }
});

console.log(`\n📊 Итого:`);
console.log(`   Файлов: ${filesFixed}`);
console.log(`   Исправлений: ${totalFixed}`);
console.log('\n🔄 Проверка сборки...\n');

try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\n✅ Сборка успешна!\n');

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
