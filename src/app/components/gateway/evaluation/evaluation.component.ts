import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { OriginalityResultsComponent } from '../../originality-results/originality-results.component';
import { 
  Evaluation, 
  User, 
  Class, 
  AutoEvaluationOptions, 
  FilterOptions, 
  EvaluationFormData, 
  AutoEvaluationResult,
  CriteriaData
} from '../../../models/evaluation.models';
import { Submission, Assignment, Team } from '../../../models/submission.models';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule, OriginalityResultsComponent],
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.css']
})
export class EvaluationComponent implements OnInit {
  evaluations: Evaluation[] = [];
  filteredEvaluations: Evaluation[] = [];
  
  // Filter data
  classes: Class[] = [];
  assignments: Assignment[] = [];
  teams: Team[] = [];
  evaluators: User[] = [];
  submissions: Submission[] = [];
  users: User[] = [];
  uniqueEvaluationTypes: string[] = [];

  filters: FilterOptions = {
    class: '',
    assignment: '',
    team: '',
    evaluator: '',
    type: '',
    score: '',
    dateFrom: '',
    dateTo: ''
  };

  // Modal state
  showCreateModal = false;
  showAutoEvaluateModal = false;
  showViewModal = false;
  showAutoEvaluationResults = false;
  editingEvaluation: Evaluation | null = null;
  selectedSubmission: Submission | null = null;
  autoEvaluationResult: AutoEvaluationResult | null = null;

  // Form data
  newEvaluation: EvaluationFormData = {
    submissionId: 0,
    evaluatorId: 0,
    score: 0,
    evaluationType: 'MANUAL',
    criteria: ''
  };

