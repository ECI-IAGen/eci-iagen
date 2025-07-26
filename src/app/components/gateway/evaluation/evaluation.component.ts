import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { 
  Evaluation, 
  EvaluationFilters, 
  NewEvaluation,
  UpdateEvaluation,
  EvaluationSubmission,
  EvaluationUser,
  EvaluationClass,
  EvaluationTeam,
  EvaluationAssignment,
  EvaluationCSVData,
  CriteriaData,
  CommitInfo
} from '../../../models/evaluation.models';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluation.component.html',
  styleUrl: './evaluation.component.css'
})
export class EvaluationComponent implements OnInit {
  
  // Datos principales
  evaluations: Evaluation[] = [];
  filteredEvaluations: Evaluation[] = [];
  
  // Datos auxiliares para filtros y formularios
  submissions: EvaluationSubmission[] = [];
  evaluators: EvaluationUser[] = [];
  classes: EvaluationClass[] = [];
  
  // Opciones extraídas para filtros
  classOptions: string[] = [];
  assignmentOptions: string[] = [];
  teamOptions: string[] = [];
  evaluatorOptions: string[] = [];
  
  // Estados de UI
  loading = true;
  submitting = false;
  showCreateEvaluationModal = false;
  showViewEvaluationModal = false;
  showEditEvaluationModal = false;
  
  // Evaluación seleccionada para ver/editar
  selectedEvaluation: Evaluation | null = null;
  
  // Formularios
  newEvaluation: NewEvaluation = {
    submissionId: 0,
    evaluatorId: 0,
    score: 0,
    evaluationType: 'MANUAL',
    criteria: '',
    feedback: ''
  };
  
  editingEvaluation: UpdateEvaluation = {
    id: 0,
    submissionId: 0,
    evaluatorId: 0,
    score: 0,
    evaluationType: 'MANUAL',
    criteria: '',
    feedback: ''
  };
  
