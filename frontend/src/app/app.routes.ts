import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/presentation/pages/dashboard-page.component';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        component: DashboardPageComponent,
      },
      {
        path: 'teams',
        component: DashboardPageComponent,
      },
      {
        path: 'players',
        component: DashboardPageComponent,
      },
      {
        path: 'referees',
        component: DashboardPageComponent,
      },
      {
        path: 'tournaments',
        component: DashboardPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
