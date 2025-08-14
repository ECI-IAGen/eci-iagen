import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
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
} from '../../../../models/evaluation.models';
import { Submission, Assignment, Team } from '../../../../models/submission.models';

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

  showOriginalitySection = false;
  selectedAssignmentForOriginality: Assignment | null = null;

  constructor(private apiService: ApiService) { }

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

    let confirmMessage = `¿Estás seguro de que quieres iniciar el análisis automático de ${evaluationType}?`;

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

        const typeMessage = evaluationType;
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

  private formatCheckstyleCriteria(criteriaData: any): string {
    // Check for new structure with summary and patterns
    if (!criteriaData.summary && !criteriaData.results) {
      return '<div class="alert alert-warning">No se encontraron resultados de Checkstyle.</div>';
    }

    let html = '<div class="checkstyle-criteria">';

    // Handle new JSON structure
    if (criteriaData.summary) {
      const summary = criteriaData.summary;
      const totalErrors = summary.total_errors || 0;
      const totalWarnings = summary.total_warnings || 0;
      const totalFiles = summary.total_files || 0;
      const analysisTime = summary.analysis_time || 0;

      // Header with repository info and report link
      html += '<div class="row mb-3">';
      html += '<div class="col-md-8">';
      html += '<h6 class="text-primary mb-1"><i class="fas fa-bug me-2"></i>Resultados de Checkstyle</h6>';
      if (criteriaData.repository) {
        html += `<small class="text-muted"><i class="fab fa-github me-1"></i>Repositorio: ${criteriaData.repository.owner}/${criteriaData.repository.name}</small>`;
      }
      html += '</div>';

      // HTML Report link in header
      if (criteriaData.html_url) {
        html += '<div class="col-md-4 text-end">';
        html += `<a href="${criteriaData.html_url}" target="_blank" class="btn btn-primary btn-sm">
          <i class="fas fa-external-link-alt me-1"></i>Ver Reporte Detallado
        </a>`;
        html += '</div>';
      }
      html += '</div>';

      // Summary metrics row
      html += '<div class="row mb-3">';

      // Left column - Summary
      html += '<div class="col-md-6">';
      html += '<div class="card h-100">';
      html += '<div class="card-header bg-primary text-white"><i class="fas fa-chart-bar me-2"></i>Resumen</div>';
      html += '<div class="card-body">';

      // Total errors with color coding
      let errorColorClass = 'text-success'; // Green for 0 errors
      if (totalErrors > 0 && totalErrors <= 10) {
        errorColorClass = 'text-warning'; // Yellow for 1-10 errors
      } else if (totalErrors > 10) {
        errorColorClass = 'text-danger'; // Red for >10 errors
      }

      html += `<div class="metric-item mb-2">
        <strong>Total de errores:</strong> 
        <span class="badge bg-danger fs-6">${totalErrors}</span>
      </div>`;

      html += `<div class="metric-item mb-2">
        <strong>Total de advertencias:</strong> 
        <span class="badge bg-warning">${totalWarnings}</span>
      </div>`;

      html += `<div class="metric-item mb-2">
        <strong>Archivos analizados:</strong> 
        <span class="badge bg-info">${totalFiles}</span>
      </div>`;

      html += `<div class="metric-item mb-2">
        <strong>Tiempo de análisis:</strong> 
        <span class="badge bg-secondary">${analysisTime.toFixed(2)}s</span>
      </div>`;

      html += '</div></div></div>';

      // Right column - Pattern breakdown
      html += '<div class="col-md-6">';
      html += '<div class="card h-100">';
      html += '<div class="card-header bg-info text-white"><i class="fas fa-list me-2"></i>Patrones de Error</div>';
      html += '<div class="card-body" style="max-height: 300px; overflow-y: auto;">';

      if (criteriaData.patterns && Object.keys(criteriaData.patterns).length > 0) {
        // Sort patterns by count (descending)
        const sortedPatterns = Object.entries(criteriaData.patterns)
          .sort(([, a]: any, [, b]: any) => b.count - a.count);

        sortedPatterns.forEach(([patternName, patternData]: any) => {
          const badgeClass = patternData.type === 'ERROR' ? 'bg-danger' : 'bg-warning';
          html += `<div class="metric-item mb-2 d-flex justify-content-between align-items-center">
            <span class="text-sm">${patternName}:</span>
            <span class="badge ${badgeClass}">${patternData.count}</span>
          </div>`;
        });
      } else {
        html += '<div class="text-muted">No se encontraron patrones específicos</div>';
      }

      html += '</div></div></div>';
      html += '</div>';

    } else if (criteriaData.results) {
      // Handle legacy structure
      const results = criteriaData.results;
      const errorCount = results.errors ? results.errors.length : 0;

      // Determine color based on error count (more errors = more red)
      let colorClass = 'text-success'; // Green for 0 errors
      if (errorCount > 0 && errorCount <= 5) {
        colorClass = 'text-warning'; // Yellow for 1-5 errors
      } else if (errorCount > 5) {
        colorClass = 'text-danger'; // Red for >5 errors
      }

      html += '<h6><i class="fas fa-bug me-2"></i>Resultados de Checkstyle</h6>';
      html += `<p><strong>Total de errores:</strong> <span class="fw-bold ${colorClass}">${errorCount}</span></p>`;

      if (results.html_url) {
        html += `<p>
          <a href="${results.html_url}" target="_blank" class="btn btn-primary btn-sm">
            <i class="fas fa-external-link-alt me-2"></i>Ver reporte detallado de Checkstyle
          </a>
        </p>`;
      }

      if (results.errors && results.errors.length > 0) {
        html += '<h6>Detalle de errores:</h6>';
        html += '<ul class="list-group">';
        results.errors.forEach((error: any) => {
          html += `<li class="list-group-item">
            <strong>Archivo:</strong> ${error.file} (Línea: ${error.line})<br>
            <strong>Mensaje:</strong> ${error.message}
          </li>`;
        });
        html += '</ul>';
      }
    }

    html += '</div>';
    return html;
  }

  private formatGithubSchedule(criteriaData: any): string {
    let html = '<div class="github-schedule-criteria">';

    // Header
    html += '<div class="row mb-3">';
    html += '<div class="col-12">';
    html += '<h6 class="text-primary"><i class="fas fa-calendar-alt me-2"></i>Análisis de Cronograma GitHub</h6>';
    html += '</div>';
    html += '</div>';

    // Main metrics row
    html += '<div class="row">';

    // Left column - Score and basic metrics
    html += '<div class="col-md-6">';
    html += '<div class="card h-100">';
    html += '<div class="card-header bg-primary text-white"><i class="fas fa-chart-line me-2"></i>Métricas Principales</div>';
    html += '<div class="card-body">';

    // Score
    if (criteriaData.finalScore !== undefined || criteriaData.score !== undefined) {
      const score = criteriaData.finalScore || criteriaData.score;
      const scoreClass = score >= 4 ? 'bg-success' : score >= 3 ? 'bg-warning' : 'bg-danger';
      html += `<div class="metric-item mb-3">
        <strong>Puntuación Final:</strong> 
        <span class="badge ${scoreClass} fs-6">${score}/5</span>
      </div>`;
    }

    // Late status
    if (criteriaData.isLate !== undefined) {
      const lateClass = criteriaData.isLate ? 'bg-danger' : 'bg-success';
      const lateText = criteriaData.isLate ? 'Sí' : 'No';
      html += `<div class="metric-item mb-2">
        <strong>Entrega tardía:</strong> 
        <span class="badge ${lateClass}">${lateText}</span>
      </div>`;
    }

    // Late days
    if (criteriaData.lateDays !== undefined) {
      const lateDaysClass = criteriaData.lateDays > 0 ? 'bg-warning' : 'bg-success';
      html += `<div class="metric-item mb-2">
        <strong>Días de retraso:</strong> 
        <span class="badge ${lateDaysClass}">${criteriaData.lateDays}</span>
      </div>`;
    }

    // Penalty
    if (criteriaData.totalPenalty !== undefined) {
      const penaltyClass = criteriaData.totalPenalty > 0 ? 'bg-danger' : 'bg-success';
      html += `<div class="metric-item mb-2">
        <strong>Penalización total:</strong> 
        <span class="badge ${penaltyClass}">${criteriaData.totalPenalty}</span>
      </div>`;
    }

    html += '</div></div></div>';

    // Right column - Commits analysis
    html += '<div class="col-md-6">';
    html += '<div class="card h-100">';
    html += '<div class="card-header bg-info text-white"><i class="fas fa-code-branch me-2"></i>Análisis de Commits</div>';
    html += '<div class="card-body">';

    if (criteriaData.commits && Array.isArray(criteriaData.commits)) {
      const totalCommits = criteriaData.commits.length;
      const onTimeCommits = criteriaData.commits.filter((c: any) => c.onTime).length;
      const lateCommits = totalCommits - onTimeCommits;

      html += `<div class="metric-item mb-2">
        <strong>Total commits:</strong> 
        <span class="badge bg-primary">${totalCommits}</span>
      </div>`;

      html += `<div class="metric-item mb-2">
        <strong>A tiempo:</strong> 
        <span class="badge bg-success">${onTimeCommits}</span>
      </div>`;

      html += `<div class="metric-item mb-2">
        <strong>Tardíos:</strong> 
        <span class="badge bg-warning">${lateCommits}</span>
      </div>`;

      // Show percentage if we have commits
      if (totalCommits > 0) {
        const onTimePercentage = Math.round((onTimeCommits / totalCommits) * 100);
        const percentageClass = onTimePercentage >= 80 ? 'bg-success' : onTimePercentage >= 60 ? 'bg-warning' : 'bg-danger';
        html += `<div class="metric-item mb-2">
          <strong>% A tiempo:</strong> 
          <span class="badge ${percentageClass}">${onTimePercentage}%</span>
        </div>`;
      }
    } else {
      html += '<div class="alert alert-warning"><small>No se encontraron datos de commits</small></div>';
    }

    html += '</div></div></div>';
    html += '</div>';

    // Additional details if available
    if (criteriaData.evaluationMethod) {
      html += '<div class="row mt-3">';
      html += '<div class="col-12">';
      html += '<div class="card">';
      html += '<div class="card-header bg-secondary text-white"><i class="fas fa-info-circle me-2"></i>Información Adicional</div>';
      html += '<div class="card-body">';
      html += `<div class="metric-item">
        <strong>Método de evaluación:</strong> 
        <span class="badge bg-light text-dark">${criteriaData.evaluationMethod}</span>
      </div>`;
      html += '</div></div></div></div>';
    }

    html += '</div>';
    return html;
  }

  private formatGenericCriteriaDisplay(criteriaData: any, evaluationType?: string): string {
    if (!criteriaData || typeof criteriaData !== 'object') {
      return '<div class="alert alert-warning">Datos de criterios inválidos</div>';
    }

    let html = '<div class="criteria-container">';

    // Add evaluation type header if available
    if (evaluationType) {
      html += `<div class="criteria-header mb-3">
        <h6 class="text-primary"><i class="fas fa-clipboard-list me-2"></i>Criterios de Evaluación - ${evaluationType}</h6>
      </div>`;
    }

    // Handle specific evaluation types with custom formatters
    switch (evaluationType) {
      case 'GOOD_PRACTICES_CHECKSTYLE':
        html += this.formatCheckstyleCriteria(criteriaData);
        break;

      case 'SCHEDULER_GITHUB':
        html += this.formatGithubSchedule(criteriaData);
        break;

      default:
        // Format as generic key-value pairs for manual evaluations and others
        html += this.formatKeyValuePairs(criteriaData);
        break;
    }

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
    // Descargar todas las evaluaciones en CSV con codificación UTF-8 (BOM)
    const data = this.evaluations.map(e => ({
      ID: e.id,
      Asignación: e.assignmentTitle || '',
      Equipo: e.teamName || '',
      Puntuación: e.score,
      Tipo: e.evaluationType,
      Evaluador: e.evaluatorName || '',
      Fecha: this.formatEvaluationDate(e.evaluationDate),
      'URL Entrega': e.submissionUrl || ''
    }));
    this.exportToCsv('evaluaciones_todas.csv', data);
  }

  downloadFilteredEvaluations() {
    // Descargar evaluaciones filtradas en CSV con codificación UTF-8 (BOM)
    const data = this.filteredEvaluations.map(e => ({
      ID: e.id,
      Asignación: e.assignmentTitle || '',
      Equipo: e.teamName || '',
      Puntuación: e.score,
      Tipo: e.evaluationType,
      Evaluador: e.evaluatorName || '',
      Fecha: this.formatEvaluationDate(e.evaluationDate),
      'URL Entrega': e.submissionUrl || ''
    }));
    this.exportToCsv('evaluaciones_filtradas.csv', data);
  }

  private exportToCsv(filename: string, rows: any[]) {
    if (!rows || !rows.length) {
      return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map(row =>
          keys
            .map(k => {
              let cell = row[k] == null ? '' : row[k].toString();
              cell = cell.replace(/"/g, '""');
              return `"${cell}"`;
            })
            .join(separator)
        )
        .join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const nav: any = navigator;
    if (nav.msSaveBlob) {
      nav.msSaveBlob(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
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
