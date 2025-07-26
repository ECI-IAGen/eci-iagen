// Evaluation Models - TypeScript interfaces for evaluation domain objects

export interface Evaluation {
  id: number;
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: 'MANUAL' | 'AUTOMATIC';
  criteria?: string;
  criteriaJson?: any;
  feedback?: string;
  evaluationDate: Date | number[] | string;
  createdAt?: Date | number[] | string;
  updatedAt?: Date | number[] | string;

  // Additional fields that may come from backend joins
  className?: string;
  classId?: number;
  assignmentTitle?: string;
  teamName?: string;
  evaluatorName?: string;

  // Related entity information
  submission?: EvaluationSubmission;
  evaluator?: EvaluationUser;
}

export interface EvaluationSubmission {
  id: number;
  assignmentId: number;
  teamId: number;
  submissionDate: Date | number[] | string;
  submissionPath?: string;
  
  // Additional fields that may come from backend joins
  className?: string;
  assignmentTitle?: string;
  teamName?: string;
  
  // Related entity information
  assignment?: EvaluationAssignment;
  team?: EvaluationTeam;
}

export interface EvaluationAssignment {
  id: number;
  title: string;
  description?: string;
  classId: number;
  dueDate: Date | number[] | string;
  
  // Related entity information
  class?: EvaluationClass;
}

export interface EvaluationClass {
  id: number;
  name: string;
  code?: string;
  description?: string;
  semester?: string;
  year?: number;
}

export interface EvaluationTeam {
  id: number;
  name: string;
  classId: number;
  
  // Related entity information
  class?: EvaluationClass;
  members?: EvaluationUser[];
}

export interface EvaluationUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
}

export interface EvaluationFilters {
  class: string;
  assignment: string;
  team: string;
  evaluator: string;
  type: string;
  score: string;
  dateFrom: string;
  dateTo: string;
}

export interface NewEvaluation {
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: 'MANUAL' | 'AUTOMATIC';
  criteria?: string;
  feedback?: string;
}

export interface UpdateEvaluation {
  id: number;
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: 'MANUAL' | 'AUTOMATIC';
  criteria?: string;
  feedback?: string;
}

export interface EvaluationApiResponse {
  evaluations: Evaluation[];
  total: number;
  page?: number;
  limit?: number;
}

export interface EvaluationOption {
  value: string;
  label: string;
}

export interface EvaluationStats {
  totalEvaluations: number;
  averageScore: number;
  manualEvaluations: number;
  automaticEvaluations: number;
  evaluationsByClass: { [className: string]: number };
  evaluationsByType: { [type: string]: number };
}

// Helper type for CSV export
export interface EvaluationCSVData {
  'ID': string;
  'Entrega': string;
  'Clase': string;
  'Asignación': string;
  'Equipo': string;
  'Evaluador': string;
  'Puntuación': string;
  'Tipo': string;
  'Fecha Evaluación': string;
  'Retroalimentación': string;
  'Criterios': string;
}

// Helper type for criteria data
export interface CriteriaData {
  [key: string]: any;
}

// Helper type for commit information
export interface CommitInfo {
  hash: string;
  sha: string;
  message: string;
  date: string;
  onTime: boolean;
}