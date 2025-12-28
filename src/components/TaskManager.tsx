import { useState, useEffect } from 'react';
import { Task, Manager, TaskStatus } from '../types';
import { getTasks, saveTask, deleteTask, getManagers, setTaskManagers, getManagersByTaskId, getActionsByTaskId } from '../utils/storage';

interface TaskManagerProps {
  onGenerateReport?: (taskId: string, reportType: 'transfer' | 'general') => void;
  onAddAction?: (taskId: string) => void;
}

const TaskManager = ({ onGenerateReport, onAddAction }: TaskManagerProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Ожидание' as TaskStatus,
    notes: '',
    managerId: '',
    blockStartMarker: '',
    blockEndMarker: ''
  });

  // Статусы для отображения колонок (без Архив)
  const statuses: TaskStatus[] = ['Ожидание', 'В Работе', 'Завершен', 'Сдано'];
  // Статусы для формы (включая Архив)
  const formStatuses: TaskStatus[] = ['Ожидание', 'В Работе', 'Завершен', 'Сдано', 'Архив'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tasksList, managersList] = await Promise.all([
      getTasks(),
      getManagers()
    ]);
    setTasks(tasksList);
    setManagers(managersList);
  };

  const handleAdd = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      description: '',
      status: 'Ожидание',
      notes: '',
      managerId: '',
      blockStartMarker: '',
      blockEndMarker: ''
    });
    setShowForm(true);
  };

  const handleEdit = async (task: Task) => {
    setEditingTask(task);
    const taskManagers = await getManagersByTaskId(task.id);
    setFormData({
      name: task.name,
      description: task.description || '',
      status: task.status,
      notes: task.notes || '',
      managerId: taskManagers.length > 0 ? taskManagers[0].id : '',
      blockStartMarker: task.blockStartMarker || '',
      blockEndMarker: task.blockEndMarker || ''
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: ВЕРНУТЬ ОБРАТНО ПЕРЕД ПУБЛИКАЦИЕЙ - автоматически удаляем пробелы (как СокрЛП в 1С)
    // Удаляем пробелы в начале и конце маркеров при сохранении
    const trimmedStartMarker = formData.blockStartMarker.trim();
    const trimmedEndMarker = formData.blockEndMarker.trim();
    
    const task: Task = {
      id: editingTask?.id || `task-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      notes: formData.notes,
      blockStartMarker: trimmedStartMarker === '' ? undefined : trimmedStartMarker,
      blockEndMarker: trimmedEndMarker === '' ? undefined : trimmedEndMarker,
      createdAt: editingTask?.createdAt || new Date()
    };

    const savedTask = await saveTask(task);
    
    if (formData.managerId) {
      await setTaskManagers(savedTask.id, [formData.managerId]);
    } else {
      await setTaskManagers(savedTask.id, []);
    }

    await loadData();
    setShowForm(false);
    setEditingTask(null);
  };

  const handleDelete = async (id: string) => {
    // Проверяем, есть ли пункты для этой задачи
    const actions = await getActionsByTaskId(id);
    if (actions.length > 0) {
      const task = tasks.find(t => t.id === id);
      const taskName = task ? task.name : 'эта задача';
      if (!confirm(`Внимание! У задачи "${taskName}" есть ${actions.length} пункт(ов).\n\nВы уверены, что хотите удалить эту задачу вместе со всеми пунктами?`)) {
        return;
      }
    } else {
      if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
        return;
      }
    }
    
    await deleteTask(id);
    await loadData();
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== newStatus) {
      await saveTask({ ...task, status: newStatus });
      await loadData();
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  const handleGenerateReport = (taskId: string, reportType: 'transfer' | 'general') => {
    // Переходим на страницу отчетов с выбранной задачей
    if (onGenerateReport) {
      onGenerateReport(taskId, reportType);
    }
  };

  return (
    <div className="task-manager">
      <div className="section-header">
        <h2>Управление задачами</h2>
        <button onClick={handleAdd} className="btn btn-primary">
          Добавить задачу
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingTask ? 'Редактировать задачу' : 'Создать задачу'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="task-name">Название *</label>
                <input
                  id="task-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-description">Описание</label>
                <textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-status">Статус</label>
                <select
                  id="task-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                >
                  {formStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-manager">Менеджер</label>
                <select
                  id="task-manager"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                >
                  <option value="">Выберите менеджера</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="task-notes">Заметки (логины, пароли и т.д.)</label>
                <textarea
                  id="task-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Логины, пароли, доступы и другая информация"
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-block-start-marker">Маркер начала блока кода</label>
                <input
                  id="task-block-start-marker"
                  type="text"
                  value={formData.blockStartMarker}
                  onChange={(e) => setFormData({ ...formData, blockStartMarker: e.target.value })}
                  placeholder="Например: КУ-001 (если пусто, блоки не выделяются)"
                />
              </div>
              <div className="form-group">
                <label htmlFor="task-block-end-marker">Маркер конца блока кода</label>
                <input
                  id="task-block-end-marker"
                  type="text"
                  value={formData.blockEndMarker}
                  onChange={(e) => setFormData({ ...formData, blockEndMarker: e.target.value })}
                  placeholder="Например: КУ-001-END (если пусто, используется маркер начала)"
                />
              </div>
              <div className="form-group">
                <small style={{ display: 'block', marginTop: '0.25rem', color: '#666', fontSize: '0.85rem', lineHeight: '1.6', padding: '0.75rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <strong>Инструкция по использованию маркеров:</strong><br/>
                  1. Введите только текст маркера БЕЗ "//" (например: "КУ-001" или "АрсанСофт Программист2026")<br/>
                  2. В коде используйте в начале: <code>//{'{'}Маркер начала блока кода{'}'}</code> - Пример: <code>//АрсанСофт Программист2026</code><br/>
                  3. В коде используйте в конце: <code>//{'{'}Маркер конца блока кода{'}'}</code> - Пример: <code>//АрсанСофт Программист2026 END</code><br/>
                  4. <strong style={{color: '#d32f2f'}}>Важно:</strong> маркеры начала и конца не должны быть одинаковыми. Если хотя бы один из маркеров пустой, блоки не будут выделяться.
                </small>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="tasks-columns">
        {statuses.map(status => (
          <div
            key={status}
            className={`task-column task-column-${status.toLowerCase().replace(' ', '-')}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <h3>{status}</h3>
            <div className="task-column-content">
              {getTasksByStatus(status).map(task => (
                <div
                  key={task.id}
                  className="task-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                <div className="task-card-header">
                  <div className="task-card-actions-top">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(task);
                      }}
                      className="btn btn-xs btn-secondary"
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(task.id);
                      }}
                      className="btn btn-xs btn-danger"
                      title="Удалить"
                    >
                      ×
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleGenerateReport(task.id, 'transfer');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="btn btn-xs btn-info"
                      title="Описание для переноса"
                    >
                      📄
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleGenerateReport(task.id, 'general');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="btn btn-xs btn-info"
                      title="Общий отчет"
                    >
                      📊
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        if (onAddAction) {
                          onAddAction(task.id);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="btn btn-xs btn-success"
                      title="Добавить пункт"
                    >
                      +
                    </button>
                  </div>
                  <h4>{task.name}</h4>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
                {task.notes && (
                  <div className="task-card-notes">
                    <strong>Заметки:</strong>
                    <div className="task-notes-content">{task.notes}</div>
                  </div>
                )}
                <div className="task-card-footer">
                  <span className="task-date">
                    {new Date(task.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;

