import { Task, Action, ActionTemplate, ActionCodeBlock, ActionScreenshot, Manager, TaskStatus } from '../types';
import { api } from './api';

// Преобразование типов из API в типы фронтенда
function convertTaskFromApi(task: any): Task {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    status: task.status as TaskStatus,
    notes: task.notes,
    createdAt: new Date(task.createdAt)
  };
}

function convertActionFromApi(action: any): Action {
  // Парсим дату из формата "YYYY-MM-DD HH:MM:SS" (локальное время клиента)
  // Создаем Date объект, интерпретируя строку как локальное время
  let createdAt: Date;
  if (action.createdAt) {
    // Если дата в формате "YYYY-MM-DD HH:MM:SS" или "YYYY-MM-DDTHH:MM:SS"
    const dateStr = action.createdAt.replace('T', ' ').substring(0, 19);
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    // Создаем Date в локальном времени браузера
    createdAt = new Date(year, month - 1, day, hours, minutes, seconds);
  } else {
    createdAt = new Date();
  }
  
  return {
    id: action.id,
    taskId: action.taskId,
    name: action.name,
    description: action.description,
    shortDescription: action.shortDescription,
    excludeFromDescription: action.excludeFromDescription || false,
    timeHours: action.timeHours || 0,
    timeMinutes: action.timeMinutes || 0,
    orderIndex: action.orderIndex || 0,
    createdAt
  };
}

function convertManagerFromApi(manager: any): Manager {
  return {
    id: manager.id,
    name: manager.name,
    createdAt: new Date(manager.createdAt)
  };
}

function convertTemplateFromApi(template: any): ActionTemplate {
  return {
    id: template.id,
    name: template.name,
    text: template.text,
    category: template.category,
    usageCount: template.usageCount || 0,
    createdAt: new Date(template.createdAt)
  };
}

function convertCodeBlockFromApi(block: any): ActionCodeBlock {
  return {
    id: block.id,
    actionId: block.actionId,
    language: block.language,
    codeText: block.codeText,
    collapsible: block.collapsible || false,
    orderIndex: block.orderIndex || 0
  };
}

function convertScreenshotFromApi(screenshot: any): ActionScreenshot {
  return {
    id: screenshot.id,
    actionId: screenshot.actionId,
    dataUrl: screenshot.dataUrl,
    orderIndex: screenshot.orderIndex || 0
  };
}

// Tasks
export async function getTasks(): Promise<Task[]> {
  const tasks = await api.get<any[]>('/tasks');
  return tasks.map(convertTaskFromApi);
}

