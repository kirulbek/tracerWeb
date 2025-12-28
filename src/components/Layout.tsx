import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../utils/initials';
import logo from '../assets/logo.png';

type Tab = 'tasks' | 'actions' | 'reports' | 'managers' | 'templates' | 'archive' | 'users';
type ReportType = 'transfer' | 'general';

interface LayoutProps {
  children: ReactNode;
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  reportType?: ReportType;
  onReportTypeChange?: (type: ReportType) => void;
  showReportSubmenu?: boolean;
  onReportSubmenuToggle?: () => void;
  user?: { userId: string; username: string; fullName?: string; isAdmin: boolean } | null;
}

const Layout = ({ 
  children, 
  currentTab, 
  onTabChange, 
  reportType, 
  onReportTypeChange,
  showReportSubmenu,
  onReportSubmenuToggle,
  user
}: LayoutProps) => {
  const { logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          width: '100%',
          maxWidth: '1500px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <img 
                src={logo} 
                alt="Арсансофт" 
                style={{ height: '40px', width: 'auto' }}
              />
              <h1>Трассировка изменений 1С</h1>
            </div>
            <p className="subtitle">Система документирования изменений конфигурации</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              {user?.fullName ? getInitials(user.fullName) : user?.username}
              {user?.isAdmin && <span style={{ marginLeft: '0.5rem', color: '#ffc107' }}>(Админ)</span>}
            </span>
            <button
              onClick={logout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Выход
            </button>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div style={{ 
          maxWidth: '1500px', 
          width: '100%', 
          margin: '0 auto', 
          padding: '0 2rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            className={currentTab === 'tasks' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onTabChange('tasks')}
          >
            Управление задачами
          </button>
          <button
            className={currentTab === 'actions' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onTabChange('actions')}
          >
            Пункты
          </button>
          <div 
            className="nav-item-with-submenu"
            onMouseEnter={() => {
              if (onReportSubmenuToggle) {
                onReportSubmenuToggle();
              }
            }}
            onMouseLeave={() => {
              if (onReportSubmenuToggle) {
                onReportSubmenuToggle();
              }
            }}
          >
            <button
              className={currentTab === 'reports' ? 'nav-btn active' : 'nav-btn'}
              onClick={(e) => {
                e.stopPropagation();
                // Не переключаемся на страницу при клике
              }}
            >
              Отчеты
            </button>
            {showReportSubmenu && reportType && onReportTypeChange && (
              <div className="report-submenu-dropdown">
                <div>
                  <button
                    className={reportType === 'transfer' ? 'report-submenu-item active' : 'report-submenu-item'}
                    onClick={() => onReportTypeChange('transfer')}
                  >
                    Описание для переноса
                  </button>
                  <button
                    className={reportType === 'general' ? 'report-submenu-item active' : 'report-submenu-item'}
                    onClick={() => onReportTypeChange('general')}
                  >
                    Общий отчет
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            className={currentTab === 'managers' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onTabChange('managers')}
          >
            Менеджеры
          </button>
          <button
            className={currentTab === 'templates' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onTabChange('templates')}
          >
            Шаблоны
          </button>
          <button
            className={currentTab === 'archive' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => onTabChange('archive')}
          >
            Архив
          </button>
          {user?.isAdmin && (
            <button
              className={currentTab === 'users' ? 'nav-btn active' : 'nav-btn'}
              onClick={() => onTabChange('users')}
            >
              Пользователи
            </button>
          )}
        </div>
      </nav>

      <main className="app-main">
        {children}
      </main>

      <footer className="app-footer">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          maxWidth: '1500px', 
          margin: '0 auto', 
          padding: '0 2rem' 
        }}>
          <p>&copy; 2025 Трассировка изменений 1С</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Разработано</span>
            <img 
              src={logo} 
              alt="Арсансофт" 
              style={{ height: '24px', width: 'auto', opacity: 0.8 }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

