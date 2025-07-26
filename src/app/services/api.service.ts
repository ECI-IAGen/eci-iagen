import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  // Método genérico para manejar errores
  private handleError(error: any): Observable<never> {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del servidor
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.statusText}`;
      }
    }
    
    // Truncar mensaje si es muy largo
    if (errorMessage.length > 300) {
      errorMessage = errorMessage.substring(0, 300) + '...';
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // =================== USUARIOS ===================
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`)
      .pipe(catchError(this.handleError));
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, user, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, user, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`)
      .pipe(catchError(this.handleError));
  }

  getUserByEmail(email: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/email/${email}`)
      .pipe(catchError(this.handleError));
  }

  getUsersByRoleId(roleId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/role/${roleId}`)
      .pipe(catchError(this.handleError));
  }

  getUsersByNameContaining(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users/search?name=${name}`)
      .pipe(catchError(this.handleError));
  }

  // =================== ROLES ===================
  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/roles`)
      .pipe(catchError(this.handleError));
  }

  getRoleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles/${id}`)
      .pipe(catchError(this.handleError));
  }

  getRoleByName(name: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles/name/${name}`)
      .pipe(catchError(this.handleError));
  }

  createRole(role: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/roles`, role, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateRole(id: number, role: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/roles/${id}`, role, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteRole(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/roles/${id}`)
      .pipe(catchError(this.handleError));
  }

  // =================== EQUIPOS ===================
  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/teams`)
      .pipe(catchError(this.handleError));
  }

  getTeamById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/teams/${id}`)
      .pipe(catchError(this.handleError));
  }

  createTeam(team: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/teams`, team, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateTeam(id: number, team: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/teams/${id}`, team, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteTeam(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/teams/${id}`)
      .pipe(catchError(this.handleError));
  }

  getTeamByName(name: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/teams/name/${name}`)
      .pipe(catchError(this.handleError));
  }

  getTeamsByUserId(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/teams/user/${userId}`)
      .pipe(catchError(this.handleError));
  }

  getTeamsByNameContaining(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/teams/search?name=${name}`)
      .pipe(catchError(this.handleError));
  }

  addUserToTeam(teamId: number, userId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/teams/${teamId}/users/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  removeUserFromTeam(teamId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/teams/${teamId}/users/${userId}`)
      .pipe(catchError(this.handleError));
  }

  updateTeamUsers(teamId: number, userIds: number[]): Observable<any> {
    return this.http.put(`${this.baseUrl}/teams/${teamId}/users`, userIds, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  // =================== CLASES ===================
  getClasses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classes`)
      .pipe(catchError(this.handleError));
  }

  getClassById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/classes/${id}`)
      .pipe(catchError(this.handleError));
  }

  createClass(classData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/classes`, classData, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateClass(id: number, classData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/classes/${id}`, classData, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteClass(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/classes/${id}`)
      .pipe(catchError(this.handleError));
  }

  addTeamToClass(classId: number, teamId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/classes/${classId}/teams/${teamId}`, {})
      .pipe(catchError(this.handleError));
  }

  removeTeamFromClass(classId: number, teamId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/classes/${classId}/teams/${teamId}`)
      .pipe(catchError(this.handleError));
  }

  getClassTeams(classId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classes/${classId}/teams`)
      .pipe(catchError(this.handleError));
  }

  getClassesByProfessor(professorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classes/professor/${professorId}`)
      .pipe(catchError(this.handleError));
  }

  getClassesByTeam(teamId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/classes/team/${teamId}`)
      .pipe(catchError(this.handleError));
  }

  // =================== ASIGNACIONES ===================
  getAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/assignments`)
      .pipe(catchError(this.handleError));
  }

  getAssignmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/assignments/${id}`)
      .pipe(catchError(this.handleError));
  }

  createAssignment(assignment: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/assignments`, assignment, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateAssignment(id: number, assignment: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/assignments/${id}`, assignment, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteAssignment(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/assignments/${id}`)
      .pipe(catchError(this.handleError));
  }

  // =================== ENTREGAS ===================
  getSubmissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/submissions`)
      .pipe(catchError(this.handleError));
  }

  getSubmissionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/submissions/${id}`)
      .pipe(catchError(this.handleError));
  }

  createSubmission(submission: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/submissions`, submission, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateSubmission(id: number, submission: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/submissions/${id}`, submission, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteSubmission(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/submissions/${id}`)
      .pipe(catchError(this.handleError));
  }

  // =================== EVALUACIONES ===================
  getEvaluations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/evaluations`)
      .pipe(catchError(this.handleError));
  }

  getEvaluationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/evaluations/${id}`)
      .pipe(catchError(this.handleError));
  }

  createEvaluation(evaluation: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/evaluations`, evaluation, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateEvaluation(id: number, evaluation: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/evaluations/${id}`, evaluation, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteEvaluation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/evaluations/${id}`)
      .pipe(catchError(this.handleError));
  }

  // =================== RETROALIMENTACIÓN ===================
  getFeedbacks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/feedbacks`)
      .pipe(catchError(this.handleError));
  }

  getFeedbackById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/feedbacks/${id}`)
      .pipe(catchError(this.handleError));
  }

  createFeedback(feedback: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/feedbacks`, feedback, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  updateFeedback(id: number, feedback: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/feedbacks/${id}`, feedback, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  deleteFeedback(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/feedbacks/${id}`)
      .pipe(catchError(this.handleError));
  }

  // =================== IMPORTACIÓN EXCEL ===================
  importExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<any>(`${this.baseUrl}/excel/import`, formData)
      .pipe(catchError(this.handleError));
  }

  getExcelFormatInfo(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/excel/format-info`)
      .pipe(catchError(this.handleError));
  }
}