  // Estado de filtros
  filters: EvaluationFilters = {
    class: '',
    assignment: '',
    team: '',
    evaluator: '',
    type: '',
    score: '',
    dateFrom: '',
    dateTo: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.loading = true;
      
      // Cargar datos en paralelo
      await Promise.all([
        this.loadEvaluations(),
        this.loadSubmissions(),
        this.loadEvaluators(),
        this.loadClasses()
      ]);
      
      // Extraer opciones de filtros una vez que tenemos los datos
      this.extractFilterOptions();
      
      // Aplicar filtros iniciales
      this.applyFilters();
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.showNotification('Error al cargar datos', 'error');
    } finally {
      this.loading = false;
    }
  }

  loadEvaluations(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getEvaluations().subscribe({
        next: (data) => {
          this.evaluations = data;
          console.log('Evaluaciones cargadas:', data.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading evaluations:', error);
          reject(error);
        }
      });
    });
  }

  loadSubmissions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getSubmissions().subscribe({
        next: (data) => {
          this.submissions = data;
          console.log('Entregas cargadas:', data.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading submissions:', error);
          resolve(); // No es crítico, continuar
        }
      });
    });
  }

  loadEvaluators(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getUsers().subscribe({
        next: (data) => {
          this.evaluators = data.filter(user => 
            user.role && ['TEACHER', 'ADMIN'].includes(user.role)
          );
          console.log('Evaluadores cargados:', this.evaluators.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading evaluators:', error);
          resolve(); // No es crítico, continuar
        }
      });
    });
  }

  loadClasses(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getClasses().subscribe({
        next: (data) => {
          this.classes = data;
          console.log('Clases cargadas:', data.length);
          resolve();
        },
        error: (error) => {
          console.error('Error loading classes:', error);
          resolve(); // No es crítico, continuar
        }
      });
    });
  }

  extractFilterOptions() {
    console.log('Extrayendo opciones de filtros...');
    
    const classesSet = new Set<string>();
    const assignmentsSet = new Set<string>();
    const teamsSet = new Set<string>();
    const evaluatorsSet = new Set<string>();
    
    this.evaluations.forEach(evaluation => {
      // Extraer clases
      const className = this.getClassName(evaluation);
      if (className && className !== 'Sin clase') {
        classesSet.add(className);
      }
      
      // Extraer asignaciones
      const assignmentTitle = this.getAssignmentTitle(evaluation);
      if (assignmentTitle && assignmentTitle !== 'Sin asignación') {
        assignmentsSet.add(assignmentTitle);
      }
      
      // Extraer equipos
      const teamName = this.getTeamName(evaluation);
      if (teamName && teamName !== 'Sin equipo') {
        teamsSet.add(teamName);
      }
      
      // Extraer evaluadores
      const evaluatorName = this.getEvaluatorName(evaluation);
      if (evaluatorName && evaluatorName !== 'Sin evaluador') {
        evaluatorsSet.add(evaluatorName);
      }
    });
    
    this.classOptions = Array.from(classesSet).sort();
    this.assignmentOptions = Array.from(assignmentsSet).sort();
    this.teamOptions = Array.from(teamsSet).sort();
    this.evaluatorOptions = Array.from(evaluatorsSet).sort();
    
    console.log('Opciones extraídas:', {
      classes: this.classOptions.length,
      assignments: this.assignmentOptions.length,
      teams: this.teamOptions.length,
      evaluators: this.evaluatorOptions.length
    });
  }

  // Métodos para obtener información de evaluaciones
  getClassName(evaluation: Evaluation): string {
    // Prioridad 1: Usar directamente className (nuevo formato del backend)
    if (evaluation.className) {
      return evaluation.className;
    }
    
    // Prioridad 2: Usar classId para buscar en datos cargados
    if (evaluation.classId && this.classes.length > 0) {
      const classObj = this.classes.find(c => c.id === evaluation.classId);
      if (classObj) {
        return classObj.name;
      }
    }
    
    // Prioridad 3: Verificar submission object (formato anterior)
    if (evaluation.submission) {
      if (evaluation.submission.className) {
        return evaluation.submission.className;
      }
    }
    
    return 'Sin clase';
  }

  getAssignmentTitle(evaluation: Evaluation): string {
    // Prioridad 1: Usar directamente assignmentTitle (nuevo formato del backend)
    if (evaluation.assignmentTitle) {
      return evaluation.assignmentTitle;
    }
    
    // Prioridad 2: Verificar submission object (formato anterior)
    if (evaluation.submission && evaluation.submission.assignment) {
      return evaluation.submission.assignment.title;
    }
    
    // Prioridad 3: Buscar en submissions cargadas
    const submission = this.submissions.find(s => s.id === evaluation.submissionId);
    if (submission) {
      return submission.assignmentTitle || 'Sin asignación';
    }
    
    return 'Sin asignación';
  }

  getTeamName(evaluation: Evaluation): string {
    // Prioridad 1: Usar directamente teamName (nuevo formato del backend)
    if (evaluation.teamName) {
      return evaluation.teamName;
    }
    
    // Prioridad 2: Verificar submission object (formato anterior)
    if (evaluation.submission && evaluation.submission.team) {
      return evaluation.submission.team.name;
    }
    
    // Prioridad 3: Buscar en submissions cargadas
    const submission = this.submissions.find(s => s.id === evaluation.submissionId);
    if (submission) {
      return submission.teamName || 'Sin equipo';
    }
    
    return 'Sin equipo';
  }

  getEvaluatorName(evaluation: Evaluation): string {
    // Prioridad 1: Usar directamente evaluatorName (nuevo formato del backend)
    if (evaluation.evaluatorName) {
      return evaluation.evaluatorName;
    }
    
    // Prioridad 2: Buscar en evaluadores cargados
    const evaluator = this.evaluators.find(e => e.id === evaluation.evaluatorId);
    if (evaluator) {
      return `${evaluator.firstName} ${evaluator.lastName}`;
    }
    
    return 'Sin evaluador';
  }

  getSubmissionInfo(evaluation: Evaluation): string {
    const assignmentTitle = this.getAssignmentTitle(evaluation);
    const teamName = this.getTeamName(evaluation);
    return `${assignmentTitle} - ${teamName}`;
  }

  // Métodos de filtros
  applyFilters() {
    this.filteredEvaluations = this.evaluations.filter(evaluation => {
      // Filtro por clase
      if (this.filters.class && this.getClassName(evaluation) !== this.filters.class) {
        return false;
      }
      
      // Filtro por asignación
      if (this.filters.assignment && this.getAssignmentTitle(evaluation) !== this.filters.assignment) {
        return false;
      }
      
      // Filtro por equipo
      if (this.filters.team && this.getTeamName(evaluation) !== this.filters.team) {
        return false;
      }
      
      // Filtro por evaluador
      if (this.filters.evaluator && this.getEvaluatorName(evaluation) !== this.filters.evaluator) {
        return false;
      }
      
      // Filtro por tipo
      if (this.filters.type && evaluation.evaluationType !== this.filters.type) {
        return false;
      }
      
      // Filtro por puntuación
      if (this.filters.score) {
        const score = evaluation.score;
        switch (this.filters.score) {
          case '5':
            if (score !== 5) return false;
            break;
          case '4-5':
            if (score < 4) return false;
            break;
          case '3-4':
            if (score < 3 || score >= 4) return false;
            break;
          case '2-3':
            if (score < 2 || score >= 3) return false;
            break;
          case '0-2':
            if (score >= 2) return false;
            break;
        }
      }
      
      // Filtro por fecha
      if (this.filters.dateFrom || this.filters.dateTo) {
        const evalDate = this.getEvaluationDate(evaluation);
        const parsedDate = this.parseDate(evalDate);
        
        if (parsedDate) {
          if (this.filters.dateFrom) {
            const fromDate = new Date(this.filters.dateFrom);
            if (parsedDate < fromDate) return false;
          }
          if (this.filters.dateTo) {
            const toDate = new Date(this.filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (parsedDate > toDate) return false;
          }
        }
      }
      
      return true;
    });

    console.log(`Filtros aplicados: ${this.filteredEvaluations.length} de ${this.evaluations.length} evaluaciones`);
  }

  clearAllFilters() {
    this.filters = {
      class: '',
      assignment: '',
      team: '',
      evaluator: '',
      type: '',
      score: '',
      dateFrom: '',
      dateTo: ''
    };
    this.applyFilters();
  }

  getFilterStatusText(): string {
    const totalFilters = Object.values(this.filters).filter(f => f && (f as string).trim() !== '').length;
    if (totalFilters === 0) {
      return 'Sin filtros aplicados';
    }
    return `${totalFilters} filtro${totalFilters > 1 ? 's' : ''} aplicado${totalFilters > 1 ? 's' : ''}`;
  }

  // Métodos de formateo
  getEvaluationDate(evaluation: Evaluation): string | number[] | Date {
    return evaluation.evaluationDate || evaluation.createdAt || '';
  }

  parseDate(dateInput: string | number[] | Date): Date | null {
    if (!dateInput) return null;
    
    try {
      // Si ya es un Date, devolverlo
      if (dateInput instanceof Date) {
        return dateInput;
      }
      
      // Si es un array (formato del backend)
      if (Array.isArray(dateInput) && dateInput.length >= 6) {
        return new Date(
          dateInput[0], // año
          dateInput[1] - 1, // mes (restar 1)
          dateInput[2], // día
          dateInput[3], // hora
          dateInput[4], // minuto
          dateInput[5] // segundo
        );
      } else if (typeof dateInput === 'string') {
        // Si es una cadena ISO normal
        return new Date(dateInput);
      }
    } catch (error) {
      console.error('Error parsing date:', error);
    }
    
    return null;
  }

  formatDate(dateInput: string | number[] | Date): string {
    if (!dateInput) return 'N/A';
    
    const date = this.parseDate(dateInput);
    if (!date || isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatEvaluationDate(evaluation: Evaluation): string {
    const date = this.getEvaluationDate(evaluation);
    return this.formatDate(date);
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 4.5) return 'bg-success';
    if (score >= 3.5) return 'bg-info';
    if (score >= 2.5) return 'bg-warning';
    return 'bg-danger';
  }
  
  getTypeBadgeClass(type: string): string {
    return type === 'AUTOMATIC' ? 'bg-success' : 'bg-primary';
  }

  // Gestión de modales
  showCreateModal() {
    this.newEvaluation = {
      submissionId: 0,
      evaluatorId: 0,
      score: 0,
      evaluationType: 'MANUAL',
      criteria: '',
      feedback: ''
    };
    this.showCreateEvaluationModal = true;
  }

  closeCreateModal() {
    this.showCreateEvaluationModal = false;
  }

  viewEvaluation(id: number) {
    this.selectedEvaluation = this.evaluations.find(e => e.id === id) || null;
    if (this.selectedEvaluation) {
      this.showViewEvaluationModal = true;
    }
  }

  closeViewModal() {
    this.showViewEvaluationModal = false;
    this.selectedEvaluation = null;
  }

  editEvaluation(id: number) {
    this.selectedEvaluation = this.evaluations.find(e => e.id === id) || null;
    if (this.selectedEvaluation) {
      this.editingEvaluation = {
        id: this.selectedEvaluation.id,
        submissionId: this.selectedEvaluation.submissionId,
        evaluatorId: this.selectedEvaluation.evaluatorId,
        score: this.selectedEvaluation.score,
        evaluationType: this.selectedEvaluation.evaluationType,
        criteria: this.getCriteriaString(this.selectedEvaluation),
        feedback: this.selectedEvaluation.feedback || ''
      };
      this.showEditEvaluationModal = true;
    }
  }

  closeEditModal() {
    this.showEditEvaluationModal = false;
    this.selectedEvaluation = null;
  }

  closeAllModals() {
    this.closeCreateModal();
    this.closeViewModal();
    this.closeEditModal();
  }

  // CRUD Operations
  createEvaluation() {
    if (this.submitting) return;
    
    this.submitting = true;
    
    const evaluationData = {
      submissionId: this.newEvaluation.submissionId,
      evaluatorId: this.newEvaluation.evaluatorId,
      score: this.newEvaluation.score,
      evaluationType: this.newEvaluation.evaluationType,
      criteria: this.newEvaluation.criteria || null,
      feedback: this.newEvaluation.feedback || null
    };
    
    this.apiService.createEvaluation(evaluationData).subscribe({
      next: () => {
        this.showNotification('Evaluación creada exitosamente');
        this.closeCreateModal();
        this.loadData();
        this.submitting = false;
      },
      error: (error) => {
        this.showNotification('Error al crear evaluación: ' + error.message, 'error');
        this.submitting = false;
      }
    });
  }

  updateEvaluation() {
    if (this.submitting || !this.selectedEvaluation) return;
    
    this.submitting = true;
    
    const evaluationData = {
      submissionId: this.editingEvaluation.submissionId,
      evaluatorId: this.editingEvaluation.evaluatorId,
      score: this.editingEvaluation.score,
      evaluationType: this.editingEvaluation.evaluationType,
      criteria: this.editingEvaluation.criteria || null,
      feedback: this.editingEvaluation.feedback || null
    };
    
    this.apiService.updateEvaluation(this.selectedEvaluation.id, evaluationData).subscribe({
      next: () => {
        this.showNotification('Evaluación actualizada exitosamente');
        this.closeEditModal();
        this.loadData();
        this.submitting = false;
      },
      error: (error) => {
        this.showNotification('Error al actualizar evaluación: ' + error.message, 'error');
        this.submitting = false;
      }
    });
  }

  deleteEvaluation(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
      this.apiService.deleteEvaluation(id).subscribe({
        next: () => {
          this.showNotification('Evaluación eliminada exitosamente');
          this.loadData();
        },
        error: (error) => {
          this.showNotification('Error al eliminar evaluación: ' + error.message, 'error');
        }
      });
    }
  }

  // Métodos de criterios y resultados automáticos
  getCriteriaString(evaluation: Evaluation): string {
    const criteriaSource = evaluation.criteriaJson || evaluation.criteria;
    if (typeof criteriaSource === 'string') {
      return criteriaSource;
    }
    if (typeof criteriaSource === 'object') {
      return JSON.stringify(criteriaSource, null, 2);
    }
    return '';
  }

  formatCriteriaDisplay(evaluation: Evaluation): string {
    let criteriaData: CriteriaData = {};
    
    try {
      const criteriaSource = evaluation.criteriaJson || evaluation.criteria;
      
      if (typeof criteriaSource === 'string') {
        criteriaData = JSON.parse(criteriaSource);
      } else if (typeof criteriaSource === 'object') {
        criteriaData = criteriaSource as CriteriaData;
      }
    } catch (e) {
      console.error('Error parsing criteria:', e);
      return '<p class="text-muted">No se pudieron cargar los criterios</p>';
    }
    
    if (Object.keys(criteriaData).length === 0) {
      return '<p class="text-muted">No hay criterios definidos</p>';
    }
    
    // Si es evaluación automática, mostrar formato especial
    if (evaluation.evaluationType === 'AUTOMATIC' && criteriaData['commits']) {
      return this.displayAutoEvaluationResults(evaluation);
    }
    
    // Para evaluaciones manuales, mostrar criterios en formato tabla
    return `
      <div class="card">
        <div class="card-header bg-secondary text-white">
          <i class="fas fa-list-check me-2"></i>Criterios de Evaluación
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th><i class="fas fa-tag me-2"></i>Criterio</th>
                  <th><i class="fas fa-star me-2"></i>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(criteriaData).map(([key, value]) => `
                  <tr>
                    <td><strong>${key.charAt(0).toUpperCase() + key.slice(1)}</strong></td>
                    <td>
                      ${typeof value === 'number' 
                        ? `<span class="badge bg-primary fs-6">${value}</span>` 
                        : `<span class="text-muted">${value}</span>`
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  displayAutoEvaluationResults(evaluation: Evaluation): string {
    let criteriaData: CriteriaData = {};
    
    try {
      const criteriaSource = evaluation.criteriaJson || evaluation.criteria;
      
      if (typeof criteriaSource === 'string') {
        criteriaData = JSON.parse(criteriaSource);
      } else if (typeof criteriaSource === 'object') {
        criteriaData = criteriaSource as CriteriaData;
      }
    } catch (e) {
      console.error('Error parsing criteria:', e);
      return '<p class="text-muted">No se pudieron cargar los resultados</p>';
    }
    
    const commits = criteriaData['commits'] || [];
    const commitsCount = commits.length;
    const onTimeCommits = commits.filter((c: CommitInfo) => c.onTime).length;
    const lateCommits = commitsCount - onTimeCommits;
    
    return `
      <div class="alert alert-success">
        <h6><i class="fas fa-check-circle me-2"></i>Evaluación Automática Completada</h6>
        <div class="row">
          <div class="col-md-6">
            <strong>Puntuación Final:</strong> ${evaluation.score}/5<br>
            <strong>Días de retraso:</strong> ${criteriaData['lateDays'] || 0}<br>
            <strong>Penalización aplicada:</strong> ${criteriaData['totalPenalty'] || 0}<br>
            <strong>Método de evaluación:</strong> ${criteriaData['evaluationMethod'] || 'N/A'}
          </div>
          <div class="col-md-6">
            <strong>Total de commits:</strong> ${commitsCount}<br>
            <strong>Commits a tiempo:</strong> ${onTimeCommits}<br>
            <strong>Commits tardíos:</strong> ${lateCommits}<br>
            <strong>Entrega tardía:</strong> ${criteriaData['isLate'] ? 'Sí' : 'No'}
          </div>
        </div>
      </div>
      
      ${commits.length > 0 ? `
      <div class="mt-3">
        <h6><i class="fab fa-github me-2"></i>Commits Analizados (últimos 10)</h6>
        <div class="commits-list" style="max-height: 200px; overflow-y: auto;">
          ${commits.slice(0, 10).map((commit: CommitInfo) => `
            <div class="commit-item p-2 border-bottom">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <strong>${commit.message}</strong><br>
                  <small class="text-muted">
                    ${commit.date} 
                    <span class="badge ${commit.onTime ? 'bg-success' : 'bg-warning'}">
                      ${commit.onTime ? 'A tiempo' : 'Tardío'}
                    </span>
                  </small>
                </div>
                <small class="text-muted">${commit.sha.substring(0, 8)}</small>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    `;
  }

  // Exportación
  downloadAll() {
    this.downloadCSV(this.evaluations, 'evaluaciones_todas');
  }

  downloadFiltered() {
    this.downloadCSV(this.filteredEvaluations, 'evaluaciones_filtradas');
  }

  private downloadCSV(evaluations: Evaluation[], filename: string) {
    const headers = [
      'ID', 'Entrega', 'Asignación', 'Equipo', 'Clase', 
      'Puntuación', 'Tipo', 'Evaluador', 'Fecha Evaluación', 'Retroalimentación'
    ];
    
    const rows = evaluations.map(evaluation => [
      evaluation.id,
      this.getSubmissionInfo(evaluation),
      this.getAssignmentTitle(evaluation),
      this.getTeamName(evaluation),
      this.getClassName(evaluation),
      evaluation.score,
      evaluation.evaluationType === 'AUTOMATIC' ? 'Automática' : 'Manual',
      this.getEvaluatorName(evaluation),
      this.formatEvaluationDate(evaluation),
      evaluation.feedback || ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Método para mostrar notificaciones
  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    if (type === 'error') {
      console.error(message);
      alert('Error: ' + message);
    } else {
      console.log(message);
      alert(message);
    }
  }
}
