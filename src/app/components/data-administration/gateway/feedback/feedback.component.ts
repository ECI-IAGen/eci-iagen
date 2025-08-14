import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';
import { Feedback, FeedbackFormData, FilterOptions, FEEDBACK_TYPES } from '../../../../models/feedback.models';
import { Submission, Assignment, Team } from '../../../../models/submission.models';
import { marked } from 'marked';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {
  feedbacks: Feedback[] = [];
  filteredFeedbacks: Feedback[] = [];
  // Tipos disponibles detectados en los feedbacks existentes (para filtros)
  availableFeedbackTypes: string[] = [];
  
  // Data for dropdowns
  submissions: Submission[] = [];
  filteredSubmissions: Submission[] = [];
  assignments: Assignment[] = [];
  teams: Team[] = [];

  filters: FilterOptions = {
    assignment: '',
    team: '',
    feedbackType: '',
    dateFrom: '',
    dateTo: ''
  };

  // Modal state
  showCreateModal = false;
  showViewModal = false;
  showAutoFeedbackModal = false;
  editingFeedback: Feedback | null = null;

  // Form data
  newFeedback: FeedbackFormData = {
    submissionId: 0,
    feedbackType: 'GENERAL',
    content: '',
    strengths: '',
    improvements: ''
  };

  feedbackTypes = Object.values(FEEDBACK_TYPES);
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private apiService: ApiService) {
    // Configure marked for safe HTML rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    try {
      this.isLoading = true;
      
      const [feedbacks, submissions, assignments, teams] = await Promise.all([
        this.apiService.getFeedbacks().toPromise(),
        this.apiService.getSubmissions().toPromise(),
        this.apiService.getAssignments().toPromise(),
        this.apiService.getTeams().toPromise()
      ]);

      this.feedbacks = feedbacks || [];
      this.submissions = submissions || [];
      this.filteredSubmissions = [...this.submissions];
      this.assignments = assignments || [];
      this.teams = teams || [];

      this.enrichFeedbackData();
      this.filteredFeedbacks = [...this.feedbacks];
  this.updateAvailableFeedbackTypes();

    } catch (error: any) {
      this.showError('Error al cargar datos: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  enrichFeedbackData() {
    this.feedbacks.forEach(feedback => {
      // Find submission details
      const submission = this.submissions.find(s => s.id === feedback.submissionId);
      if (submission) {
        feedback.submissionUrl = submission.fileUrl;
        
        // Find assignment details
        const assignment = this.assignments.find(a => a.id === submission.assignmentId);
        if (assignment) {
          feedback.assignmentTitle = assignment.title;
        }

        // Find team details
        const team = this.teams.find(t => t.id === submission.teamId);
        if (team) {
          feedback.teamName = team.name;
        }
      }
    });
  }

  applyFilters() {
    this.filteredFeedbacks = this.feedbacks.filter(feedback => {
      // Assignment filter
      if (this.filters.assignment && feedback.assignmentTitle !== this.filters.assignment) {
        return false;
      }

      // Team filter
      if (this.filters.team && feedback.teamName !== this.filters.team) {
        return false;
      }

      // Feedback type filter
      if (this.filters.feedbackType && feedback.feedbackType !== this.filters.feedbackType) {
        return false;
      }

      // Date filters
      if (this.filters.dateFrom || this.filters.dateTo) {
        const feedbackDate = this.parseFeedbackDate(feedback.feedbackDate);
        if (this.filters.dateFrom && feedbackDate && feedbackDate < new Date(this.filters.dateFrom)) {
          return false;
        }
        if (this.filters.dateTo && feedbackDate && feedbackDate > new Date(this.filters.dateTo)) {
          return false;
        }
      }

      return true;
    });

    // Also filter submissions for the auto-feedback modal
    this.filterSubmissions();
  }

  filterSubmissions() {
    this.filteredSubmissions = this.submissions.filter(submission => {
      if (this.filters.assignment) {
        const submissionInfo = this.getSubmissionInfo(submission.id);
        return submissionInfo?.assignmentTitle === this.filters.assignment;
      }
      return true;
    });
  }

  clearAllFilters() {
    this.filters = {
      assignment: '',
      team: '',
      feedbackType: '',
      dateFrom: '',
      dateTo: ''
    };
    this.filteredFeedbacks = [...this.feedbacks];
    this.filteredSubmissions = [...this.submissions];
  }

  private updateAvailableFeedbackTypes() {
    const set = new Set<string>();
    (this.feedbacks || []).forEach(f => {
      if (f.feedbackType) set.add(f.feedbackType);
    });
    // Ordenar por etiqueta legible
    this.availableFeedbackTypes = Array.from(set).sort((a, b) =>
      this.getFeedbackTypeLabel(a).localeCompare(this.getFeedbackTypeLabel(b), 'es')
    );

    // Si el filtro activo no existe ya en la lista, lo limpiamos
    if (this.filters.feedbackType && !this.availableFeedbackTypes.includes(this.filters.feedbackType)) {
      this.filters.feedbackType = '';
    }
  }

  openCreateModal() {
    this.newFeedback = {
      submissionId: 0,
      feedbackType: 'GENERAL',
      content: '',
      strengths: '',
      improvements: ''
    };
    this.editingFeedback = null;
    this.showCreateModal = true;
  }

  openEditModal(feedback: Feedback) {
    this.newFeedback = { ...feedback };
    this.editingFeedback = feedback;
    this.showCreateModal = true;
  }

  openViewModal(feedback: Feedback) {
    this.editingFeedback = feedback;
    this.showViewModal = true;
  }

  openAutoFeedbackModal() {
    this.showAutoFeedbackModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showViewModal = false;
    this.showAutoFeedbackModal = false;
    this.editingFeedback = null;
  }

  async saveFeedback() {
    try {
      this.isLoading = true;

      if (this.editingFeedback) {
        // Update existing feedback
        await this.apiService.updateFeedback(this.editingFeedback.id, this.newFeedback).toPromise();
        this.showSuccess('Retroalimentación actualizada correctamente');
      } else {
        // Create new feedback
        await this.apiService.createFeedback(this.newFeedback).toPromise();
        this.showSuccess('Retroalimentación creada correctamente');
      }

      this.closeModals();
      this.loadData();

    } catch (error: any) {
      this.showError('Error al guardar retroalimentación: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteFeedback(id: number) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta retroalimentación?')) {
      return;
    }

    try {
      this.isLoading = true;
      await this.apiService.deleteFeedback(id).toPromise();
      this.showSuccess('Retroalimentación eliminada correctamente');
      this.loadData();
    } catch (error: any) {
      this.showError('Error al eliminar retroalimentación: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  getFeedbackTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'GENERAL': 'General',
      'TECHNICAL': 'Técnico',
      'IMPROVEMENT': 'Mejora',
      'STRENGTH': 'Fortaleza',
      'SUGGESTION': 'Sugerencia'
    };
    
    return typeLabels[type] || type;
  }

  getFeedbackTypeBadgeClass(type: string): string {
    const typeClasses: { [key: string]: string } = {
      'GENERAL': 'bg-primary',
      'TECHNICAL': 'bg-info',
      'IMPROVEMENT': 'bg-warning',
      'STRENGTH': 'bg-success',
      'SUGGESTION': 'bg-secondary'
    };
    
    return typeClasses[type] || 'bg-secondary';
  }

  formatFeedbackDate(date: string | Date | number[] | undefined): string {
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

  formatSubmissionDate(date: string | number[] | undefined): string {
    return this.formatFeedbackDate(date);
  }

  private parseFeedbackDate(date: string | Date | number[] | undefined): Date | null {
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

  downloadFeedbacks() {
    this.exportFeedbacksToCSV(this.feedbacks, 'feedbacks_todos.csv');
  }

  downloadFilteredFeedbacks() {
    this.exportFeedbacksToCSV(this.filteredFeedbacks, 'feedbacks_filtrados.csv');
  }

  private exportFeedbacksToCSV(feedbacks: Feedback[], filename: string) {
    if (!feedbacks || feedbacks.length === 0) {
      this.showError('No hay retroalimentaciones para exportar.');
      return;
    }

    // Define columns to export
    const columns = [
      'ID',
      'Tipo',
      'Fecha',
      'Asignación',
      'Equipo',
      'Contenido',
      'Fortalezas',
      'Mejoras',
      'URL Entrega'
    ];

    // Build CSV rows
    const rows = feedbacks.map(fb => [
      fb.id,
      this.getFeedbackTypeLabel(fb.feedbackType),
      this.formatFeedbackDate(fb.feedbackDate),
      fb.assignmentTitle || '',
      fb.teamName || '',
      fb.submissionUrl || '',
      (fb.content || '').replace(/\r?\n/g, ' ').replace(/"/g, '""'),
      (fb.strengths || '').replace(/\r?\n/g, ' ').replace(/"/g, '""'),
      (fb.improvements || '').replace(/\r?\n/g, ' ').replace(/"/g, '""')
    ]);

    // Convert to CSV string with BOM for UTF-8
    const csvContent = [
      '\uFEFF' + columns.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\r\n');

    // Download as file with UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.showSuccess('Archivo CSV descargado correctamente.');
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

  renderMarkdown(content: string): string {
    if (!content) return '';
    try {
      return marked(content) as string;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return content; // Fallback to plain text
    }
  }

  loadFeedback() {
    this.loadData();
  }

  createFeedback() {
    this.openCreateModal();
  }

  async generateAutoFeedback(submissionId: number) {
    if (!confirm('¿Estás seguro de que quieres generar retroalimentación automática para esta entrega?')) {
      return;
    }

    try {
      this.isLoading = true;
      const feedback = await this.apiService.generateTeamFeedback(submissionId).toPromise();
      this.showSuccess('Retroalimentación automática generada correctamente');
      
      // Close the modal using Angular state
      this.showAutoFeedbackModal = false;
      
      this.loadData(); // Refresh the data to show the new feedback
    } catch (error: any) {
      this.showError('Error al generar retroalimentación automática: ' + error.message);
    } finally {
      this.isLoading = false;
    }
  }

  getSubmissionInfo(submissionId: number): { assignmentTitle?: string, teamName?: string } | null {
    const submission = this.submissions.find(s => s.id === submissionId);
    if (!submission) return null;

    const assignment = this.assignments.find(a => a.id === submission.assignmentId);
    const team = this.teams.find(t => t.id === submission.teamId);

    return {
      assignmentTitle: assignment?.title,
      teamName: team?.name
    };
  }
}
