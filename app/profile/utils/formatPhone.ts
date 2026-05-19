/**
 * Форматирует номер телефона в формат +7 (XXX) XXX-XX-XX
 */
export function formatPhone(value: string): string {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, '');
  
  // Если нет цифр, возвращаем пустую строку
  if (!digits) return '';
  
  // Первая цифра должна быть 7 или 8, заменяем на 7
  let cleanDigits = digits;
  if (cleanDigits[0] === '8') {
    cleanDigits = '7' + cleanDigits.substring(1);
  }
  if (cleanDigits[0] !== '7') {
    cleanDigits = '7' + cleanDigits;
  }
  
  // Ограничиваем до 11 цифр
  cleanDigits = cleanDigits.substring(0, 11);
  
  // Форматируем
  let formatted = '+7';
  if (cleanDigits.length > 1) {
    formatted += ' (' + cleanDigits.substring(1, 4);
  }
  if (cleanDigits.length >= 4) {
    formatted += ') ' + cleanDigits.substring(4, 7);
  }
  if (cleanDigits.length >= 7) {
    formatted += '-' + cleanDigits.substring(7, 9);
  }
  if (cleanDigits.length >= 9) {
    formatted += '-' + cleanDigits.substring(9, 11);
  }
  
  return formatted;
}

/**
 * Обрабатывает изменение поля телефона с умным позиционированием курсора
 */
export function handlePhoneChangeWithCursor(
  e: React.ChangeEvent<HTMLInputElement>,
  currentValue: string,
  onChange: (value: string) => void
): void {
  const input = e.target;
  const oldValue = currentValue;
  const newValue = formatPhone(input.value);
  
  // Вычисляем позицию курсора
  const cursorPos = input.selectionStart || 0;
  const oldLength = oldValue.length;
  const newLength = newValue.length;
  
  onChange(newValue);
  
  // Восстанавливаем позицию курсора с учётом изменений
  setTimeout(() => {
    if (input && document.activeElement === input) {
      let newCursorPos = cursorPos;
      
      // Если длина увеличилась (ввод), ставим курсор в конец
      if (newLength > oldLength) {
        newCursorPos = newLength;
      }
      // Если длина уменьшилась (удаление)
      else if (newLength < oldLength && newLength > 0) {
        // Проверяем символ на текущей позиции курсора
        const charAtCursor = newValue[newCursorPos - 1];
        
        // Если перед курсором спецсимвол, перескакиваем через него
        if (charAtCursor && [' ', '(', ')', '-'].includes(charAtCursor)) {
          newCursorPos = Math.max(3, newCursorPos - 1);
        }
      }
      
      // Ограничиваем позицию в допустимых пределах
      newCursorPos = Math.min(newCursorPos, newValue.length);
      
      input.setSelectionRange(newCursorPos, newCursorPos);
    }
  }, 0);
}
