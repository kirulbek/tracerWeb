import { Task, Action, ActionTemplate, ActionCodeBlock, ActionScreenshot, Manager, TaskStatus } from '../types';

const STORAGE_KEYS = {
  TASKS: 'tracer_tasks',
  ACTIONS: 'tracer_actions',
  TEMPLATES: 'tracer_templates',
  CODE_BLOCKS: 'tracer_code_blocks',
  SCREENSHOTS: 'tracer_screenshots',
  MANAGERS: 'tracer_managers',
  TASK_MANAGERS: 'tracer_task_managers'
};

function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка сохранения в LocalStorage:', error);
  }
}

// Tasks
export function getTasksFallback(): Task[] {
  const tasks = getFromStorage<Task>(STORAGE_KEYS.TASKS);
  return tasks.map(task => ({
    ...task,
    createdAt: new Date(task.createdAt),
    status: (task.status || 'Ожидание') as TaskStatus
  }));
}

export function saveTaskFallback(task: Task): void {
  const tasks = getTasksFallback();
  const index = tasks.findIndex(t => t.id === task.id);
  if (index >= 0) {
    tasks[index] = task;
  } else {
    tasks.push(task);
  }
  saveToStorage(STORAGE_KEYS.TASKS, tasks);
}

export function deleteTaskFallback(id: string): void {
  const tasks = getTasksFallback();
  const filtered = tasks.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.TASKS, filtered);
  
  // Удаляем связанные действия
  const actions = getActionsFallback();
  const filteredActions = actions.filter(a => a.taskId !== id);
  saveToStorage(STORAGE_KEYS.ACTIONS, filteredActions);
}

// Managers
export function getManagersFallback(): Manager[] {
  const managers = getFromStorage<Manager>(STORAGE_KEYS.MANAGERS);
  return managers.map(manager => ({
    ...manager,
    createdAt: new Date(manager.createdAt)
  }));
}

export function saveManagerFallback(manager: Manager): void {
  const managers = getManagersFallback();
  const index = managers.findIndex(m => m.id === manager.id);
  if (index >= 0) {
    managers[index] = manager;
  } else {
    managers.push(manager);
  }
  saveToStorage(STORAGE_KEYS.MANAGERS, managers);
}

export function deleteManagerFallback(id: string): void {
  const managers = getManagersFallback();
  const filtered = managers.filter(m => m.id !== id);
  saveToStorage(STORAGE_KEYS.MANAGERS, filtered);
  
  // Удаляем связи с задачами
  const taskManagers = getFromStorage<{ taskId: string; managerId: string }>(STORAGE_KEYS.TASK_MANAGERS);
  const filteredTaskManagers = taskManagers.filter(tm => tm.managerId !== id);
  saveToStorage(STORAGE_KEYS.TASK_MANAGERS, filteredTaskManagers);
}

export function getManagersByTaskIdFallback(taskId: string): Manager[] {
  const taskManagers = getFromStorage<{ taskId: string; managerId: string }>(STORAGE_KEYS.TASK_MANAGERS);
  const managerIds = taskManagers.filter(tm => tm.taskId === taskId).map(tm => tm.managerId);
  const managers = getManagersFallback();
  return managers.filter(m => managerIds.includes(m.id));
}

export function setTaskManagersFallback(taskId: string, managerIds: string[]): void {
  const taskManagers = getFromStorage<{ taskId: string; managerId: string }>(STORAGE_KEYS.TASK_MANAGERS);
  const filtered = taskManagers.filter(tm => tm.taskId !== taskId);
  const newTaskManagers = managerIds.map(managerId => ({ taskId, managerId }));
  saveToStorage(STORAGE_KEYS.TASK_MANAGERS, [...filtered, ...newTaskManagers]);
}

// Actions
export function getActionsFallback(): Action[] {
  const actions = getFromStorage<Action>(STORAGE_KEYS.ACTIONS);
  return actions.map(action => ({
    ...action,
    createdAt: new Date(action.createdAt),
    shortDescription: action.shortDescription,
    excludeFromDescription: action.excludeFromDescription || false
  }));
}

export function getActionsByTaskIdFallback(taskId: string): Action[] {
  return getActionsFallback().filter(a => a.taskId === taskId);
}

