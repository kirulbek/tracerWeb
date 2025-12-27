import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import TaskManager from './components/TaskManager';
import ActionList from './components/ActionList';
import ReportGenerator from './components/ReportGenerator';
import ManagerManager from './components/ManagerManager';
import TemplateManager from './components/TemplateManager';
import ArchivePage from './components/ArchivePage';
import Login from './components/Login';
import UserManagement from './components/UserManagement';

type Tab = 'tasks' | 'actions' | 'reports' | 'managers' | 'templates' | 'archive' | 'users';
type ReportType = 'transfer' | 'general';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('tasks');
  const [reportType, setReportType] = useState<ReportType>('transfer');
  const [showReportSubmenu, setShowReportSubmenu] = useState(false);
  const [reportTaskId, setReportTaskId] = useState<string | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);

  const handleTabChange = (tab: Tab) => {
    if (tab === 'reports') {
      // Не переключаемся напрямую, только через подменю
      return;
    }
    setCurrentTab(tab);
    setShowReportSubmenu(false);
  };

  const handleReportTypeSelect = (type: ReportType, taskId?: string) => {
    setReportType(type);
    setCurrentTab('reports');
    setShowReportSubmenu(false);
    if (taskId) {
      setReportTaskId(taskId);
    }
  };

  const toggleReportSubmenu = () => {
    setShowReportSubmenu(!showReportSubmenu);
  };

  // Показываем загрузку
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Загрузка...</div>
      </div>
    );
  }

  // Показываем форму входа, если не авторизован
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout
      currentTab={currentTab}
      onTabChange={handleTabChange}
      reportType={reportType}
      onReportTypeChange={handleReportTypeSelect}
      showReportSubmenu={showReportSubmenu}
      onReportSubmenuToggle={toggleReportSubmenu}
      user={user}
    >
      {currentTab === 'tasks' && (
        <TaskManager 
          onGenerateReport={(taskId, reportType) => {
            handleReportTypeSelect(reportType, taskId);
          }}
          onAddAction={(taskId) => {
            setActionTaskId(taskId);
            setCurrentTab('actions');
          }}
        />
      )}
      {currentTab === 'actions' && (
        <ActionList 
          initialTaskId={actionTaskId}
          onTaskIdProcessed={() => {
            // Очищаем только после того, как форма использовала taskId
            setTimeout(() => setActionTaskId(null), 500);
          }}
        />
      )}
      {currentTab === 'reports' && (
        <ReportGenerator 
          reportType={reportType} 
          onReportTypeChange={handleReportTypeSelect}
          initialTaskId={reportTaskId}
          onTaskIdProcessed={() => setReportTaskId(null)}
        />
      )}
      {currentTab === 'managers' && <ManagerManager />}
      {currentTab === 'templates' && <TemplateManager />}
      {currentTab === 'archive' && (
        <ArchivePage 
          onGenerateReport={(taskId, reportType) => {
            handleReportTypeSelect(reportType, taskId);
          }}
        />
      )}
      {currentTab === 'users' && user?.isAdmin && <UserManagement />}
    </Layout>
  );
}

export default App;

