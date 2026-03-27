import { Routes } from '@angular/router';
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
        loadComponent: () =>
          import('./features/dashboard/presentation/pages/dashboard-page.component').then(
            (module) => module.DashboardPageComponent,
          ),
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./features/teams/presentation/pages/teams-page.component').then(
            (module) => module.TeamsPageComponent,
          ),
      },
      {
        path: 'players',
        loadComponent: () =>
          import('./features/players/presentation/pages/players-page.component').then(
            (module) => module.PlayersPageComponent,
          ),
      },
      {
        path: 'referees',
        loadComponent: () =>
          import('./features/referees/presentation/pages/referees-page.component').then(
            (module) => module.RefereesPageComponent,
          ),
      },
      {
        path: 'matches',
        loadComponent: () =>
          import('./features/matches/presentation/pages/matches-page.component').then(
            (module) => module.MatchesPageComponent,
          ),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./features/tournaments/presentation/pages/tournaments-page.component').then(
            (module) => module.TournamentsPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