  autoEvaluationOptions: AutoEvaluationOptions = {
    usingIA: false
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Originality analysis properties
  showOriginalitySection = false;
  selectedAssignmentForOriginality: Assignment | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      
      // Load all required data
      const [evaluations, classes, assignments, teams, users, submissions] = await Promise.all([
        this.apiService.getEvaluations().toPromise(),
        this.apiService.getClasses().toPromise(),
        this.apiService.getAssignments().toPromise(),
        this.apiService.getTeams().toPromise(),
        this.apiService.getUsers().toPromise(),
        this.apiService.getSubmissions().toPromise()
      ]);

      this.evaluations = evaluations || [];
      this.classes = classes || [];
      this.assignments = assignments || [];
      this.teams = teams || [];
      this.users = users || [];
      this.submissions = submissions || [];
      this.evaluators = this.users.filter(user => user.roleName === 'PROFESOR' || user.roleName === 'EVALUADOR');

      // Extract unique evaluation types
      this.uniqueEvaluationTypes = [...new Set(this.evaluations.map(evaluation => evaluation.evaluationType).filter(type => type))];

      this.enrichEvaluationData();
      this.filteredEvaluations = [...this.evaluations];

    } catch (error: any) {
      this.showError('Error al cargar datos: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  enrichEvaluationData() {
    this.evaluations.forEach(evaluation => {
      // Find submission details
      const submission = this.submissions.find(s => s.id === evaluation.submissionId);
      if (submission) {
        evaluation.submissionUrl = submission.fileUrl; // Use fileUrl instead of repositoryUrl
        
        // Find assignment details
        const assignment = this.assignments.find(a => a.id === submission.assignmentId);
        if (assignment) {
          evaluation.assignmentTitle = assignment.title;
        }

        // Find team details
        const team = this.teams.find(t => t.id === submission.teamId);
        if (team) {
          evaluation.teamName = team.name;
        }
      }

      // Find evaluator details
      const evaluator = this.users.find(u => u.id === evaluation.evaluatorId);
      if (evaluator) {
        evaluation.evaluatorName = evaluator.name;
      }
    });
    
    // Update unique evaluation types after enriching data
    this.updateUniqueEvaluationTypes();
  }

  applyFilters() {
    this.filteredEvaluations = this.evaluations.filter(evaluation => {
      // Class filter
      if (this.filters.class && evaluation.className !== this.filters.class) {
        return false;
      }

      // Assignment filter
      if (this.filters.assignment && evaluation.assignmentTitle !== this.filters.assignment) {
        return false;
      }

      // Team filter
      if (this.filters.team && evaluation.teamName !== this.filters.team) {
        return false;
      }

      // Evaluator filter
      if (this.filters.evaluator && evaluation.evaluatorName !== this.filters.evaluator) {
        return false;
      }

      // Type filter
      if (this.filters.type && evaluation.evaluationType !== this.filters.type) {
        return false;
      }

      // Score filter
      if (this.filters.score) {
        const score = evaluation.score;
        switch (this.filters.score) {
          case '5':
            if (score !== 5) return false;
            break;
          case '4-5':
            if (score < 4 || score > 5) return false;
            break;
          case '3-4':
            if (score < 3 || score > 4) return false;
            break;
          case '2-3':
            if (score < 2 || score > 3) return false;
            break;
          case '0-2':
            if (score < 0 || score > 2) return false;
            break;
        }
      }

      // Date filters
      if (this.filters.dateFrom || this.filters.dateTo) {
        const evalDate = this.parseEvaluationDate(evaluation.evaluationDate);
        if (this.filters.dateFrom && evalDate && evalDate < new Date(this.filters.dateFrom)) {
          return false;
        }
        if (this.filters.dateTo && evalDate && evalDate > new Date(this.filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
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
    this.filteredEvaluations = [...this.evaluations];
  }

  openCreateModal() {
    this.newEvaluation = {
      submissionId: 0,
      evaluatorId: 0,
      score: 0,
      evaluationType: 'MANUAL',
      criteria: ''
    };
    this.editingEvaluation = null;
    this.showCreateModal = true;
  }

  openEditModal(evaluation: Evaluation) {
    this.newEvaluation = { ...evaluation };
    this.editingEvaluation = evaluation;
    this.showCreateModal = true;
  }

  openAutoEvaluateModal() {
    this.selectedSubmission = null;
    this.autoEvaluationOptions.usingIA = false;
    this.showAutoEvaluateModal = true;
  }

  openViewModal(evaluation: Evaluation) {
    this.editingEvaluation = evaluation;
    this.showViewModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showAutoEvaluateModal = false;
    this.showViewModal = false;
    this.showAutoEvaluationResults = false;
    this.editingEvaluation = null;
    this.selectedSubmission = null;
    this.autoEvaluationResult = null;
  }

  async saveEvaluation() {
    try {
      this.isLoading = true;

      if (this.editingEvaluation) {
        // Update existing evaluation
        await this.apiService.updateEvaluation(this.editingEvaluation.id, this.newEvaluation).toPromise();
        this.showSuccess('Evaluación actualizada correctamente');
      } else {
        // Create new evaluation
        await this.apiService.createEvaluation(this.newEvaluation).toPromise();
        this.showSuccess('Evaluación creada correctamente');
      }

      this.closeModals();
      this.loadData();

    } catch (error: any) {
      this.showError('Error al guardar evaluación: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteEvaluation(id: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta evaluación?')) {
      return;
    }

    try {
      this.isLoading = true;
      await this.apiService.deleteEvaluation(id).toPromise();
      this.showSuccess('Evaluación eliminada correctamente');
      this.loadData();
    } catch (error: any) {
      this.showError('Error al eliminar evaluación: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async executeAutoEvaluation(evaluationType: string) {
    if (!this.selectedSubmission) {
      this.showError('Por favor selecciona una entrega');
      return;
    }

    const evaluatorId = this.users.find(u => u.roleName === 'PROFESOR')?.id;
    if (!evaluatorId) {
      this.showError('No se encontró un profesor para realizar la evaluación');
      return;
    }

    // Check if this is a good practices evaluation (asynchronous)
    const isGoodPractices = evaluationType === 'GOOD_PRACTICES' || evaluationType === 'GOOD_PRACTICES_AI' || evaluationType === 'good-practices';
    const isUsingIA = evaluationType === 'GOOD_PRACTICES_AI' || this.autoEvaluationOptions.usingIA;
    
    let confirmMessage = `¿Estás seguro de que quieres iniciar el análisis automático de ${this.getEvaluationTypeLabel(evaluationType)}?`;
    
    if (isGoodPractices) {
      if (isUsingIA) {
        confirmMessage += '\n\n⚠️ ADVERTENCIA: El análisis con Inteligencia Artificial puede tardar varios minutos en completarse.';
      }
      confirmMessage += '\n\nEl análisis se ejecutará en segundo plano y aparecerá automáticamente en la lista cuando esté disponible.';
    } else {
      confirmMessage += '\n\nEl análisis se completará inmediatamente.';
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      this.isLoading = true;
      
      // Close modal
      this.showAutoEvaluateModal = false;
      
      if (evaluationType === 'SCHEDULER' || evaluationType === 'scheduler' || evaluationType === 'commits') {
        // Synchronous evaluation for GitHub commits/schedule
        const result = await this.apiService.autoEvaluateGitHubCommits(this.selectedSubmission.id, evaluatorId).toPromise();
        
        if (result) {
          this.autoEvaluationResult = result;
          this.showAutoEvaluationResults = true;
          this.showSuccess('Evaluación de cronograma completada exitosamente');
          // Reload data to show the new evaluation
          this.loadData();
        }
        
      } else if (isGoodPractices) {
        // Asynchronous evaluation for good practices
        await this.apiService.autoEvaluateGoodPractices(
          this.selectedSubmission.id, 
          evaluatorId, 
          isUsingIA
        ).toPromise();
        
        const typeMessage = this.getEvaluationTypeLabel(evaluationType);
        this.showSuccess(`Análisis de ${typeMessage} iniciado exitosamente. Los resultados aparecerán automáticamente cuando estén listos.`);
      }
      
      // Reset selections
      this.selectedSubmission = null;
      this.autoEvaluationOptions.usingIA = false;

    } catch (error: any) {
      this.showError('Error al iniciar evaluación automática: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  formatCriteriaDisplay(evaluation: Evaluation): string {
    let criteriaData: any = {};
    
    try {
      criteriaData = evaluation.criteriaJson ? JSON.parse(evaluation.criteriaJson) : {};
    } catch (e) {
      return '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle me-2"></i>Error al parsear criterios JSON</div>';
    }

    if (Object.keys(criteriaData).length === 0) {
      return '<div class="alert alert-info"><i class="fas fa-info-circle me-2"></i>No hay criterios definidos</div>';
    }

    // Format any JSON data in a user-friendly way
    return this.formatGenericCriteriaDisplay(criteriaData, evaluation.evaluationType);
  }

  private formatGenericCriteriaDisplay(criteriaData: any, evaluationType?: string): string {
    if (!criteriaData || typeof criteriaData !== 'object') {
      return '<div class="alert alert-warning">Datos de criterios inválidos</div>';
    }

    let html = '<div class="criteria-container">';
    
    // Add evaluation type header if available
    if (evaluationType) {
      html += `<div class="criteria-header mb-3">
        <h6 class="text-primary"><i class="fas fa-clipboard-list me-2"></i>Criterios de Evaluación - ${this.getEvaluationTypeLabel(evaluationType)}</h6>
      </div>`;
    }

    // Check if it's a structured evaluation result
    if (this.isStructuredEvaluationResult(criteriaData)) {
      html += this.formatStructuredEvaluationResult(criteriaData);
    } else {
      // Format as generic key-value pairs
      html += this.formatKeyValuePairs(criteriaData);
    }
    
    html += '</div>';
    return html;
  }

  private isStructuredEvaluationResult(data: any): boolean {
    // Check if it has common evaluation result properties
    return data.hasOwnProperty('finalScore') || 
           data.hasOwnProperty('score') || 
           data.hasOwnProperty('commits') || 
           data.hasOwnProperty('evaluationMethod') ||
           data.hasOwnProperty('criteria') ||
           data.hasOwnProperty('metrics');
  }

  private formatStructuredEvaluationResult(data: any): string {
    let html = '<div class="row">';
    
    // Left column - Metrics
    html += '<div class="col-md-6"><div class="card h-100">';
    html += '<div class="card-header bg-primary text-white"><i class="fas fa-chart-line me-2"></i>Métricas</div>';
    html += '<div class="card-body">';
    
    // Display score information
    if (data.finalScore !== undefined || data.score !== undefined) {
      const score = data.finalScore || data.score;
      html += `<div class="metric-item mb-2">
        <strong>Puntuación:</strong> 
        <span class="badge bg-success fs-6">${score}/5</span>
      </div>`;
    }
    
    // Display other metrics
    const metricsToShow = ['lateDays', 'totalPenalty', 'isLate', 'evaluationMethod', 'codeQuality', 'performance'];
    metricsToShow.forEach(key => {
      if (data[key] !== undefined) {
        const value = data[key];
        const badgeClass = this.getBadgeClassForMetric(key, value);
        const displayValue = typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value;
        html += `<div class="metric-item mb-2">
          <strong>${this.formatKeyName(key)}:</strong> 
          <span class="badge ${badgeClass}">${displayValue}</span>
        </div>`;
      }
    });
    
    html += '</div></div></div>';
    
    // Right column - Details
    html += '<div class="col-md-6"><div class="card h-100">';
    html += '<div class="card-header bg-info text-white"><i class="fas fa-info-circle me-2"></i>Detalles</div>';
    html += '<div class="card-body">';
    
    // Display arrays and complex objects
    if (data.commits && Array.isArray(data.commits)) {
      const commitsCount = data.commits.length;
      const onTimeCommits = data.commits.filter((c: any) => c.onTime).length;
      html += `<div class="metric-item mb-2">
        <strong>Total commits:</strong> <span class="badge bg-primary">${commitsCount}</span>
      </div>`;
      html += `<div class="metric-item mb-2">
        <strong>A tiempo:</strong> <span class="badge bg-success">${onTimeCommits}</span>
      </div>`;
      html += `<div class="metric-item mb-2">
        <strong>Tardíos:</strong> <span class="badge bg-warning">${commitsCount - onTimeCommits}</span>
      </div>`;
    }
    
    if (data.criteria && typeof data.criteria === 'object') {
      Object.entries(data.criteria).forEach(([key, value]) => {
        html += `<div class="metric-item mb-2">
          <strong>${this.formatKeyName(key)}:</strong> ${value}
        </div>`;
      });
    }
    
    // Display any other relevant information
    const excludeKeys = ['finalScore', 'score', 'lateDays', 'totalPenalty', 'isLate', 'evaluationMethod', 'commits', 'criteria', 'codeQuality', 'performance'];
    Object.entries(data).forEach(([key, value]) => {
      if (!excludeKeys.includes(key) && value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          html += `<div class="metric-item mb-2">
            <strong>${this.formatKeyName(key)}:</strong><br>
            <small class="text-muted">${JSON.stringify(value, null, 2)}</small>
          </div>`;
        } else if (!Array.isArray(value)) {
          html += `<div class="metric-item mb-2">
            <strong>${this.formatKeyName(key)}:</strong> ${value}
          </div>`;
        }
      }
    });
    
    html += '</div></div></div>';
    html += '</div>';
    
    return html;
  }

  private formatKeyValuePairs(data: any, level: number = 0): string {
    let html = '';
    const indent = '  '.repeat(level);
    
    if (level === 0) {
      html += '<div class="card"><div class="card-header bg-secondary text-white">';
      html += '<i class="fas fa-list me-2"></i>Criterios de Evaluación</div>';
      html += '<div class="card-body">';
    }
    
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined) return;
      
      html += `<div class="criteria-item mb-2" style="margin-left: ${level * 20}px;">`;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        html += `<strong class="text-primary">${this.formatKeyName(key)}:</strong>`;
        html += '<div class="ms-3">';
        html += this.formatKeyValuePairs(value, level + 1);
        html += '</div>';
      } else if (Array.isArray(value)) {
        html += `<strong class="text-primary">${this.formatKeyName(key)}:</strong>`;
        html += `<span class="badge bg-info ms-2">${value.length} elementos</span>`;
        if (value.length > 0) {
          html += '<div class="ms-3 mt-2">';
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              html += `<div class="border-start border-2 border-light ps-2 mb-2">`;
              html += `<small class="text-muted">Elemento ${index + 1}:</small>`;
              html += this.formatKeyValuePairs(item, level + 1);
              html += '</div>';
            } else {
              html += `<div class="text-muted">• ${item}</div>`;
            }
          });
          html += '</div>';
        }
      } else {
        const badgeClass = this.getBadgeClassForValue(value);
        html += `<strong class="text-primary">${this.formatKeyName(key)}:</strong> `;
        html += `<span class="badge ${badgeClass}">${value}</span>`;
      }
      
      html += '</div>';
    });
    
    if (level === 0) {
      html += '</div></div>';
    }
    
    return html;
  }

  private formatKeyName(key: string): string {
    // Convert camelCase and snake_case to readable format
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  private getBadgeClassForMetric(key: string, value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'bg-success' : 'bg-danger';
    }
    
    if (typeof value === 'number') {
      if (key.includes('score') || key.includes('Score')) {
        if (value >= 4) return 'bg-success';
        if (value >= 3) return 'bg-warning';
        return 'bg-danger';
      }
      if (key.includes('penalty') || key.includes('late')) {
        return value > 0 ? 'bg-danger' : 'bg-success';
      }
    }
    
    return 'bg-secondary';
  }

  private getBadgeClassForValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'bg-success' : 'bg-danger';
    }
    
    if (typeof value === 'number') {
      if (value >= 4) return 'bg-success';
      if (value >= 2) return 'bg-warning';
      if (value < 2 && value >= 0) return 'bg-danger';
    }
    
    return 'bg-light text-dark';
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 4.5) return 'bg-success';
    if (score >= 3.5) return 'bg-info';
    if (score >= 2.5) return 'bg-warning';
    return 'bg-danger';
  }

  getTypeBadgeClass(type: string): string {
    if (!type) return 'bg-secondary';
    
    const lowerType = type.toLowerCase();
    if (lowerType.includes('auto') || lowerType.includes('scheduler') || lowerType.includes('good_practices')) {
      return 'bg-info';
    }
    return 'bg-secondary';
  }

  getEvaluationTypeLabel(type: string): string {
    if (!type) return 'Sin tipo';
    
    const typeLabels: { [key: string]: string } = {
      'MANUAL': 'Manual',
      'AUTOMATIC': 'Automática',
      'SCHEDULER': 'Cronograma',
      'GOOD_PRACTICES': 'Buenas Prácticas',
      'GOOD_PRACTICES_AI': 'Buenas Prácticas con IA'
    };
    
    return typeLabels[type] || type;
  }

  formatEvaluationDate(date: string | Date | number[] | undefined): string {
    if (!date) return '';
    
    let parsedDate: Date;
    
    if (Array.isArray(date)) {
      // Handle number array format [year, month, day, hour, minute, second]
      parsedDate = new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
    } else if (typeof date === 'string') {
      parsedDate = new Date(date);
    } else {
      parsedDate = date;
    }
    
    return parsedDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private parseEvaluationDate(date: string | Date | number[] | undefined): Date | null {
    if (!date) return null;
    
    if (Array.isArray(date)) {
      // Handle number array format [year, month, day, hour, minute, second]
      return new Date(date[0], date[1] - 1, date[2], date[3] || 0, date[4] || 0, date[5] || 0);
    } else if (typeof date === 'string') {
      return new Date(date);
    } else {
      return date;
    }
  }

  downloadEvaluations() {
    // Implementation for downloading evaluations
    console.log('Downloading all evaluations...');
  }

  downloadFilteredEvaluations() {
    // Implementation for downloading filtered evaluations
    console.log('Downloading filtered evaluations...');
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private updateUniqueEvaluationTypes() {
    this.uniqueEvaluationTypes = [...new Set(this.evaluations.map(evaluation => evaluation.evaluationType).filter(type => type))];
  }

  // =================== ORIGINALITY ANALYSIS METHODS ===================
  
  toggleOriginalitySection() {
    this.showOriginalitySection = !this.showOriginalitySection;
    
    // Set default assignment if none selected
    if (this.showOriginalitySection && !this.selectedAssignmentForOriginality && this.assignments.length > 0) {
      this.selectedAssignmentForOriginality = this.assignments[0];
    }
  }

  getSubmissionsForOriginality(): any[] {
    if (!this.selectedAssignmentForOriginality) {
      return [];
    }

    // Get submissions for the selected assignment
    const assignmentSubmissions = this.submissions.filter(submission => 
      submission.assignmentId === this.selectedAssignmentForOriginality!.id
    );

    // Transform submissions to include repository URL from fileUrl
    return assignmentSubmissions.map(submission => {
      const team = this.teams.find(t => t.id === submission.teamId);
      return {
        id: submission.id,
        teamId: submission.teamId,
        teamName: team?.name || `Team ${submission.teamId}`,
        repositoryUrl: submission.fileUrl || '', // Using fileUrl as repository URL
        assignmentId: submission.assignmentId,
        assignmentTitle: this.selectedAssignmentForOriginality!.title,
        memberNames: [] // We'll get member names from users if needed
      };
    }).filter(submission => submission.repositoryUrl); // Only include submissions with repository URLs
  }
}
