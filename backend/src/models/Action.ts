export interface Action {
  id: string;
  taskId: string;
  name?: string;
  description: string;
  shortDescription?: string;
  excludeFromDescription: boolean;
  timeHours: number;
  timeMinutes: number;
  orderIndex: number;
  createdAt: string;
}

export interface CreateActionInput {
  taskId: string;
  name?: string;
  description: string;
  shortDescription?: string;
  excludeFromDescription?: boolean;
  timeHours?: number;
  timeMinutes?: number;
  orderIndex?: number;
  createdAt?: string; // Время клиента в ISO формате
}

export interface UpdateActionInput {
  name?: string;
  description?: string;
  shortDescription?: string;
  excludeFromDescription?: boolean;
  timeHours?: number;
  timeMinutes?: number;
  orderIndex?: number;
}






