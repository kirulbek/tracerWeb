export interface ActionCodeBlock {
  id: string;
  actionId: string;
  language: string;
  codeText: string;
  collapsible: boolean;
  orderIndex: number;
}

export interface CreateActionCodeBlockInput {
  actionId: string;
  language: string;
  codeText: string;
  collapsible?: boolean;
  orderIndex?: number;
}

export interface UpdateActionCodeBlockInput {
  language?: string;
  codeText?: string;
  collapsible?: boolean;
  orderIndex?: number;
}






