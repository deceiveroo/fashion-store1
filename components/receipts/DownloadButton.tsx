'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Receipt } from '@/lib/receipt-client';
import { Download, Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  receipt: Receipt;
}

export default function DownloadButton({ receipt }: DownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    
    try {
      // Находим элемент чека
      const element = document.getElementById('receipt-preview');
      
      if (!element) {
        throw new Error('Элемент чека не найден');
      }

      // Создаём canvas из HTML элемента
      const canvas = await html2canvas(element, {
        scale: 2, // Увеличиваем масштаб для лучшего качества
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Создаём PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Вычисляем размеры для масштабирования
      const imgWidth = 210; // A4 ширина в мм
      const pageHeight = 297; // A4 высота в мм
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Добавляем изображение в PDF
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        imgWidth,
        Math.min(imgHeight, pageHeight)
      );

      // Сохраняем файл
      const fileName = `чек_${receipt.order_number}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      alert('Не удалось создать PDF. Попробуйте ещё раз.');
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