export async function saveTask(task: Task): Promise<Task> {
  const taskData = {
    name: task.name,
    description: task.description,
    status: task.status,
    notes: task.notes
  };

  if (task.id && task.id.startsWith('task-') && task.id.length > 20) {
    // Обновление существующей задачи
    const updated = await api.put<any>(`/tasks/${task.id}`, taskData);
    return convertTaskFromApi(updated);
  } else {
    // Создание новой задачи (API вернет новую задачу с ID)
    const created = await api.post<any>('/tasks', taskData);
    return convertTaskFromApi(created);
  }
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

// Managers
export async function getManagers(): Promise<Manager[]> {
  const managers = await api.get<any[]>('/managers');
  return managers.map(convertManagerFromApi);
}

export async function saveManager(manager: Manager): Promise<Manager> {
  const managerData = {
    name: manager.name
  };

  // Если есть ID и это существующий менеджер (ID начинается с 'manager-' и имеет правильный формат), обновляем
  if (manager.id && manager.id.startsWith('manager-') && manager.id.length > 20) {
    try {
      const updated = await api.put<any>(`/managers/${manager.id}`, managerData);
      return convertManagerFromApi(updated);
    } catch (error: any) {
      // Если менеджер не найден (404), создаем новый
      if (error.message?.includes('не найден') || error.message?.includes('404') || error.message?.includes('Not found')) {
        const created = await api.post<any>('/managers', managerData);
        return convertManagerFromApi(created);
      }
      throw error;
    }
  } else {
    // Создание нового менеджера
    const created = await api.post<any>('/managers', managerData);
    return convertManagerFromApi(created);
  }
}

export async function deleteManager(id: string): Promise<void> {
  await api.delete(`/managers/${id}`);
}

export async function getManagersByTaskId(taskId: string): Promise<Manager[]> {
  const managers = await api.get<any[]>(`/managers/task/${taskId}`);
  return managers.map(convertManagerFromApi);
}

export async function setTaskManagers(taskId: string, managerIds: string[]): Promise<void> {
  await api.post(`/managers/task/${taskId}`, { managerIds });
}

// Actions
export async function getActions(): Promise<Action[]> {
  // API не поддерживает получение всех действий сразу, нужно получать по taskId
  // Для обратной совместимости возвращаем пустой массив
  // Компоненты должны использовать getActionsByTaskId
  return [];
}

export async function getActionsByTaskId(taskId: string): Promise<Action[]> {
  const actions = await api.get<any[]>(`/actions?taskId=${taskId}`);
  return actions.map(convertActionFromApi);
}

export async function saveAction(action: Action): Promise<Action> {
  const actionData: any = {
    taskId: action.taskId,
    name: action.name,
    description: action.description,
    shortDescription: action.shortDescription,
    excludeFromDescription: action.excludeFromDescription,
    timeHours: action.timeHours,
    timeMinutes: action.timeMinutes,
    orderIndex: action.orderIndex
  };

  // Проверяем, существует ли действие (если ID начинается с 'action-' и имеет правильный формат)
  if (action.id && action.id.startsWith('action-') && action.id.length > 20) {
    // Обновление существующего действия - не отправляем createdAt
    const updated = await api.put<any>(`/actions/${action.id}`, actionData);
    return convertActionFromApi(updated);
  } else {
    // Создание нового действия - отправляем время клиента в локальном формате
    // Форматируем время клиента как "YYYY-MM-DD HH:MM:SS" (без конвертации в UTC)
    const clientDate = action.createdAt;
    const year = clientDate.getFullYear();
    const month = String(clientDate.getMonth() + 1).padStart(2, '0');
    const day = String(clientDate.getDate()).padStart(2, '0');
    const hours = String(clientDate.getHours()).padStart(2, '0');
    const minutes = String(clientDate.getMinutes()).padStart(2, '0');
    const seconds = String(clientDate.getSeconds()).padStart(2, '0');
    actionData.createdAt = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    const created = await api.post<any>('/actions', actionData);
    return convertActionFromApi(created);
  }
}

export async function deleteAction(id: string): Promise<void> {
  await api.delete(`/actions/${id}`);
}

// Templates
export async function getTemplates(): Promise<ActionTemplate[]> {
  const templates = await api.get<any[]>('/templates');
  return templates.map(convertTemplateFromApi);
}

export async function saveTemplate(template: ActionTemplate): Promise<ActionTemplate> {
  const templateData = {
    name: template.name,
    text: template.text,
    category: template.category
  };

  if (template.id && template.id.startsWith('template-') && template.id.length > 20) {
    try {
      const updated = await api.put<any>(`/templates/${template.id}`, templateData);
      return convertTemplateFromApi(updated);
    } catch (error: any) {
      // Если шаблон не найден, создаем новый
      if (error.message?.includes('не найден') || error.message?.includes('404') || error.message?.includes('Not found')) {
        const created = await api.post<any>('/templates', templateData);
        return convertTemplateFromApi(created);
      }
      throw error;
    }
  } else {
    // Создание нового шаблона
    const created = await api.post<any>('/templates', templateData);
    return convertTemplateFromApi(created);
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

export async function incrementTemplateUsage(id: string): Promise<void> {
  await api.post(`/templates/${id}/increment-usage`, {});
}

// Code Blocks
export async function getCodeBlocksByActionId(actionId: string): Promise<ActionCodeBlock[]> {
  const blocks = await api.get<any[]>(`/code-blocks?actionId=${actionId}`);
  return blocks.map(convertCodeBlockFromApi);
}

export async function saveCodeBlock(codeBlock: ActionCodeBlock): Promise<ActionCodeBlock> {
  const blockData = {
    actionId: codeBlock.actionId,
    language: codeBlock.language,
    codeText: codeBlock.codeText,
    collapsible: codeBlock.collapsible,
    orderIndex: codeBlock.orderIndex
  };

  if (codeBlock.id && codeBlock.id.startsWith('codeblock-') && codeBlock.id.length > 20) {
    try {
      const updated = await api.put<any>(`/code-blocks/${codeBlock.id}`, blockData);
      return convertCodeBlockFromApi(updated);
    } catch (error: any) {
      // Если блок не найден, создаем новый
      if (error.message?.includes('не найден') || error.message?.includes('404') || error.message?.includes('Not found')) {
        const created = await api.post<any>('/code-blocks', blockData);
        return convertCodeBlockFromApi(created);
      }
      throw error;
    }
  } else {
    // Создание нового блока
    const created = await api.post<any>('/code-blocks', blockData);
    return convertCodeBlockFromApi(created);
  }
}

export async function deleteCodeBlock(id: string): Promise<void> {
  await api.delete(`/code-blocks/${id}`);
}

// Screenshots
export async function getScreenshotsByActionId(actionId: string): Promise<ActionScreenshot[]> {
  const screenshots = await api.get<any[]>(`/screenshots?actionId=${actionId}`);
  return screenshots.map(convertScreenshotFromApi);
}

export async function saveScreenshot(screenshot: ActionScreenshot): Promise<ActionScreenshot> {
  const screenshotData = {
    actionId: screenshot.actionId,
    dataUrl: screenshot.dataUrl,
    orderIndex: screenshot.orderIndex
  };

  if (screenshot.id && screenshot.id.startsWith('screenshot-') && screenshot.id.length > 20) {
    try {
      const updated = await api.put<any>(`/screenshots/${screenshot.id}`, screenshotData);
      return convertScreenshotFromApi(updated);
    } catch (error: any) {
      // Если скриншот не найден, создаем новый
      if (error.message?.includes('не найден') || error.message?.includes('404') || error.message?.includes('Not found')) {
        const created = await api.post<any>('/screenshots', screenshotData);
        return convertScreenshotFromApi(created);
      }
      throw error;
    }
  } else {
    // Создание нового скриншота
    const created = await api.post<any>('/screenshots', screenshotData);
    return convertScreenshotFromApi(created);
  }
}

export async function deleteScreenshot(id: string): Promise<void> {
  await api.delete(`/screenshots/${id}`);
}
