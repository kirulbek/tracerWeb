export type TaskStatus = 'Ожидание' | 'В Работе' | 'Завершен' | 'Сдано' | 'Архив';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  notes?: string;
  blockStartMarker?: string;  // Маркер начала блока (например: "АрсанСофт")
  blockEndMarker?: string;    // Маркер конца блока (например: "АрсанСофт")
  createdAt: Date;
}

export interface Manager {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Action {
  id: string;
  taskId: string;
  name?: string;  // Название действия (опционально)
  description: string;  // HTML форматированный текст
  shortDescription?: string;  // Короткое описание для компактного отчета
  excludeFromDescription?: boolean;  // Не включать в отчет "Описание для переноса"
  timeHours: number;
  timeMinutes: number;
  orderIndex: number;
  createdAt: Date;
}

export interface ActionTemplate {
  id: string;
  name: string;
  text: string;
  category?: string;  // Папка/категория для иерархии
  usageCount: number;
  createdAt: Date;
}

export interface ActionCodeBlock {
  id: string;
  actionId: string;
  language: string;
  codeText: string;
  collapsible?: boolean;  // Свернуть по умолчанию в отчете
  orderIndex: number;
}

export interface ActionScreenshot {
  id: string;
  actionId: string;
  dataUrl: string;
  orderIndex: number;
}

