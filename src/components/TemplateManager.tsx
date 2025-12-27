import { useState, useEffect } from 'react';
import { ActionTemplate } from '../types';
import { getTemplates, saveTemplate, deleteTemplate } from '../utils/storage';
import TemplateManagerModal from './TemplateManagerModal';

const TemplateManager = () => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
  const [showEditTemplateForm, setShowEditTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ActionTemplate | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

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

  const handleModalClose = () => {
    setShowModal(false);
    loadTemplates();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Введите название папки');
      return;
    }

    // Создаем скрытый шаблон-маркер для папки (не показывается в списке элементов)
    // Имя начинается с специального символа, чтобы его можно было отличить
    const folderMarker: ActionTemplate = {
      id: '',
      name: `__FOLDER_MARKER__${newFolderName.trim()}`,
      text: '',
      category: newFolderName.trim(),
      usageCount: 0,
      createdAt: new Date()
    };

    await saveTemplate(folderMarker);
    setNewFolderName('');
    setShowCreateFolderForm(false);
    await loadTemplates();
    setSelectedCategory(newFolderName.trim());
  };

  const handleDeleteFolder = async (category: string) => {
    if (!confirm(`Вы уверены, что хотите удалить папку "${category}" и все шаблоны в ней?`)) {
      return;
    }

    // Удаляем все шаблоны в этой категории (включая маркеры)
    const categoryTemplates = templates.filter(t => t.category === category);
    for (const template of categoryTemplates) {
      await deleteTemplate(template.id);
    }

    if (selectedCategory === category) {
      setSelectedCategory('');
    }

    await loadTemplates();
  };

  const handleEditTemplate = (template: ActionTemplate) => {
    setEditingTemplate(template);
    setShowEditTemplateForm(true);
  };

  const handleDeleteTemplate = async (template: ActionTemplate) => {
    if (!confirm(`Вы уверены, что хотите удалить шаблон "${template.name}"?`)) {
      return;
    }

    await deleteTemplate(template.id);
    await loadTemplates();
  };

  const handleSaveTemplate = async (formData: { name: string; text: string; category: string }) => {
    if (!editingTemplate) return;

    const updatedTemplate: ActionTemplate = {
      ...editingTemplate,
      name: formData.name,
      text: editingTemplate.text || '',
      category: formData.category || editingTemplate.category
    };

    await saveTemplate(updatedTemplate);
    setShowEditTemplateForm(false);
    setEditingTemplate(null);
    await loadTemplates();
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

  // Сортируем категории, включая пустые (только с маркерами)
  const sortedCategories = Array.from(allCategories).sort();
  const currentTemplates = selectedCategory ? (groupedTemplates[selectedCategory] || []) : [];

  const [showCreateTemplateForm, setShowCreateTemplateForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Введите название шаблона');
      return;
    }

    if (!selectedCategory) {
      alert('Выберите папку для шаблона');
      return;
    }

    const newTemplate: ActionTemplate = {
      id: '',
      name: newTemplateName.trim(),
      text: '',
      category: selectedCategory,
      usageCount: 0,
      createdAt: new Date()
    };

    await saveTemplate(newTemplate);
    setNewTemplateName('');
    setShowCreateTemplateForm(false);
    await loadTemplates();
  };

  return (
    <div className="template-manager">
      <div className="section-header">
        <h2>Шаблоны</h2>
      </div>

      <div className="template-explorer" style={{
        display: 'flex',
        height: 'calc(100vh - 200px)',
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        {/* Левая панель - Папки */}
        <div className="template-folders-panel" style={{
          width: '250px',
          borderRight: '1px solid #ddd',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div className="template-folders-header" style={{
            padding: '10px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 'bold' }}>Папки</span>
            <button
              onClick={() => setShowCreateFolderForm(true)}
              className="btn btn-xs btn-primary"
              title="Создать папку"
              style={{ padding: '2px 8px' }}
            >
              +
            </button>
          </div>
          {showCreateFolderForm && (
            <div className="create-folder-form" style={{
              padding: '10px',
              borderBottom: '1px solid #ddd',
              backgroundColor: '#fff'
            }}>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Название папки"
                className="form-control"
                autoFocus
                style={{ marginBottom: '5px', width: '100%' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  } else if (e.key === 'Escape') {
                    setShowCreateFolderForm(false);
                    setNewFolderName('');
                  }
                }}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={handleCreateFolder} className="btn btn-xs btn-primary">Создать</button>
                <button onClick={() => { setShowCreateFolderForm(false); setNewFolderName(''); }} className="btn btn-xs btn-secondary">Отмена</button>
              </div>
            </div>
          )}
          <div className="template-folders-list" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '5px 0'
          }}>
            {sortedCategories.length > 0 ? (
              sortedCategories.map(category => (
                <div
                  key={category}
                  className={`folder-item ${selectedCategory === category ? 'active' : ''}`}
                  style={{
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: selectedCategory === category ? '#e3f2fd' : 'transparent',
                    borderLeft: selectedCategory === category ? '3px solid #667eea' : '3px solid transparent'
                  }}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <span>📁</span>
                    <span style={{ fontSize: '14px' }}>{category}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(category);
                    }}
                    className="btn btn-xs btn-danger"
                    title="Удалить папку"
                    style={{ padding: '2px 6px', opacity: 0.7 }}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                Нет папок
              </div>
            )}
          </div>
        </div>

        {/* Правая панель - Элементы */}
        <div className="template-details-panel" style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff'
        }}>
          {selectedCategory ? (
            <>
              <div className="template-details-header" style={{
                padding: '10px 15px',
                borderBottom: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{selectedCategory}</h3>
                <button
                  onClick={() => setShowCreateTemplateForm(true)}
                  className="btn btn-xs btn-primary"
                  title="Добавить шаблон"
                >
                  + Добавить шаблон
                </button>
              </div>
              {showCreateTemplateForm && (
                <div style={{
                  padding: '15px',
                  borderBottom: '1px solid #ddd',
                  backgroundColor: '#f9f9f9'
                }}>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Название шаблона"
                    className="form-control"
                    autoFocus
                    style={{ marginBottom: '10px', width: '100%' }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTemplate();
                      } else if (e.key === 'Escape') {
                        setShowCreateTemplateForm(false);
                        setNewTemplateName('');
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={handleCreateTemplate} className="btn btn-xs btn-primary">Создать</button>
                    <button onClick={() => { setShowCreateTemplateForm(false); setNewTemplateName(''); }} className="btn btn-xs btn-secondary">Отмена</button>
                  </div>
                </div>
              )}
              <div className="template-items-list" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '10px'
              }}>
                {currentTemplates.length > 0 ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {currentTemplates.map(template => (
                      <div
                        key={template.id}
                        className="template-list-item"
                        style={{
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: '#fff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f5f5f5';
                          e.currentTarget.style.borderColor = '#667eea';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fff';
                          e.currentTarget.style.borderColor = '#ddd';
                        }}
                        onClick={() => handleEditTemplate(template)}
                      >
                        <div style={{ flex: 1, fontWeight: '500' }}>{template.name}</div>
                        <div style={{ display: 'flex', gap: '5px' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="btn btn-xs btn-secondary"
                            title="Редактировать"
                            style={{ padding: '2px 6px' }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="btn btn-xs btn-danger"
                            title="Удалить"
                            style={{ padding: '2px 6px' }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                    В этой папке нет шаблонов
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              Выберите папку слева для просмотра шаблонов
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <TemplateManagerModal onClose={handleModalClose} />
      )}

      {showEditTemplateForm && editingTemplate && (
        <div className="modal-overlay" onClick={() => { setShowEditTemplateForm(false); setEditingTemplate(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Редактировать шаблон</h3>
            <EditTemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => { setShowEditTemplateForm(false); setEditingTemplate(null); }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface EditTemplateFormProps {
  template: ActionTemplate;
  onSave: (formData: { name: string; text: string; category: string }) => void;
  onCancel: () => void;
}

const EditTemplateForm = ({ template, onSave, onCancel }: EditTemplateFormProps) => {
  const [formData, setFormData] = useState({
    name: template.name,
    text: '',
    category: template.category || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="edit-template-name">Название *</label>
        <input
          id="edit-template-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="edit-template-category">Папка</label>
        <input
          id="edit-template-category"
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Сохранить</button>
        <button type="button" onClick={onCancel} className="btn btn-secondary">Отмена</button>
      </div>
    </form>
  );
};

export default TemplateManager;

