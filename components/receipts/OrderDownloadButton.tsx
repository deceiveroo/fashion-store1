'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader2 } from 'lucide-react';

interface OrderDownloadButtonProps {
  orderId: string;
  orderNumber?: string;
}

export default function OrderDownloadButton({ orderId, orderNumber }: OrderDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      // Находим элемент чека заказа
      const element = document.getElementById('order-receipt');
      
      if (!element) {
        throw new Error('Элемент чека не найден');
      }

      // Временно убираем problematic CSS классы перед рендерингом
      const originalClassName = element.className;
      element.classList.remove('dark:bg-gray-800', 'bg-white');
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#000000';

      // Создаём canvas из HTML элемента с высоким качеством
      const canvas = await html2canvas(element, {
        scale: 3, // Увеличиваем масштаб для лучшего качества
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        allowTaint: true,
        foreignObjectRendering: false,
        imageTimeout: 0,
        removeContainer: true,
        // Игнорируем unsupported color functions
        onclone: (clonedDoc) => {
          // Заменяем все lab() цвета на обычные RGB
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            const style = window.getComputedStyle(el);
            try {
              // Сохраняем computed styles без lab()
              if (style.backgroundColor.includes('lab')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (style.color.includes('lab')) {
                el.style.color = '#000000';
              }
            } catch (e) {
              // Игнорируем ошибки parsing
            }
          });
        }
      });

      // Восстанавливаем оригинальные классы
      element.className = originalClassName;
      element.style.backgroundColor = '';
      element.style.color = '';

      // Конвертируем canvas в blob и скачиваем как PNG
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Не удалось создать изображение');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = orderNumber ? `чек_${orderNumber}.png` : `чек_${orderId.slice(0, 8)}.png`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('Ошибка при создании изображения:', error);
      alert('Не удалось создать изображение. Попробуйте ещё раз.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Создание...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Скачать чек</span>
        </>
      )}
    </button>
  );
}
