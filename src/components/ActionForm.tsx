import { useState, useEffect, useRef } from 'react';
import { Action, ActionCodeBlock, ActionScreenshot, Task } from '../types';
import { getTasks, saveAction, getActionsByTaskId, getCodeBlocksByActionId, saveCodeBlock, deleteCodeBlock, getScreenshotsByActionId, saveScreenshot, deleteScreenshot } from '../utils/storage';
import ActionEditor from './ActionEditor';
import CodeBlockEditor from './CodeBlockEditor';
import ScreenshotManager from './ScreenshotManager';
import TemplatePanel from './TemplatePanel';
import { highlightBSL } from '../utils/bsl-highlighter-v2';

interface ActionFormProps {
  actionId?: string;
  taskId?: string;
  onSave: () => void;
  onCancel?: () => void;
}

const ActionForm = ({ actionId, taskId, onSave, onCancel }: ActionFormProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    taskId: taskId || '',
    name: '',
    description: '',
    shortDescription: '',
    excludeFromDescription: false,
    timeHours: 0,
    timeMinutes: 0
  });

  // Логирование для отладки
  useEffect(() => {
    if (taskId) {
      console.log('ActionForm получил taskId:', taskId);
    }
  }, [taskId]);
  const [codeBlocks, setCodeBlocks] = useState<ActionCodeBlock[]>([]);
  const [screenshots, setScreenshots] = useState<ActionScreenshot[]>([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editingCodeBlock, setEditingCodeBlock] = useState<ActionCodeBlock | undefined>();
  const quillRef = useRef<any>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (actionId) {
      loadAction();
    } else {
      // Сброс формы при создании нового пункта
      setFormData(prev => ({
        ...prev,
        taskId: taskId || prev.taskId || '',
        name: '',
        description: '',
        shortDescription: '',
        excludeFromDescription: false,
        timeHours: 0,
        timeMinutes: 0
      }));
      setCodeBlocks([]);
      setScreenshots([]);
    }
  }, [actionId]);

  // Отдельный эффект для обновления taskId после загрузки задач
  useEffect(() => {
    if (!actionId && taskId && tasks.length > 0) {
      // Проверяем, что задача существует в списке
      const taskExists = tasks.some(t => t.id === taskId);
      if (taskExists) {
        console.log('Обновляем taskId в форме:', taskId);
        setFormData(prev => {
          if (prev.taskId !== taskId) {
            return {
              ...prev,
              taskId: taskId
            };
          }
          return prev;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, actionId, tasks.length]);

  const loadTasks = async () => {
    const tasksList = await getTasks();
    setTasks(tasksList);
    // Если taskId передан, устанавливаем его после загрузки задач
    if (taskId && !actionId) {
      console.log('Устанавливаем taskId после загрузки задач:', taskId);
      setFormData(prev => ({
        ...prev,
        taskId: taskId
      }));
    }
  };

  const loadAction = async () => {
    if (!actionId) return;
    try {
      console.log('Загрузка действия с ID:', actionId);
      // Получаем действие через API напрямую
      const { api } = await import('../utils/api');
      const actionData = await api.get<any>(`/actions/${actionId}`);
      const action: Action = {
        id: actionData.id,
        taskId: actionData.taskId,
        name: actionData.name,
        description: actionData.description,
        shortDescription: actionData.shortDescription,
        excludeFromDescription: actionData.excludeFromDescription || false,
        timeHours: actionData.timeHours || 0,
        timeMinutes: actionData.timeMinutes || 0,
        orderIndex: actionData.orderIndex || 0,
        createdAt: new Date(actionData.createdAt)
      };
      console.log('Найденное действие:', action);
      setFormData({
        taskId: action.taskId,
        name: action.name || '',
        description: action.description || '',
        shortDescription: action.shortDescription || '',
        excludeFromDescription: action.excludeFromDescription || false,
        timeHours: action.timeHours || 0,
        timeMinutes: action.timeMinutes || 0
      });
      const blocks = await getCodeBlocksByActionId(actionId);
      setCodeBlocks(blocks);
      const shots = await getScreenshotsByActionId(actionId);
      setScreenshots(shots);
      console.log('Данные загружены успешно');
    } catch (error) {
      console.error('Ошибка загрузки действия:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskId) {
      alert('Выберите задачу');
      return;
    }
    if (!formData.shortDescription || formData.shortDescription.trim() === '') {
      alert('Введите краткое описание');
      return;
    }

    try {
      // Если редактируем, получаем существующее действие для createdAt
      let existingCreatedAt = new Date();
      if (actionId) {
        try {
          const { api } = await import('../utils/api');
          const actionData = await api.get<any>(`/actions/${actionId}`);
          existingCreatedAt = new Date(actionData.createdAt);
        } catch {
          // Если не удалось загрузить, используем текущую дату
        }
      }

      const action: Action = {
        id: actionId || `action-${Date.now()}`,
        taskId: formData.taskId,
        name: formData.name || undefined,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        excludeFromDescription: formData.excludeFromDescription,
        timeHours: formData.timeHours,
        timeMinutes: formData.timeMinutes,
        orderIndex: 0,
        createdAt: existingCreatedAt
      };

      const savedAction = await saveAction(action);

      // Сохраняем блоки кода
      for (const block of codeBlocks) {
        await saveCodeBlock({
          ...block,
          actionId: savedAction.id
        });
      }

      // Сохраняем скриншоты
      for (const screenshot of screenshots) {
        await saveScreenshot({
          ...screenshot,
          actionId: savedAction.id
        });
      }

      onSave();
    } catch (error) {
      console.error('Ошибка сохранения действия:', error);
      alert('Ошибка сохранения действия');
    }
  };

  const handleTemplateSelect = (template: { text: string; name?: string }) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const length = quill.getLength();
      // Используем название шаблона (name) или текст, если название не передано
      const textToInsert = template.name || template.text;
      quill.insertText(length - 1, textToInsert);
      quill.setSelection(length - 1 + textToInsert.length);
    }
  };

  const handleAddCodeBlock = () => {
    setEditingCodeBlock(undefined);
    setShowCodeEditor(true);
  };

  const handleEditCodeBlock = (codeBlock: ActionCodeBlock) => {
    setEditingCodeBlock(codeBlock);
    setShowCodeEditor(true);
  };

  const handleSaveCodeBlock = async (codeBlock: Omit<ActionCodeBlock, 'actionId' | 'orderIndex'>) => {
    if (editingCodeBlock) {
      setCodeBlocks(codeBlocks.map(cb => cb.id === editingCodeBlock.id ? { ...codeBlock, actionId: editingCodeBlock.actionId, orderIndex: editingCodeBlock.orderIndex } as ActionCodeBlock : cb));
    } else {
      const newBlock: ActionCodeBlock = {
        ...codeBlock,
        id: `codeblock-${Date.now()}`,
        actionId: actionId || '',
        orderIndex: codeBlocks.length
      };
      setCodeBlocks([...codeBlocks, newBlock]);
    }
    setShowCodeEditor(false);
    setEditingCodeBlock(undefined);
  };

  const handleDeleteCodeBlock = async (id: string) => {
    if (actionId) {
      await deleteCodeBlock(id);
    }
    setCodeBlocks(codeBlocks.filter(cb => cb.id !== id));
  };

  const handleAddScreenshot = (dataUrl: string) => {
    const newScreenshot: ActionScreenshot = {
      id: `screenshot-${Date.now()}`,
      actionId: actionId || '',
      dataUrl,
      orderIndex: screenshots.length
    };
    setScreenshots([...screenshots, newScreenshot]);
  };

  const handleDeleteScreenshot = async (id: string) => {
    if (actionId) {
      await deleteScreenshot(id);
    }
    setScreenshots(screenshots.filter(s => s.id !== id));
  };

  return (
    <div className="action-form">
      <div className="action-form-header">
        <h2>{actionId ? 'Редактировать пункт' : 'Создать пункт'}</h2>
        {tasks.length > 0 && (
          <div className="form-actions-top">
            <button type="submit" form="action-form" className="btn btn-primary">
              Сохранить
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn btn-secondary">
                Отмена
              </button>
            )}
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="alert alert-warning">
          Сначала создайте задачу в разделе "Управление задачами"
        </div>
      ) : (
        <form id="action-form" onSubmit={handleSubmit} className="form">
          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                id="action-task"
                value={formData.taskId}
                onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
                required
                disabled={!!taskId}
                style={{ color: formData.taskId ? '#333' : '#999' }}
              >
                <option value="">Выберите задачу *</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                id="action-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название действия (опционально)"
              />
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                id="action-short-description"
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="Краткое описание *"
              />
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
                <label htmlFor="time-hours" style={{ fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap' }}>Часы</label>
                <input
                  id="time-hours"
                  type="number"
                  min="0"
                  max="999"
                  value={formData.timeHours || 0}
                  onChange={(e) => setFormData({ ...formData, timeHours: parseInt(e.target.value) || 0 })}
                  style={{ width: '80px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '0 0 auto' }}>
                <label htmlFor="time-minutes" style={{ fontSize: '0.9rem', color: '#666', whiteSpace: 'nowrap' }}>Минуты</label>
                <input
                  id="time-minutes"
                  type="number"
                  min="0"
                  max="59"
                  value={formData.timeMinutes || 0}
                  onChange={(e) => setFormData({ ...formData, timeMinutes: parseInt(e.target.value) || 0 })}
                  style={{ width: '80px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="exclude-from-description"
                checked={formData.excludeFromDescription}
                onChange={(e) => setFormData({ ...formData, excludeFromDescription: e.target.checked })}
                style={{ margin: 0, width: 'auto', flexShrink: 0, cursor: 'pointer', marginTop: '0.2rem' }}
              />
              <label htmlFor="exclude-from-description" style={{ margin: 0, cursor: 'pointer', fontWeight: 'normal', fontSize: '0.9rem', lineHeight: '1.4' }}>
                Не включать в описание для переноса
              </label>
            </div>
          </div>

          <div className="action-form-main">
            <div className="action-form-content">
              <div className="form-group form-group-description">
                <ActionEditor
                  key={actionId || 'new'}
                  ref={quillRef}
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Описание"
                />
              </div>

              <div className="code-blocks-section">
                <div className="section-header">
                  <h3>Блоки кода</h3>
                  <button
                    type="button"
                    onClick={handleAddCodeBlock}
                    className="btn btn-sm btn-primary"
                  >
                    + Добавить блок кода
                  </button>
                </div>
                {codeBlocks.length > 0 && (
                  <div className="code-blocks-list">
                    {codeBlocks.map((codeBlock) => (
                      <div key={codeBlock.id} className="code-block-item">
                        <div className="code-block-header">
                          <span className="code-block-language">{codeBlock.language}</span>
                          <div className="code-block-actions">
                            <button
                              type="button"
                              onClick={() => handleEditCodeBlock(codeBlock)}
                              className="btn btn-xs btn-secondary"
                            >
                              Редактировать
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCodeBlock(codeBlock.id)}
                              className="btn btn-xs btn-danger"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                        <pre className="code-block-preview">
                          <code 
                            dangerouslySetInnerHTML={{ 
                              __html: (() => {
                                let text = codeBlock.codeText || '';
                                // Полная очистка от HTML перед обработкой
                                // Используем более простой и надежный способ
                                const tmp = document.createElement('DIV');
                                tmp.innerHTML = text;
                                text = tmp.textContent || tmp.innerText || '';
                                
                                let highlightedCode: string;
                                if (codeBlock.language === 'BSL') {
                                  highlightedCode = highlightBSL(text);
                                } else {
                                  highlightedCode = text
                                    .replace(/&/g, '&amp;')
                                    .replace(/</g, '&lt;')
                                    .replace(/>/g, '&gt;')
                                    .replace(/\n/g, '<br>')
                                    .replace(/\r/g, '');
                                }
                                
                                // Ограничиваем предпросмотр до 10 строк (увеличено для лучшего отображения)
                                const lines = highlightedCode.split('<br>');
                                const maxLines = 10;
                                if (lines.length > maxLines) {
                                  return lines.slice(0, maxLines).join('<br>') + '<br><span style="color: #808080; font-style: italic;">... (код обрезан, нажмите "Редактировать" для просмотра полного кода)</span>';
                                }
                                return highlightedCode;
                              })()
                            }} 
                          />
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="action-form-sidebar">
              <TemplatePanel onTemplateSelect={handleTemplateSelect} />
              <div className="screenshots-section">
                <ScreenshotManager
                  screenshots={screenshots}
                  onAdd={handleAddScreenshot}
                  onDelete={handleDeleteScreenshot}
                />
              </div>
            </div>
          </div>

        </form>
      )}

      {showCodeEditor && (
        <div className="modal-overlay" onClick={() => setShowCodeEditor(false)}>
          <div className="modal-content code-editor-modal" onClick={(e) => e.stopPropagation()}>
            <CodeBlockEditor
              codeBlock={editingCodeBlock}
              onSave={handleSaveCodeBlock}
              onCancel={() => {
                setShowCodeEditor(false);
                setEditingCodeBlock(undefined);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionForm;

