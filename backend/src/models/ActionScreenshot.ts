export interface ActionScreenshot {
  id: string;
  actionId: string;
  dataUrl: string;
  orderIndex: number;
}

export interface CreateActionScreenshotInput {
  actionId: string;
  dataUrl: string;
  orderIndex?: number;
}

export interface UpdateActionScreenshotInput {
  dataUrl?: string;
  orderIndex?: number;
}






