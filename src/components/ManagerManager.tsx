import { useState, useEffect } from 'react';
import { Manager } from '../types';
import { getManagers, saveManager, deleteManager } from '../utils/storage';

const ManagerManager = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    loadManagers();
  }, []);

  const loadManagers = async () => {
    const managersList = await getManagers();
    setManagers(managersList);
  };

  const handleAdd = () => {
    setEditingManager(null);
    setFormData({ name: '' });
    setShowForm(true);
  };

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({ name: manager.name });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const manager: Manager = {
      id: editingManager?.id || '',
      name: formData.name,
      createdAt: editingManager?.createdAt || new Date()
    };

    await saveManager(manager);
    await loadManagers();
    setShowForm(false);
    setEditingManager(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этого менеджера?')) {
      await deleteManager(id);
      await loadManagers();
    }
  };

  return (
    <div className="manager-manager">
      <div className="section-header">
        <h2>Менеджеры</h2>
        <button onClick={handleAdd} className="btn btn-primary">
          Добавить менеджера
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingManager ? 'Редактировать менеджера' : 'Создать менеджера'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="manager-name">Имя *</label>
                <input
                  id="manager-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
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

      <table className="data-table">
        <thead>
          <tr>
            <th>Имя</th>
            <th>Создан</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {managers.map((manager) => (
            <tr key={manager.id}>
              <td>{manager.name}</td>
              <td>{new Date(manager.createdAt).toLocaleDateString('ru-RU')}</td>
              <td>
                <button
                  onClick={() => handleEdit(manager)}
                  className="btn btn-xs btn-secondary"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(manager.id)}
                  className="btn btn-xs btn-danger"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {managers.length === 0 && (
        <div className="alert alert-info">
          Нет менеджеров. Добавьте первого менеджера.
        </div>
      )}
    </div>
  );
};

export default ManagerManager;

