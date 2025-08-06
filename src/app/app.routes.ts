import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DataAdministrationComponent } from './components/data-administration/data-administration.component';
import { ExcelImportComponent } from './components/excel-import/excel-import.component';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'data-administration', component: DataAdministrationComponent },
  { path: 'excel-import', component: ExcelImportComponent },
  { path: 'chat', component: ChatComponent },
  { path: '**', redirectTo: '' }
];