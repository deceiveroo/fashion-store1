import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supportChatSessions } from '@/lib/schema';
import { gte, lte, and } from 'drizzle-orm';
import { isAdmin } from '@/lib/server-auth';

/**
 * Экспорт чатов в CSV формате
 * GET /api/admin/support-chats/export?startDate=2026-05-01&endDate=2026-05-31
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await isAdmin();

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Строим условия фильтрации
    let conditions;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions = and(
        gte(supportChatSessions.createdAt, start),
        lte(supportChatSessions.createdAt, end)
      );
    } else if (startDate) {
      conditions = gte(supportChatSessions.createdAt, new Date(startDate));
    }

    // Выполняем запрос
    const query = db.select().from(supportChatSessions);
    const sessions = conditions ? await query.where(conditions) : await query;

    // Форматируем данные для CSV
    const csvHeaders = [
      'ID сессии',
      'Статус',
      'Имя пользователя',
      'Email',
      'Категория',
      'Первое сообщение',
      'Количество сообщений',
      'Время первого ответа (сек)',
      'Время решения (сек)',
      'Оценка клиента',
      'Теги',
      'AI отключен',
      'Оператор',
      'Создано',
      'Закрыто',
    ];

    const csvRows = sessions.map(session => {
      // Форматируем теги
      const tags = session.tags ? session.tags.join('; ') : '';
      
      // Форматируем даты
      const createdAt = session.createdAt 
        ? new Date(session.createdAt).toLocaleString('ru-RU')
        : '';
      const resolvedAt = session.resolvedAt
        ? new Date(session.resolvedAt).toLocaleString('ru-RU')
        : '';

      // Экранируем поля с запятыми и кавычками
      const escapeCsv = (value: string | null | undefined): string => {
        if (!value) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        escapeCsv(session.sessionId),
        escapeCsv(session.status),
        escapeCsv(session.userName),
        escapeCsv(session.userEmail),
        escapeCsv(session.category),
        escapeCsv(session.firstMessage),
        session.messageCount?.toString() || '0',
        session.firstResponseTime?.toString() || '',
        session.resolutionTime?.toString() || '',
        session.customerSatisfaction?.toString() || '',
        escapeCsv(tags),
        session.aiDisabled ? 'Да' : 'Нет',
        escapeCsv(session.takenOverBy ? 'Подключен оператор' : ''),
        createdAt,
        resolvedAt,
      ].join(',');
    });

    // Собираем CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows,
    ].join('\n');

    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Формируем имя файла
    const today = new Date().toISOString().split('T')[0];
    const filename = `chats-export-${today}.csv`;

    // Возвращаем файл
    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
