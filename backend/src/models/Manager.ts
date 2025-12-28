export interface Manager {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface CreateManagerInput {
  name: string;
}

export interface UpdateManagerInput {
  name?: string;
}






