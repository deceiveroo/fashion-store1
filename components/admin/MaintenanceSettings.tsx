'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertTriangle, Calendar, Image as ImageIcon, Mail, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface MaintenanceConfig {
  maintenanceMode: boolean;
  title: string;
  description: string;
  endTime: string | null;
  backgroundImage: string | null;
  enableSubscription: boolean;
  galleryImages: string[];
}

export default function MaintenanceSettings() {
  const [config, setConfig] = useState<MaintenanceConfig>({
    maintenanceMode: false,
    title: 'Сайт на обслуживании',
    description: 'Мы проводим технические работы. Сайт скоро будет доступен.',
    endTime: null,
    backgroundImage: null,
    enableSubscription: true,
    galleryImages: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  // Fetch current settings
  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching maintenance settings:', error);
        toast.error('Ошибка загрузки настроек');
        setIsLoading(false);
      });
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/maintenance/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setConfig({ ...config, backgroundImage: data.url });
        toast.success('Изображение загружено');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Произошла ошибка при загрузке');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/maintenance/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setConfig({ 
          ...config, 
          galleryImages: [...config.galleryImages, data.url] 
        });
        toast.success('Фото добавлено в галерею');
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch (error) {
      console.error('Error uploading gallery image:', error);
      toast.error('Произошла ошибка при загрузке');
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    setConfig({
      ...config,
      galleryImages: config.galleryImages.filter((_, i) => i !== index),
    });
    toast.success('Фото удалено из галереи');
  };

  const addGalleryUrl = () => {
    if (!galleryUrlInput || !galleryUrlInput.trim()) {
      toast.error('Введите URL изображения');
      return;
    }

    const url = galleryUrlInput.trim();
    
    // Basic validation
    if (!url.startsWith('http')) {
      toast.error('URL должен начинаться с http:// или https://');
      return;
    }

    setConfig({
      ...config,
      galleryImages: [...config.galleryImages, url],
    });
    setGalleryUrlInput('');
    toast.success('URL добавлен в галерею');
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Настройки сохранены');
        
        if (config.maintenanceMode) {
          toast.info('Режим обслуживания включен! Посетители увидят страницу-заглушку.');
        }
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Error saving maintenance settings:', error);
      toast.error('Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white mb-1">Режим обслуживания</h2>
        <p className="text-sm text-white/40">
          Настройте страницу-заглушку для посетителей во время технических работ
        </p>
      </div>

      {/* Main Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-6 transition-all ${
          config.maintenanceMode
            ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30'
            : 'bg-white/[0.03] border-white/5'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${config.maintenanceMode ? 'bg-red-500/20' : 'bg-white/5'}`}>
            <AlertTriangle className={`w-6 h-6 ${config.maintenanceMode ? 'text-red-400' : 'text-white/40'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Включить режим обслуживания</h3>
            <p className="text-sm text-white/50 mb-4">
              {config.maintenanceMode
                ? 'Все посетители увидят страницу-заглушку. Админы продолжают видеть сайт.'
                : 'Сайт работает в обычном режиме'}
            </p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.maintenanceMode}
                onChange={(e) => setConfig({ ...config, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-5"
      >
        {/* Title */}
        <div>
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            Заголовок страницы
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => setConfig({ ...config, title: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            placeholder="Сайт на обслуживании"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            Описание
          </label>
          <textarea
            value={config.description}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-violet-500/50 focus:outline-none resize-none"
            placeholder="Мы проводим технические работы..."
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            <Calendar className="inline w-3 h-3 mr-1" />
            Дата окончания (опционально)
          </label>
          <input
            type="datetime-local"
            value={config.endTime ? new Date(config.endTime).toISOString().slice(0, 16) : ''}
            onChange={(e) => setConfig({ ...config, endTime: e.target.value || null })}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-violet-500/50 focus:outline-none"
          />
          <p className="text-xs text-white/30 mt-1">
            Если указано, на странице будет показан обратный отсчёт
          </p>
        </div>

        {/* Background Image */}
        <div>
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            <ImageIcon className="inline w-3 h-3 mr-1" />
            Фоновое изображение
          </label>
          
          {/* Upload button */}
          <div className="flex gap-2 mb-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Загрузка...' : 'Загрузить фото'}
            </button>
            {config.backgroundImage && config.backgroundImage.trim() !== '' && (
              <button
                type="button"
                onClick={() => setConfig({ ...config, backgroundImage: null })}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors"
              >
                Удалить
              </button>
            )}
          </div>

          {/* URL input */}
          <input
            type="text"
            value={config.backgroundImage || ''}
            onChange={(e) => setConfig({ ...config, backgroundImage: e.target.value || null })}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 px-4 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            placeholder="Или вставьте прямую ссылку на фото (https://...image.jpg)"
          />
          <p className="text-xs text-white/30 mt-2">
            💡 Совет: Используйте прямые ссылки на изображения (заканчиваются на .jpg, .png, .webp)
          </p>
          
          {/* Preview */}
          {config.backgroundImage && config.backgroundImage.trim() !== '' && (
            <div className="mt-3 relative rounded-xl overflow-hidden border border-white/10">
              <img
                src={config.backgroundImage}
                alt="Preview"
                className="w-full h-32 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  toast.error('Ошибка загрузки изображения');
                }}
              />
            </div>
          )}
        </div>

        {/* Gallery Images */}
        <div>
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">
            <ImageIcon className="inline w-3 h-3 mr-1" />
            Галерея изображений ({config.galleryImages.length})
          </label>
          
          {/* Upload button for gallery */}
          <div className="flex gap-2 mb-3">
            <input
              type="file"
              ref={galleryFileInputRef}
              onChange={handleGalleryUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => galleryFileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm text-white transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Загрузка...' : 'Загрузить фото'}
            </button>
          </div>

          {/* URL input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={galleryUrlInput}
              onChange={(e) => setGalleryUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addGalleryUrl()}
              placeholder="Или вставьте URL: https://example.com/image.jpg"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 px-4 text-sm text-white focus:border-violet-500/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={addGalleryUrl}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors"
            >
              Добавить
            </button>
          </div>

          {/* Gallery preview grid */}
          {config.galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {config.galleryImages.map((img, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                  <img
                    src={img}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <p className="text-xs text-white/30 mt-2">
            💡 Добавьте несколько фото которые будут показаны на странице обслуживания
          </p>
        </div>

        {/* Enable Subscription */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Mail className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white">Сбор email'ов</h4>
              <p className="text-xs text-white/40">Посетители смогут подписаться на уведомление</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableSubscription}
              onChange={(e) => setConfig({ ...config, enableSubscription: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
          </label>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
        </button>

        {/* Quick toggle for testing */}
        <div className="pt-4 border-t border-white/10">
          <p className="text-xs text-white/30 mb-2">
            💡 Если изменения не применяются, попробуйте обновить страницу (F5)
          </p>
        </div>
      </motion.div>

      {/* Preview Link */}
      <div className="text-center">
        <a
          href="/maintenance"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          Предпросмотр страницы обслуживания →
        </a>
      </div>
    </div>
  );
}