export function saveActionFallback(action: Action): void {
  const actions = getActionsFallback();
  const index = actions.findIndex(a => a.id === action.id);
  if (index >= 0) {
    actions[index] = action;
  } else {
    actions.push(action);
  }
  saveToStorage(STORAGE_KEYS.ACTIONS, actions);
}

export function deleteActionFallback(id: string): void {
  const actions = getActionsFallback();
  const filtered = actions.filter(a => a.id !== id);
  saveToStorage(STORAGE_KEYS.ACTIONS, filtered);
  
  // Удаляем связанные блоки кода и скриншоты
  const codeBlocks = getCodeBlocksByActionIdFallback(id);
  codeBlocks.forEach(cb => deleteCodeBlockFallback(cb.id));
  const screenshots = getScreenshotsByActionIdFallback(id);
  screenshots.forEach(s => deleteScreenshotFallback(s.id));
}

// Templates
export function getTemplatesFallback(): ActionTemplate[] {
  const templates = getFromStorage<ActionTemplate>(STORAGE_KEYS.TEMPLATES);
  return templates.map(template => ({
    ...template,
    createdAt: new Date(template.createdAt),
    category: template.category
  }));
}

export function saveTemplateFallback(template: ActionTemplate): void {
  const templates = getTemplatesFallback();
  const index = templates.findIndex(t => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
}

export function deleteTemplateFallback(id: string): void {
  const templates = getTemplatesFallback();
  const filtered = templates.filter(t => t.id !== id);
  saveToStorage(STORAGE_KEYS.TEMPLATES, filtered);
}

export function incrementTemplateUsageFallback(id: string): void {
  const templates = getTemplatesFallback();
  const template = templates.find(t => t.id === id);
  if (template) {
    template.usageCount = (template.usageCount || 0) + 1;
    saveToStorage(STORAGE_KEYS.TEMPLATES, templates);
  }
}

// Code Blocks
export function getCodeBlocksByActionIdFallback(actionId: string): ActionCodeBlock[] {
  const codeBlocks = getFromStorage<ActionCodeBlock>(STORAGE_KEYS.CODE_BLOCKS);
  return codeBlocks.filter(cb => cb.actionId === actionId);
}

export function saveCodeBlockFallback(codeBlock: ActionCodeBlock): void {
  const codeBlocks = getFromStorage<ActionCodeBlock>(STORAGE_KEYS.CODE_BLOCKS);
  const index = codeBlocks.findIndex(cb => cb.id === codeBlock.id);
  if (index >= 0) {
    codeBlocks[index] = codeBlock;
  } else {
    codeBlocks.push(codeBlock);
  }
  saveToStorage(STORAGE_KEYS.CODE_BLOCKS, codeBlocks);
}

export function deleteCodeBlockFallback(id: string): void {
  const codeBlocks = getFromStorage<ActionCodeBlock>(STORAGE_KEYS.CODE_BLOCKS);
  const filtered = codeBlocks.filter(cb => cb.id !== id);
  saveToStorage(STORAGE_KEYS.CODE_BLOCKS, filtered);
}

// Screenshots
export function getScreenshotsByActionIdFallback(actionId: string): ActionScreenshot[] {
  const screenshots = getFromStorage<ActionScreenshot>(STORAGE_KEYS.SCREENSHOTS);
  return screenshots.filter(s => s.actionId === actionId);
}

export function saveScreenshotFallback(screenshot: ActionScreenshot): void {
  const screenshots = getFromStorage<ActionScreenshot>(STORAGE_KEYS.SCREENSHOTS);
  const index = screenshots.findIndex(s => s.id === screenshot.id);
  if (index >= 0) {
    screenshots[index] = screenshot;
  } else {
    screenshots.push(screenshot);
  }
  saveToStorage(STORAGE_KEYS.SCREENSHOTS, screenshots);
}

export function deleteScreenshotFallback(id: string): void {
  const screenshots = getFromStorage<ActionScreenshot>(STORAGE_KEYS.SCREENSHOTS);
  const filtered = screenshots.filter(s => s.id !== id);
  saveToStorage(STORAGE_KEYS.SCREENSHOTS, filtered);
}

