import { useState, useEffect } from 'react';
import { Action, Task } from '../types';
import { getActionsByTaskId, getTasks, deleteAction } from '../utils/storage';
import ActionForm from './ActionForm';

interface ActionListProps {
  initialTaskId?: string | null;
  onTaskIdProcessed?: () => void;
}

const ActionList = ({ initialTaskId, onTaskIdProcessed }: ActionListProps = {}) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  // Автоматически открываем форму при получении initialTaskId
  useEffect(() => {
    if (initialTaskId && !showAddForm && !editingActionId) {
      console.log('ActionList: открываем форму с taskId:', initialTaskId);
      setShowAddForm(true);
      setEditingActionId(undefined);
    }
  }, [initialTaskId]);

  const loadData = async () => {
    const tasksList = await getTasks();
    setTasks(tasksList);
    
    // Загружаем действия для каждой задачи
    const allActions: Action[] = [];
    for (const task of tasksList) {
      if (task.status === 'В Работе' || task.status === 'Завершен') {
        const taskActions = await getActionsByTaskId(task.id);
        allActions.push(...taskActions);
      }
    }
    setActions(allActions);
  };

  const handleSave = async () => {
    await loadData();
    setShowAddForm(false);
    setEditingActionId(undefined);
    // Уведомляем родительский компонент после сохранения
    if (onTaskIdProcessed) {
      onTaskIdProcessed();
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingActionId(undefined);
    // Уведомляем родительский компонент после отмены
    if (onTaskIdProcessed) {
      onTaskIdProcessed();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот пункт?')) {
      await deleteAction(id);
      await loadData();
    }
  };

  const handleEdit = (id: string) => {
    setEditingActionId(id);
    setShowAddForm(false);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Группируем действия по задачам
  const groupedActions = actions.reduce((acc, action) => {
    const task = tasks.find(t => t.id === action.taskId);
    if (!task) return acc;
    
    // Показываем только для задач со статусом "В Работе" или "Завершен"
    if (task.status !== 'В Работе' && task.status !== 'Завершен') {
      return acc;
    }

    if (!acc[task.id]) {
      acc[task.id] = {
        task,
        actions: []
      };
    }
    acc[task.id].actions.push(action);
    return acc;
  }, {} as Record<string, { task: Task; actions: Action[] }>);

  const sortedGroups = Object.values(groupedActions).sort((a, b) => {
    return new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime();
  });

  return (
    <div className="action-list">
      {!showAddForm && !editingActionId && (
        <div className="section-header">
          <h2>Пункты</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary"
          >
            Добавить пункт
          </button>
        </div>
      )}

      {showAddForm && (
        <ActionForm 
          key={`form-${initialTaskId || 'new'}`} // key для пересоздания формы при изменении taskId
          taskId={initialTaskId || undefined}
          onSave={handleSave} 
          onCancel={handleCancel} 
        />
      )}

      {editingActionId && (
        <ActionForm actionId={editingActionId} onSave={handleSave} onCancel={handleCancel} />
      )}

      {!showAddForm && !editingActionId && sortedGroups.length > 0 && (
        <div className="actions-grouped">
          {sortedGroups.map((group) => (
            <div key={group.task.id} className="task-group">
              <div className="task-group-header">
                <h3>{group.task.name}</h3>
                <span className={`task-status-badge status-${group.task.status.toLowerCase().replace(' ', '-')}`}>
                  {group.task.status}
                </span>
              </div>
              <div className="task-group-items">
                <table className="actions-table">
                  <thead>
                    <tr>
                      <th>Название</th>
                      <th>Короткое описание</th>
                      <th>Время</th>
                      <th>Создан</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.actions.map((action) => (
                      <tr key={action.id}>
                        <td>{action.name || `Пункт ${action.id.slice(-6)}`}</td>
                        <td>{action.shortDescription || '-'}</td>
                        <td>
                          {action.timeHours > 0 || action.timeMinutes > 0
                            ? `${action.timeHours}ч ${action.timeMinutes}м`
                            : '-'}
                        </td>
                        <td>{formatDateTime(action.createdAt)}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(action.id)}
                            className="btn btn-xs btn-secondary"
                          >
                            Редактировать
                          </button>
                          <button
                            onClick={() => handleDelete(action.id)}
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
            </div>
          ))}
        </div>
      )}

      {!showAddForm && !editingActionId && sortedGroups.length === 0 && (
        <div className="alert alert-info">
          Нет пунктов для отображения. Создайте задачу со статусом "В Работе" или "Завершен" и добавьте пункты.
        </div>
      )}
    </div>
  );
};

export default ActionList;

