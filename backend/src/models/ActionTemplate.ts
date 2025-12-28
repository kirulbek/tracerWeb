export interface ActionTemplate {
  id: string;
  name: string;
  text: string;
  category?: string;
  usageCount: number;
  userId: string;
  createdAt: string;
}

export interface CreateActionTemplateInput {
  name: string;
  text: string;
  category?: string;
}

export interface UpdateActionTemplateInput {
  name?: string;
  text?: string;
  category?: string;
}






