// app/support/contact/page.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import {
  PageShell,
  PageHeader,
  GlassCard,
  MagneticButton,
  EASE,
} from '@/components/company/PageKit';

const contactInfo = [
  { icon: MapPin, title: 'Адрес', lines: ['Москва, Россия'] },
  { icon: Phone, title: 'Телефон', lines: ['+7 (495) 123-45-67'] },
  { icon: Mail, title: 'Email', lines: ['ELEVATE111@yandex.com'] },
  { icon: Clock, title: 'Режим работы', lines: ['Пн-Пт: 9:00 - 21:00', 'Сб-Вс: 10:00 - 20:00'] },
];

const inputCls =
  'w-full rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface-elevated)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--text-secondary)] outline-none transition-all focus:border-[#8b7cf6] focus:ring-2 focus:ring-[#8b7cf6]/40';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || 'Не удалось отправить сообщение');
        return;
      }
      toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
      setFormData({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch {
      toast.error('Сетевая ошибка. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Поддержка"
        title="Связаться"
        highlight="с нами"
        description="Наши специалисты всегда готовы ответить на ваши вопросы и помочь с выбором."
        icon={Mail}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Контактная информация */}
        <GlassCard className="lg:col-span-2" delay={0.05}>
          <h2 className="mb-8 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            Контакты
          </h2>
          <div className="space-y-3">
            {contactInfo.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.08, ease: EASE }}
                className="flex items-start gap-4 rounded-2xl p-3 transition-colors hover:bg-[var(--fc-surface-elevated)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#8b7cf6]/12 text-[#8b7cf6]">
                  <item.icon size={20} />
                </div>
                <div>
                  <h3 className="mb-0.5 font-semibold text-[var(--foreground)]">{item.title}</h3>
                  {item.lines.map((l) => (
                    <p key={l} className="text-sm text-[var(--text-secondary)]">
                      {l}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Форма */}
        <GlassCard className="lg:col-span-3" delay={0.12}>
          <h2 className="mb-8 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)]">
            Отправить сообщение
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Имя
                </label>
                <input id="firstName" type="text" value={formData.firstName} onChange={handleChange} className={inputCls} placeholder="Ваше имя" />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                  Фамилия
                </label>
                <input id="lastName" type="text" value={formData.lastName} onChange={handleChange} className={inputCls} placeholder="Ваша фамилия" />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Email
              </label>
              <input id="email" type="email" value={formData.email} onChange={handleChange} className={inputCls} placeholder="your@email.com" />
            </div>
            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Тема
              </label>
              <select id="subject" value={formData.subject} onChange={handleChange} className={inputCls}>
                <option value="">Выберите тему</option>
                <option value="general">Общие вопросы</option>
                <option value="order">Вопросы по заказу</option>
                <option value="return">Возврат товара</option>
                <option value="complaint">Жалоба</option>
                <option value="cooperation">Предложение сотрудничества</option>
              </select>
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                Сообщение
              </label>
              <textarea id="message" value={formData.message} onChange={handleChange} rows={5} className={inputCls} placeholder="Ваше сообщение..." />
            </div>
            <MagneticButton type="submit" disabled={submitting} className="w-full">
              <Send size={16} />
              {submitting ? 'Отправка…' : 'Отправить сообщение'}
            </MagneticButton>
          </form>
        </GlassCard>
      </div>

      {/* Соцсети */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fc-holographic-panel mt-16 rounded-[var(--fc-radius-card)] p-10 text-center"
      >
        <h2 className="mb-3 text-2xl font-bold uppercase tracking-tight text-[var(--foreground)] sm:text-3xl">
          Мы в социальных сетях
        </h2>
        <p className="mx-auto mb-7 max-w-xl text-[var(--text-secondary)]">
          Подпишитесь, чтобы быть в курсе новинок и акций.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Instagram', 'Facebook', 'Telegram'].map((s) => (
            <motion.a
              key={s}
              href="#"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl border border-[var(--fc-glass-border)] bg-[var(--fc-surface)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] backdrop-blur-md transition-colors hover:border-[#8b7cf6]/40"
            >
              {s}
            </motion.a>
          ))}
        </div>
      </motion.div>
    </PageShell>
  );
}
