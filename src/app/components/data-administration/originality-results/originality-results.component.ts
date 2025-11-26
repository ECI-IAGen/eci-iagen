import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

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
  similarity: number; // Valor entre 0 y 1 que viene del backend
  comparisonHtmlUrl?: string; // URL del HTML de comparación individual
  submission1?: string; // Nombre de la primera submission
  submission2?: string; // Nombre de la segunda submission
  team1?: string; // Nombre del primer equipo
  team2?: string; // Nombre del segundo equipo
  matchedTokens?: number; // Número de tokens coincidentes
  status?: string; // Estado de la comparación
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
  reportUrl: string | null = null;
  showReportModal = false;
  reportHtmlContent: string = '';

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
      next: (response: any) => {
        console.log('Originality analysis response:', response);
        this.originalityResults = response;
        
        // Compatibilidad: si viene "similarities" en lugar de "comparisons", mapearla
        if (response.similarities && !response.comparisons) {
          response.comparisons = response.similarities;
          this.originalityResults = response;
        }
        
        this.reportUrl = response.reportUrl; // Guardar la URL del reporte
        this.loading = false;
        
        // Sort comparisons by similarity (highest first)
        if (this.originalityResults && this.originalityResults.comparisons && Array.isArray(this.originalityResults.comparisons)) {
          this.originalityResults.comparisons.sort((a, b) => b.similarity - a.similarity);
          
          // Debug: verificar si las comparaciones tienen comparisonHtmlUrl
          console.log('Comparisons with HTML URLs:');
          this.originalityResults.comparisons.forEach((comp: any, index: number) => {
            console.log(`Comparison ${index}:`, {
              submissionId1: comp.submissionId1,
              submissionId2: comp.submissionId2,
              comparisonHtmlUrl: comp.comparisonHtmlUrl,
              hasHtmlUrl: !!comp.comparisonHtmlUrl
            });
          });
        }
      },
      error: (error: any) => {
        console.error('Error analyzing originality:', error);
        this.error = 'Error al analizar originalidad: ' + (error.error?.message || error.message);
        this.loading = false;
      }
    });
  }

  toggleRawJson() {
    this.showRawJson = !this.showRawJson;
  }

  // =================== MÉTODOS DE CONVERSIÓN SIMILARIDAD -> ORIGINALIDAD ===================

  /**
   * Convierte la similaridad (0-1) a porcentaje de similaridad (0-100%)
   */
  getSimilarityPercentage(similarity: number): number {
    return similarity * 100;
  }

  /**
   * Convierte la similaridad (0-1) a porcentaje de originalidad (100%-0%)
   */
  getOriginalityPercentage(similarity: number): number {
    return 100 - (similarity * 100);
  }

  /**
   * Obtiene el color basado en el porcentaje de originalidad
   * Alto originalidad = Verde, Bajo originalidad = Rojo
   */
  getOriginalityColor(similarity: number): string {
    const originalityPercentage = this.getOriginalityPercentage(similarity);
    if (originalityPercentage <= 20) return '#dc3545'; // Rojo - Baja originalidad (alta similaridad)
    if (originalityPercentage <= 40) return '#fd7e14'; // Naranja - Originalidad media-baja
    if (originalityPercentage <= 60) return '#ffc107'; // Amarillo - Originalidad media
    return '#28a745'; // Verde - Alta originalidad
  }

  /**
   * Obtiene el nivel de originalidad basado en la similaridad
   */
  getOriginalityLevel(similarity: number): string {
    const originalityPercentage = this.getOriginalityPercentage(similarity);
    if (originalityPercentage <= 20) return 'BAJA';
    if (originalityPercentage <= 40) return 'MEDIA-BAJA';
    if (originalityPercentage <= 60) return 'MEDIA';
    return 'ALTA';
  }

  /**
   * Obtiene la etiqueta de originalidad
   */
  getOriginalityLabel(similarity: number): string {
    const originalityPercentage = this.getOriginalityPercentage(similarity);
    if (originalityPercentage <= 20) return 'Baja originalidad - Posible plagio';
    if (originalityPercentage <= 40) return 'Originalidad media-baja - Revisar';
    if (originalityPercentage <= 60) return 'Originalidad media - Aceptable';
    return 'Alta originalidad - Excelente';
  }

  getSimilarityColor(similarity: number): string {
    const similarityPercentage = this.getSimilarityPercentage(similarity);
    if (similarityPercentage >= 80) return '#dc3545'; // Rojo - Alto riesgo
    if (similarityPercentage >= 60) return '#fd7e14'; // Naranja - Riesgo medio
    if (similarityPercentage >= 40) return '#ffc107'; // Amarillo - Riesgo bajo
    return '#28a745'; // Verde - Sin riesgo
  }

  getSimilarityLevel(similarity: number): string {
    const similarityPercentage = this.getSimilarityPercentage(similarity);
    if (similarityPercentage >= 80) return 'ALTO';
    if (similarityPercentage >= 60) return 'MEDIO';
    if (similarityPercentage >= 40) return 'BAJO';
    return 'MÍNIMO';
  }

  getSimilarityLabel(similarity: number): string {
    const similarityPercentage = this.getSimilarityPercentage(similarity);
    if (similarityPercentage >= 80) return 'Alto riesgo de plagio';
    if (similarityPercentage >= 60) return 'Riesgo medio de plagio';
    if (similarityPercentage >= 40) return 'Riesgo bajo de plagio';
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
    if (!this.originalityResults?.comparisons || !Array.isArray(this.originalityResults.comparisons)) {
      return { high: 0, medium: 0, low: 0, minimal: 0 };
    }

    return this.originalityResults.comparisons.reduce((acc, comparison) => {
      const similarityPercentage = this.getSimilarityPercentage(comparison.similarity);
      if (similarityPercentage >= 80) acc.high++;
      else if (similarityPercentage >= 60) acc.medium++;
      else if (similarityPercentage >= 40) acc.low++;
      else acc.minimal++;
      return acc;
    }, { high: 0, medium: 0, low: 0, minimal: 0 });
  }

  getOverallRiskLevel(): string {
    const summary = this.getRiskSummary();
    if (summary.high > 0) return 'BAJA'; // Alta similitud = Baja originalidad
    if (summary.medium > 0) return 'MEDIA';
    if (summary.low > 0) return 'ACEPTABLE';
    return 'ALTA'; // Baja similitud = Alta originalidad
  }

  getOverallRiskColor(): string {
    const level = this.getOverallRiskLevel();
    switch (level) {
      case 'BAJA': return '#dc3545'; // Rojo para baja originalidad
      case 'MEDIA': return '#fd7e14'; // Naranja para media originalidad
      case 'ACEPTABLE': return '#ffc107'; // Amarillo para originalidad aceptable
      default: return '#28a745'; // Verde para alta originalidad
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
    if (!this.originalityResults || !this.originalityResults.comparisons || !Array.isArray(this.originalityResults.comparisons)) return '';

    const headers = ['Equipo 1', 'Equipo 2', 'Similaridad (%)', 'Originalidad (%)', 'Nivel de Riesgo', 'URL Repositorio 1', 'URL Repositorio 2'];
    const rows = this.originalityResults.comparisons.map(comparison => [
      this.getTeamName(comparison.submissionId1),
      this.getTeamName(comparison.submissionId2),
      this.getSimilarityPercentage(comparison.similarity).toFixed(1),
      this.getOriginalityPercentage(comparison.similarity).toFixed(1),
      this.getSimilarityLevel(comparison.similarity),
      this.getRepositoryUrl(comparison.submissionId1),
      this.getRepositoryUrl(comparison.submissionId2)
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  // =================== MÉTODOS PARA REPORTES HTML ===================

  /**
   * Abre el reporte HTML en una nueva ventana
   */
  openReportInNewWindow() {
    if (!this.reportUrl) {
      console.error('No report URL available');
      return;
    }

    const sessionId = this.apiService.extractSessionIdFromReportUrl(this.reportUrl);
    if (sessionId) {
      const reportWindow = window.open(
        this.apiService.getPlagiarismReportUrl(sessionId),
        '_blank',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );
      
      if (!reportWindow) {
        alert('Por favor, habilita las ventanas emergentes para ver el reporte completo.');
      }
    }
  }

  /**
   * Muestra el reporte HTML en un modal
   */
  async showReport() {
    if (!this.reportUrl) {
      console.error('No report URL available');
      return;
    }

    const sessionId = this.apiService.extractSessionIdFromReportUrl(this.reportUrl);
    if (!sessionId) {
      console.error('Could not extract session ID from report URL');
      return;
    }

    try {
      // Verificar que el reporte existe
      const reportExists = await this.apiService.checkPlagiarismReportExists(sessionId).toPromise();
      if (!reportExists) {
        this.error = 'El reporte no está disponible o ha expirado.';
        return;
      }

      // Obtener el contenido HTML
      this.reportHtmlContent = await this.apiService.getPlagiarismReportHtml(sessionId).toPromise() || '';
      this.showReportModal = true;
    } catch (error) {
      console.error('Error loading report:', error);
      this.error = 'Error al cargar el reporte detallado.';
    }
  }

  /**
   * Cierra el modal del reporte
   */
  closeReportModal() {
    this.showReportModal = false;
    this.reportHtmlContent = '';
  }

  /**
   * Verifica si hay un reporte disponible
   */
  hasReport(): boolean {
    return !!this.reportUrl;
  }

  /**
   * Abre el HTML de comparación individual en una nueva ventana
   */
  openComparisonHtml(comparison: any) {
    console.log('Opening comparison HTML for:', comparison);
    
    if (!comparison.comparisonHtmlUrl) {
      alert('Análisis detallado no disponible para esta comparación.');
      console.warn('No comparisonHtmlUrl found in comparison:', comparison);
      return;
    }

    // Usar el servicio API para obtener la URL correcta del API Gateway
    this.apiService.openComparisonHtml(comparison.comparisonHtmlUrl);
  }

  /**
   * Método temporal para debugging - mostrar información de comparaciones
   */
  debugComparisons() {
    console.log('=== DEBUG COMPARISONS ===');
    console.log('originalityResults:', this.originalityResults);
    if (this.originalityResults?.comparisons) {
      this.originalityResults.comparisons.forEach((comp: any, index: number) => {
        console.log(`Comparison ${index}:`, comp);
      });
    }
  }
}