import { useState, useEffect } from 'react';
import { ActionTemplate } from '../types';
import { getTemplates, saveTemplate, deleteTemplate } from '../utils/storage';

interface TemplateManagerModalProps {
  onClose: () => void;
}

const TemplateManagerModal = ({ onClose }: TemplateManagerModalProps) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActionTemplate | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    category: ''
  });
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const templatesList = await getTemplates();
    setTemplates(templatesList);
    
    // Собираем уникальные категории
    const uniqueCategories = Array.from(new Set(templatesList.map(t => t.category).filter(Boolean))) as string[];
    setCategories(uniqueCategories);
  };

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormData({ name: '', text: '', category: '' });
    setShowForm(true);
  };

  const handleCreateFolder = () => {
    setEditingTemplate(null);
    setFormData({ name: '', text: '', category: '' });
    setShowCreateFolder(true);
  };

  const handleEdit = (template: ActionTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      text: '',
      category: template.category || ''
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showCreateFolder) {
      // Создание папки - только название
      if (!formData.name.trim()) {
        alert('Введите название папки');
        return;
      }
      const folderTemplate: ActionTemplate = {
        id: '',
        name: formData.name.trim(),
        text: '',
        category: formData.name.trim(),
        usageCount: 0,
        createdAt: new Date()
      };
      await saveTemplate(folderTemplate);
    } else {
      // Создание/редактирование шаблона - название + папка
      if (!formData.name.trim()) {
        alert('Введите название шаблона');
        return;
      }
      const template: ActionTemplate = {
        id: editingTemplate?.id || '',
        name: formData.name.trim(),
        text: formData.text || '',
        category: formData.category || undefined,
        usageCount: editingTemplate?.usageCount || 0,
        createdAt: editingTemplate?.createdAt || new Date()
      };
      await saveTemplate(template);
    }
    
    await loadTemplates();
    setShowForm(false);
    setShowCreateFolder(false);
    setEditingTemplate(null);
    setFormData({ name: '', text: '', category: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      await deleteTemplate(id);
      await loadTemplates();
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (confirm(`Вы уверены, что хотите удалить папку "${category}" и все шаблоны в ней?`)) {
      const categoryTemplates = templates.filter(t => t.category === category);
      for (const template of categoryTemplates) {
        await deleteTemplate(template.id);
      }
      await loadTemplates();
    }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Управление шаблонами</h2>
          <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
        </div>

        <div className="modal-body">
          <div className="template-manager-actions">
            <button onClick={handleAdd} className="btn btn-primary">
              Добавить шаблон
            </button>
            <button onClick={handleCreateFolder} className="btn btn-secondary">
              Создать папку
            </button>
          </div>

          {(showForm || showCreateFolder) && (
            <div className="template-form">
              <h3>{showCreateFolder ? 'Создать папку' : editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'}</h3>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label htmlFor="template-name">Название *</label>
                  <input
                    id="template-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={showCreateFolder ? 'Введите название папки' : 'Введите название шаблона'}
                  />
                </div>
                {!showCreateFolder && (
                  <div className="form-group">
                    <label htmlFor="template-category">Папка (категория) *</label>
                    <input
                      id="template-category"
                      type="text"
                      list="categories-list"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Выберите или введите название папки"
                      required
                    />
                    <datalist id="categories-list">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                )}
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Сохранить</button>
                  <button type="button" onClick={() => { setShowForm(false); setShowCreateFolder(false); setFormData({ name: '', text: '', category: '' }); }} className="btn btn-secondary">Отмена</button>
                </div>
              </form>
            </div>
          )}

          <div className="templates-list">
            {sortedCategories.map(category => (
              <div key={category} className="template-category-section">
                <div className="template-category-header">
                  <h3>{category}</h3>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="btn btn-xs btn-danger"
                  >
                    Удалить папку
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTemplates[category].map(template => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(template)}
                            className="btn btn-xs btn-secondary"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="btn btn-xs btn-danger"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateManagerModal;

