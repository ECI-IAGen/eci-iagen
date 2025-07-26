// Interfaces para el componente de Entregas (Submissions)

export interface Submission {
  id: number;
  assignmentId: number;
  teamId: number;
  fileUrl: string;
  submittedAt: string | number[]; // Permitir tanto string como array
  assignmentTitle?: string;
  teamName?: string;
  gitHubUrl?: string;
  classId?: number;
  className?: string;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  classId?: number;
}

export interface Team {
  id: number;
  name: string;
  description?: string;
  classId?: number;
  members?: any[];
}

export interface SubmissionFormData {
  assignmentId: number;
  teamId: number;
  fileUrl: string;
  submittedAt?: string;
}

export interface SubmissionResponse {
  id: number;
  assignmentId: number;
  teamId: number;
  fileUrl: string;
  submittedAt: string;
  assignment?: Assignment;
  team?: Team;
}
