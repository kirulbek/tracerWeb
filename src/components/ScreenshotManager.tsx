import { useRef, useEffect } from 'react';
import { ActionScreenshot } from '../types';

interface ScreenshotManagerProps {
  screenshots: ActionScreenshot[];
  onAdd: (dataUrl: string) => void;
  onDelete: (id: string) => void;
}

const ScreenshotManager = ({ screenshots, onAdd, onDelete }: ScreenshotManagerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onAdd(dataUrl);
      };
      reader.readAsDataURL(file);
    }
    // Сброс input для возможности выбора того же файла снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      // Проверяем, доступен ли Clipboard API
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert('Доступ к буферу обмена недоступен. Используйте Ctrl+V для вставки изображения или выберите файл через кнопку "+".');
        return;
      }

      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              onAdd(dataUrl);
            };
            reader.readAsDataURL(blob);
            return; // Добавляем только первое найденное изображение
          }
        }
      }
      
      // Если изображение не найдено в буфере обмена
      alert('В буфере обмена нет изображения.\n\nСовет: Используйте Ctrl+V для вставки изображения или выберите файл через кнопку "+".');
    } catch (error: any) {
      console.error('Ошибка при чтении буфера обмена:', error);
      
      // Более понятное сообщение об ошибке
      let errorMessage = 'Не удалось прочитать буфер обмена.\n\n';
      
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        errorMessage += 'Разрешите доступ к буферу обмена в настройках браузера.\n\n';
      } else if (error.name === 'SecurityError' || window.location.protocol !== 'https:') {
        errorMessage += 'Доступ к буферу обмена работает только по HTTPS.\n\n';
      }
      
      errorMessage += 'Альтернатива: Используйте Ctrl+V для вставки изображения или выберите файл через кнопку "+".';
      
      alert(errorMessage);
    }
  };

  const handlePasteEvent = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            onAdd(dataUrl);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
  };

  useEffect(() => {
    // Добавляем обработчик события paste для поддержки Ctrl+V
    const container = containerRef.current;
    if (container) {
      const handler = (e: Event) => handlePasteEvent(e as ClipboardEvent);
      container.addEventListener('paste', handler);
      return () => {
        container.removeEventListener('paste', handler);
      };
    }
  }, []);

  return (
    <div ref={containerRef} className="screenshots-section">
      <div className="section-header">
        <h3>Скриншоты</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="btn btn-sm btn-primary"
            title="Вставить изображение из буфера обмена (работает только по HTTPS). Лучше используйте Ctrl+V"
          >
            📋
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-sm btn-primary"
            title="Добавить скриншот"
          >
            +
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      {screenshots.length > 0 && (
        <div className="screenshots-list">
          {screenshots.map((screenshot) => (
            <div key={screenshot.id} className="screenshot-item">
              <img src={screenshot.dataUrl} alt="Скриншот" />
              <button
                type="button"
                onClick={() => onDelete(screenshot.id)}
                className="btn btn-xs btn-danger"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScreenshotManager;

