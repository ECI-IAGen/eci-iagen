// Interfaces para el componente de Evaluaciones

export interface Evaluation {
  id: number;
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: string;
  criteria?: string;
  criteriaJson?: string;
  evaluationDate?: string | Date | number[];
  evaluatorName?: string;
  submissionUrl?: string;
  assignmentTitle?: string;
  teamName?: string;
  className?: string;
}

export interface User {
  id: number;
  name: string;
  email?: string;
  roleId?: number;
  roleName?: string;
}

export interface Class {
  id: number;
  name: string;
  description?: string;
  professorId?: number;
  teams?: any[];
}

export interface AutoEvaluationOptions {
  usingIA: boolean;
}

export interface FilterOptions {
  class: string;
  assignment: string;
  team: string;
  evaluator: string;
  type: string;
  score: string;
  dateFrom: string;
  dateTo: string;
}

export interface EvaluationFormData {
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: string;
  criteria?: string;
}

export interface AutoEvaluationResult {
  id: number;
  submissionId: number;
  evaluatorId: number;
  score: number;
  evaluationType: string;
  criteriaJson: string;
  evaluationDate: string;
  commits?: CommitInfo[];
  finalScore?: number;
  lateDays?: number;
  totalPenalty?: number;
  isLate?: boolean;
  evaluationMethod?: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  onTime: boolean;
}

export interface CriteriaData {
  [key: string]: any; // Generic interface to support any JSON structure
}

