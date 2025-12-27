import { useState, useEffect } from 'react';
import { ActionTemplate } from '../types';
import { getTemplates, incrementTemplateUsage } from '../utils/storage';
import TemplateManagerModal from './TemplateManagerModal';

interface TemplatePanelProps {
  onTemplateSelect: (template: { text: string; name?: string }) => void;
}

const TemplatePanel = ({ onTemplateSelect }: TemplatePanelProps) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const templatesList = await getTemplates();
    setTemplates(templatesList);
    
    // Устанавливаем первую категорию по умолчанию
    if (!selectedCategory && templatesList.length > 0) {
      const firstCategory = templatesList.find(t => t.category)?.category;
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    }
  };

  const handleTemplateClick = async (template: ActionTemplate) => {
    await incrementTemplateUsage(template.id);
    // Передаем название шаблона вместо текста
    onTemplateSelect({ text: template.name, name: template.name });
  };

  const handleManagerClose = () => {
    setShowModal(false);
    loadTemplates();
  };

  // Группируем шаблоны по категориям
  // Исключаем шаблоны-маркеры папок (они начинаются с __FOLDER_MARKER__)
  const groupedTemplates = templates.reduce((acc, template) => {
    // Пропускаем шаблоны-маркеры папок
    if (template.name.startsWith('__FOLDER_MARKER__')) {
      return acc;
    }
    const category = template.category || 'Без категории';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, ActionTemplate[]>);

  // Собираем все категории, включая те, где есть только маркеры папок
  const allCategories = new Set<string>();
  templates.forEach(template => {
    if (template.category) {
      allCategories.add(template.category);
    }
  });

  const sortedCategories = Array.from(allCategories).sort();
  const currentTemplates = selectedCategory ? (groupedTemplates[selectedCategory] || []).filter(t => !t.name.startsWith('__FOLDER_MARKER__')) : [];

  return (
    <div className="template-panel">
      {sortedCategories.length > 0 && (
        <div className="template-category-selector">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-control"
          >
            <option value="">Выберите папку</option>
            {sortedCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      )}

      <div className="template-list" style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflowY: 'auto',
        padding: '5px 0',
        gap: '2px',
        minHeight: 0
      }}>
        {currentTemplates.map(template => (
          <div
            key={template.id}
            onDoubleClick={() => handleTemplateClick(template)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#667eea',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minHeight: '32px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {template.name}
          </div>
        ))}
      </div>

      {showModal && (
        <TemplateManagerModal onClose={handleManagerClose} />
      )}
    </div>
  );
};

export default TemplatePanel;

