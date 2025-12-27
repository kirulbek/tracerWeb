export type TaskStatus = 'Ожидание' | 'В Работе' | 'Завершен' | 'Сдано' | 'Архив';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  notes?: string;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  notes?: string;
}





