import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface SubmissionInfo {
  id: number;
  teamId: number;
  teamName: string;
  repositoryUrl: string;
  assignmentId: number;
  assignmentTitle: string;
  memberNames?: string[];
}

interface ComparisonResult {
  submissionId1: number;
  submissionId2: number;
  similarity: number;
}

interface OriginalityResponse {
  assignmentId: number;
  assignmentTitle: string;
  comparisons: ComparisonResult[];
}

@Component({
  selector: 'app-originality-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './originality-results.component.html',
  styleUrls: ['./originality-results.component.css']
})
export class OriginalityResultsComponent implements OnInit {
  @Input() assignmentId!: number;
  @Input() submissions: SubmissionInfo[] = [];
  @Input() assignmentTitle: string = '';
  
  originalityResults: OriginalityResponse | null = null;
  loading = false;
  error: string | null = null;
  showRawJson = false;
  jplagHealthy = false;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkJPlagHealth();
  }

  async checkJPlagHealth() {
    try {
      const health = await this.apiService.checkJPlagHealth().toPromise();
      this.jplagHealthy = health && health.status === 'UP';
    } catch (error) {
      console.warn('JPlag service health check failed:', error);
      this.jplagHealthy = false;
    }
  }

  analyzeOriginality() {
    if (!this.submissions || this.submissions.length === 0) {
      this.error = 'No hay entregas para analizar';
      return;
    }

    if (this.submissions.length < 2) {
      this.error = 'Se necesitan al menos 2 entregas para realizar el análisis de originalidad';
      return;
    }

    this.loading = true;
    this.error = null;

    const requestData = {
      assignmentId: this.assignmentId,
      assignmentTitle: this.assignmentTitle || `Assignment ${this.assignmentId}`,
      submissions: this.submissions.map(submission => ({
        submissionId: submission.id,
        teamId: submission.teamId,
        teamName: submission.teamName || `Team ${submission.teamId}`,
        repositoryUrl: submission.repositoryUrl,
        memberNames: submission.memberNames || []
      }))
    };

    console.log('Sending originality analysis request:', requestData);

    this.apiService.checkOriginality(requestData).subscribe({
      next: (response) => {
        console.log('Originality analysis response:', response);
        this.originalityResults = response;
        this.loading = false;
        
        // Sort comparisons by similarity (highest first)
        if (this.originalityResults && this.originalityResults.comparisons) {
          this.originalityResults.comparisons.sort((a, b) => b.similarity - a.similarity);
        }
      },
      error: (error) => {
        console.error('Error analyzing originality:', error);
        this.error = 'Error al analizar originalidad: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  toggleRawJson() {
    this.showRawJson = !this.showRawJson;
  }

  getSimilarityColor(similarity: number): string {
    if (similarity >= 80) return '#dc3545'; // Rojo - Alto riesgo
    if (similarity >= 60) return '#fd7e14'; // Naranja - Riesgo medio
    if (similarity >= 40) return '#ffc107'; // Amarillo - Riesgo bajo
    return '#28a745'; // Verde - Sin riesgo
  }

  getSimilarityLevel(similarity: number): string {
    if (similarity >= 80) return 'ALTO';
    if (similarity >= 60) return 'MEDIO';
    if (similarity >= 40) return 'BAJO';
    return 'MÍNIMO';
  }

  getSimilarityLabel(similarity: number): string {
    if (similarity >= 80) return 'Alto riesgo de plagio';
    if (similarity >= 60) return 'Riesgo medio de plagio';
    if (similarity >= 40) return 'Riesgo bajo de plagio';
    return 'Sin riesgo aparente';
  }

  getTeamName(submissionId: number): string {
    const submission = this.submissions.find(s => s.id === submissionId);
    return submission?.teamName || `Submission ${submissionId}`;
  }

  getRepositoryUrl(submissionId: number): string {
    const submission = this.submissions.find(s => s.id === submissionId);
    return submission?.repositoryUrl || '';
  }

  getRiskSummary(): { high: number, medium: number, low: number, minimal: number } {
    if (!this.originalityResults?.comparisons) {
      return { high: 0, medium: 0, low: 0, minimal: 0 };
    }

    return this.originalityResults.comparisons.reduce((acc, comparison) => {
      if (comparison.similarity >= 80) acc.high++;
      else if (comparison.similarity >= 60) acc.medium++;
      else if (comparison.similarity >= 40) acc.low++;
      else acc.minimal++;
      return acc;
    }, { high: 0, medium: 0, low: 0, minimal: 0 });
  }

  getOverallRiskLevel(): string {
    const summary = this.getRiskSummary();
    if (summary.high > 0) return 'ALTO';
    if (summary.medium > 0) return 'MEDIO';
    if (summary.low > 0) return 'BAJO';
    return 'MÍNIMO';
  }

  getOverallRiskColor(): string {
    const level = this.getOverallRiskLevel();
    switch (level) {
      case 'ALTO': return '#dc3545';
      case 'MEDIO': return '#fd7e14';
      case 'BAJO': return '#ffc107';
      default: return '#28a745';
    }
  }

  exportResults() {
    if (!this.originalityResults) return;

    const csvContent = this.generateCSVContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `originality_analysis_${this.assignmentId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSVContent(): string {
    if (!this.originalityResults) return '';

    const headers = ['Equipo 1', 'Equipo 2', 'Similitud (%)', 'Nivel de Riesgo', 'URL Repositorio 1', 'URL Repositorio 2'];
    const rows = this.originalityResults.comparisons.map(comparison => [
      this.getTeamName(comparison.submissionId1),
      this.getTeamName(comparison.submissionId2),
      comparison.similarity.toFixed(1),
      this.getSimilarityLevel(comparison.similarity),
      this.getRepositoryUrl(comparison.submissionId1),
      this.getRepositoryUrl(comparison.submissionId2)
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}
