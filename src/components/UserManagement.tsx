import { useState, useEffect } from 'react';
import { api, authApi, UserResponse } from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    isAdmin: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersList = await api.get<UserResponse[]>('/users');
      setUsers(usersList);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!editingUser && formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (editingUser && formData.password && formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    try {
      if (editingUser) {
        // Обновление пользователя
        await api.put(`/users/${editingUser.id}`, {
          username: formData.username,
          password: formData.password || undefined,
          fullName: formData.fullName || undefined,
          isAdmin: formData.isAdmin
        });
      } else {
        // Создание пользователя
        await authApi.register(formData.username, formData.password, formData.fullName || undefined, formData.isAdmin);
      }
      setFormData({ username: '', password: '', fullName: '', isAdmin: false });
      setShowForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || (editingUser ? 'Ошибка обновления пользователя' : 'Ошибка создания пользователя'));
    }
  };

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      fullName: user.fullName || '',
      isAdmin: user.isAdmin
    });
    setShowForm(true);
    setError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', fullName: '', isAdmin: false });
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Ошибка удаления пользователя');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>Управление пользователями</h2>
        <button onClick={() => { setEditingUser(null); setFormData({ username: '', password: '', fullName: '', isAdmin: false }); setShowForm(!showForm); }} className="btn btn-primary">
          {showForm ? 'Отмена' : 'Добавить пользователя'}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {showForm && (
        <div className="form-container" style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3>{editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="username">Имя пользователя *</label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="fullName">ФИО</label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Фамилия Имя Отчество"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="password">
                {editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль * (минимум 6 символов)'}
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
                minLength={editingUser ? undefined : 6}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                <span>Администратор</span>
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editingUser ? 'Сохранить' : 'Создать'}</button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {users.length === 0 ? (
        <div className="alert alert-info">Пользователи не найдены</div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Имя пользователя</th>
              <th>ФИО</th>
              <th>Роль</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.fullName || '-'}</td>
                <td>{user.isAdmin ? 'Администратор' : 'Пользователь'}</td>
                <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                  <button
                    onClick={() => handleEdit(user)}
                    className="btn btn-xs btn-secondary"
                    title="Редактировать"
                    style={{ marginRight: '0.5rem' }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="btn btn-xs btn-danger"
                    title="Удалить"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;

