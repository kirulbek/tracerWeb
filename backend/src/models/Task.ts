export type TaskStatus = 'Ожидание' | 'В Работе' | 'Завершен' | 'Сдано' | 'Архив';

export interface Task {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  notes?: string;
  blockStartMarker?: string;  // Маркер начала блока (например: "АрсанСофт")
  blockEndMarker?: string;    // Маркер конца блока (например: "АрсанСофт")
  userId: string;
  createdAt: string;
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  status?: TaskStatus;
  notes?: string;
  blockStartMarker?: string;
  blockEndMarker?: string;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  notes?: string;
  blockStartMarker?: string;
  blockEndMarker?: string;
}






