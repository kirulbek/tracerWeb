import { useState, useEffect } from 'react';
import { Task, Manager, TaskStatus } from '../types';
import { getTasks, saveTask, deleteTask, getManagers, setTaskManagers, getManagersByTaskId, getActionsByTaskId } from '../utils/storage';

interface ArchivePageProps {
  onGenerateReport?: (taskId: string, reportType: 'transfer' | 'general') => void;
}

const ArchivePage = ({ onGenerateReport }: ArchivePageProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [taskManagersMap, setTaskManagersMap] = useState<Map<string, Manager[]>>(new Map());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Архив' as TaskStatus,
    notes: '',
    managerId: ''
  });

  // Статусы для формы (включая Архив) - такие же как в TaskManager
  const formStatuses: TaskStatus[] = ['Ожидание', 'В Работе', 'Завершен', 'Сдано', 'Архив'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tasksList, managersList] = await Promise.all([
      getTasks(),
      getManagers()
    ]);
    // Фильтруем только архивные задачи
    const archivedTasks = tasksList.filter(t => t.status === 'Архив');
    setTasks(archivedTasks);
    setManagers(managersList);
    
    // Загружаем менеджеров для каждой задачи
    const map = new Map<string, Manager[]>();
    for (const task of archivedTasks) {
      const taskManagers = await getManagersByTaskId(task.id);
      map.set(task.id, taskManagers);
    }
    setTaskManagersMap(map);
  };

  const handleEdit = async (task: Task) => {
    setEditingTask(task);
    const taskManagers = await getManagersByTaskId(task.id);
    setFormData({
      name: task.name,
      description: task.description || '',
      status: task.status,
      notes: task.notes || '',
      managerId: taskManagers.length > 0 ? taskManagers[0].id : ''
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const task: Task = {
      id: editingTask?.id || `task-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      notes: formData.notes,
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

  const handleDelete = async (taskId: string) => {
    // Проверяем, есть ли пункты для этой задачи
    const actions = await getActionsByTaskId(taskId);
    if (actions.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      const taskName = task ? task.name : 'эта задача';
      if (!window.confirm(`Внимание! У задачи "${taskName}" есть ${actions.length} пункт(ов).\n\nВы уверены, что хотите удалить эту задачу вместе со всеми пунктами?`)) {
        return;
      }
    } else {
      if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
        return;
      }
    }
    
    await deleteTask(taskId);
    await loadData();
  };

  // const getManagerName = (taskId: string) => {
  //   const task = tasks.find(t => t.id === taskId);
  //   if (!task) return '-';
  //   // Здесь можно добавить логику получения имени менеджера
  //   return '-';
  // };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleGenerateReport = (taskId: string, reportType: 'transfer' | 'general') => {
    // Переходим на страницу отчетов с выбранной задачей
    if (onGenerateReport) {
      onGenerateReport(taskId, reportType);
    }
  };

  return (
    <div className="archive-page">
      <div className="section-header">
        <h2>Архив</h2>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Сохранить</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="alert alert-info">
          <p>В архиве пока нет задач.</p>
        </div>
      ) : (
        <div className="archive-tasks-list">
          <table className="data-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Менеджер</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const taskManagers = taskManagersMap.get(task.id) || [];
                const managerNames = taskManagers.map(m => m.name);
                
                return (
                  <tr key={task.id}>
                    <td>{task.name}</td>
                    <td>{task.description || '-'}</td>
                    <td>{managerNames.length > 0 ? managerNames.join(', ') : '-'}</td>
                    <td>{formatDate(task.createdAt)}</td>
                    <td>
                      <div className="task-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(task)}
                          className="btn btn-xs btn-secondary"
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
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
                          className="btn btn-xs btn-info"
                          title="Общий отчет"
                        >
                          📊
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;

