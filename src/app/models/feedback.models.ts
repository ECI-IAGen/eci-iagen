// Interfaces para el componente de Feedback

export interface Feedback {
  id: number;
  submissionId: number;
  feedbackType: string;
  content: string;
  feedbackDate: string | Date | number[];
  strengths: string;
  improvements: string;
  
  // Campos enriquecidos para la vista
  submissionUrl?: string;
  assignmentTitle?: string;
  teamName?: string;
  studentName?: string;
}

export interface FeedbackFormData {
  submissionId: number;
  feedbackType: string;
  content: string;
  strengths: string;
  improvements: string;
}

export interface FilterOptions {
  assignment: string;
  team: string;
  feedbackType: string;
  dateFrom: string;
  dateTo: string;
}

export const FEEDBACK_TYPES = {
  GENERAL: 'GENERAL',
  TECHNICAL: 'TECHNICAL',
  IMPROVEMENT: 'IMPROVEMENT',
  STRENGTH: 'STRENGTH',
  SUGGESTION: 'SUGGESTION'
} as const;

export type FeedbackType = keyof typeof FEEDBACK_TYPES;
