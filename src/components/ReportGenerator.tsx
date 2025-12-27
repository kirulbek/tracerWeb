import { useState, useEffect } from 'react';
import { Task } from '../types';
import { getTasks } from '../utils/storage';
import { generateHTMLReport, generateCompactReport } from '../utils/export';
import { useAuth } from '../contexts/AuthContext';

type ReportType = 'transfer' | 'general';

interface ReportGeneratorProps {
  reportType: ReportType;
  onReportTypeChange?: (type: ReportType, taskId?: string) => void;
  initialTaskId?: string | null;
  onTaskIdProcessed?: () => void;
}

const ReportGenerator = ({ reportType, initialTaskId, onTaskIdProcessed }: ReportGeneratorProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [reportHTML, setReportHTML] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    const tasksList = await getTasks();
    setTasks(tasksList);
  };

  const handleGenerateWithTaskId = async (taskId: string) => {
    setLoading(true);
    try {
      let html: string;
      const userFullName = user?.fullName;
      if (reportType === 'transfer') {
        html = await generateHTMLReport(taskId, userFullName);
      } else {
        html = await generateCompactReport(taskId, userFullName);
      }
      setReportHTML(html);
    } catch (error) {
      console.error('Ошибка генерации отчета:', error);
      alert('Ошибка генерации отчета');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Автоматически выбираем задачу и формируем отчет при получении initialTaskId
  useEffect(() => {
    if (initialTaskId && tasks.length > 0) {
      setSelectedTaskId(initialTaskId);
      // Небольшая задержка, чтобы состояние обновилось
      const timer = setTimeout(() => {
        handleGenerateWithTaskId(initialTaskId);
        // Уведомляем родительский компонент, что taskId обработан
        if (onTaskIdProcessed) {
          onTaskIdProcessed();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTaskId, tasks.length]);

  const handleGenerate = async () => {
    if (!selectedTaskId) {
      alert('Выберите задачу');
      return;
    }
    await handleGenerateWithTaskId(selectedTaskId);
  };

  const handleExport = () => {
    if (!reportHTML || !selectedTaskId) return;

    // Получаем имя задачи
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const taskName = selectedTask ? selectedTask.name : 'Задача';
    
    // Очищаем имя задачи от недопустимых символов для имени файла
    const sanitizeFileName = (name: string): string => {
      return name
        .replace(/[<>:"/\\|?*]/g, '') // Удаляем недопустимые символы
        .replace(/\s+/g, ' ') // Заменяем множественные пробелы на один
        .trim(); // Убираем пробелы в начале и конце
    };
    
    const cleanTaskName = sanitizeFileName(taskName);
    
    // Формируем имя файла в зависимости от типа отчета
    let fileName: string;
    if (reportType === 'transfer') {
      fileName = `Описание - ${cleanTaskName}.html`;
    } else {
      fileName = `Отчет - ${cleanTaskName}.html`;
    }

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    if (reportType === 'transfer') {
      return 'Описание для переноса';
    } else if (reportType === 'general') {
      return 'Общий отчет';
    }
    return 'Отчеты';
  };

  return (
    <>
      <h2>{getReportTitle()}</h2>
      <div className="report-controls">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="report-task">Задача:</label>
            <select
              id="report-task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">Выберите задачу</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>&nbsp;</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleGenerate}
                className="btn btn-primary"
                disabled={!selectedTaskId || loading}
              >
                {loading ? 'Формирование...' : 'Сформировать'}
              </button>
              {reportHTML && (
                <button
                  onClick={handleExport}
                  className="btn btn-primary"
                >
                  Экспортировать в HTML
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportHTML && (
        <div className="report-preview-container" style={{ marginTop: '1.5rem', height: 'calc(100vh - 400px)', minHeight: '600px' }}>
          <iframe
            srcDoc={reportHTML}
            title="Предпросмотр отчета"
            style={{
              width: '100%',
              height: '100%',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          />
        </div>
      )}
    </>
  );
};

export default ReportGenerator;

