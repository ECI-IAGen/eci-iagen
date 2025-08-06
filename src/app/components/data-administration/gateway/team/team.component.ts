import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../services/api.service';

declare var bootstrap: any;

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  loading = false;
  teams: any[] = [];
  users: any[] = [];
  
  // Toast
  toastMessage = '';
  toastClass = '';

  // Modal state
  showCreateModal = false;
  showEditModal = false;
  showViewModal = false;
  selectedTeam: any = null;
  
  // Form data
  teamForm = {
    name: '',
    userIds: [] as number[]
  };

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.loadTeams();
    this.loadUsers();
  }

  async loadTeams() {
    try {
      this.loading = true;
      this.teams = await this.apiService.getTeams().toPromise() || [];
      console.log('Equipos cargados:', this.teams.length);
    } catch (error) {
      console.error('Error cargando equipos:', error);
      this.showNotification('Error al cargar equipos: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  async loadUsers() {
    try {
      if (this.users.length === 0) {
        this.users = await this.apiService.getUsers().toPromise() || [];
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      this.showNotification('Error al cargar usuarios', 'error');
    }
  }

  showNotification(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastClass = type === 'error' ? 'bg-danger' : 'bg-success';

    // Mostrar toast usando Bootstrap
    setTimeout(() => {
      const toastElement = document.getElementById('team-notification-toast');
      if (toastElement) {
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
      }
    }, 100);
  }

  // Utilidades para el template
  trackByTeamId(index: number, team: any): number {
    return team.id;
  }

  getMemberCount(team: any): number {
    // Usar userIds o users para contar los miembros, según el formato del backend
    if (team.userIds) {
      return team.userIds.length;
    } else if (team.users) {
      return team.users.length;
    }
    return 0;
  }

  getMemberNames(team: any): string {
    // Usar userNames o users para obtener los nombres, según el formato del backend
    if (team.userNames) {
      return team.userNames.join(', ');
    } else if (team.users) {
      return team.users.map((u: any) => u.name).join(', ');
    }
    return 'Sin miembros';
  }

  // Métodos para gestión de equipos
  async viewTeam(team: any) {
    try {
      this.selectedTeam = await this.apiService.getTeamById(team.id).toPromise();
      this.showViewModal = true;
    } catch (error) {
      console.error('Error cargando detalles del equipo:', error);
      this.showNotification('Error al cargar detalles del equipo: ' + (error as Error).message, 'error');
    }
  }

  async openCreateTeamModal() {
    await this.loadUsers();
    this.resetForm();
    this.showCreateModal = true;
  }

  async openEditTeamModal(team: any) {
    try {
      await this.loadUsers();
      this.selectedTeam = await this.apiService.getTeamById(team.id).toPromise();
      
      // Poblar el formulario con los datos del equipo
      const teamUserIds = this.selectedTeam.users ? 
        this.selectedTeam.users.map((u: any) => u.id) : [];
      
      this.teamForm = {
        name: this.selectedTeam.name || '',
        userIds: teamUserIds
      };
      
      this.showEditModal = true;
    } catch (error) {
      console.error('Error cargando datos del equipo:', error);
      this.showNotification('Error al cargar datos del equipo: ' + (error as Error).message, 'error');
    }
  }

  async createTeam() {
    try {
      const teamData = {
        name: this.teamForm.name,
        userIds: this.teamForm.userIds
      };

      await this.apiService.createTeam(teamData).toPromise();
      this.showCreateModal = false;
      this.showNotification('Equipo creado exitosamente');
      this.loadTeams();
      this.resetForm();
    } catch (error) {
      console.error('Error creando equipo:', error);
      this.showNotification('Error al crear equipo: ' + (error as Error).message, 'error');
    }
  }

  async updateTeam() {
    try {
      const teamData = {
        name: this.teamForm.name,
        userIds: this.teamForm.userIds
      };

      await this.apiService.updateTeam(this.selectedTeam.id, teamData).toPromise();
      this.showEditModal = false;
      this.showNotification('Equipo actualizado exitosamente');
      this.loadTeams();
      this.resetForm();
    } catch (error) {
      console.error('Error actualizando equipo:', error);
      this.showNotification('Error al actualizar equipo: ' + (error as Error).message, 'error');
    }
  }

  async confirmDeleteTeam(team: any) {
    if (confirm('¿Está seguro de que desea eliminar este equipo?')) {
      try {
        await this.apiService.deleteTeam(team.id).toPromise();
        this.showNotification('Equipo eliminado exitosamente');
        this.loadTeams();
      } catch (error) {
        console.error('Error eliminando equipo:', error);
        this.showNotification('Error al eliminar equipo: ' + (error as Error).message, 'error');
      }
    }
  }

  resetForm() {
    this.teamForm = {
      name: '',
      userIds: []
    };
    this.selectedTeam = null;
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showViewModal = false;
    this.resetForm();
  }

  onUserSelectionChange(event: Event, userId: number) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.teamForm.userIds.includes(userId)) {
        this.teamForm.userIds.push(userId);
      }
    } else {
      this.teamForm.userIds = this.teamForm.userIds.filter(id => id !== userId);
    }
  }

  isUserSelected(userId: number): boolean {
    return this.teamForm.userIds.includes(userId);
  }
}
