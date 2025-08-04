import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Feedback, FeedbackFormData, FilterOptions, FEEDBACK_TYPES } from '../../../models/feedback.models';
import { Submission, Assignment, Team } from '../../../models/submission.models';
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
  
  // Data for dropdowns
  submissions: Submission[] = [];
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
      this.assignments = assignments || [];
      this.teams = teams || [];

      this.enrichFeedbackData();
      this.filteredFeedbacks = [...this.feedbacks];

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

  closeModals() {
    this.showCreateModal = false;
    this.showViewModal = false;
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
    // Implementation for downloading feedbacks
    console.log('Downloading all feedbacks...');
  }

  downloadFilteredFeedbacks() {
    // Implementation for downloading filtered feedbacks
    console.log('Downloading filtered feedbacks...');
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
}
