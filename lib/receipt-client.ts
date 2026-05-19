import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для таблицы receipts
export interface Receipt {
  id: string;
  created_at: string;
  order_number: string;
  amount: number;
  description: string | null;
  payer_name: string;
  bank_name: string;
  payment_method: string;
  status: string;
}

// Функции для работы с чеками
export const receiptService = {
  // Получить все чеки
  async getAll(): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
      throw error;
    }

    return data || [];
  },

  // Создать новый чек
  async create(receipt: Omit<Receipt, 'id' | 'created_at'>): Promise<Receipt> {
    const { data, error } = await supabase
      .from('receipts')
      .insert([receipt])
      .select()
      .single();

    if (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }

    return data;
  },

  // Получить чек по ID
  async getById(id: string): Promise<Receipt | null> {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching receipt:', error);
      return null;
    }

    return data;
  },

  // Удалить чек
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }
};
