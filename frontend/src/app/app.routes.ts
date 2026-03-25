import { Routes } from '@angular/router';
import { DashboardPageComponent } from './features/dashboard/presentation/pages/dashboard-page.component';
import { MatchesPageComponent } from './features/matches/presentation/pages/matches-page.component';
import { PlayersPageComponent } from './features/players/presentation/pages/players-page.component';
import { RefereesPageComponent } from './features/referees/presentation/pages/referees-page.component';
import { TeamsPageComponent } from './features/teams/presentation/pages/teams-page.component';
import { TournamentsPageComponent } from './features/tournaments/presentation/pages/tournaments-page.component';
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
        component: TeamsPageComponent,
      },
      {
        path: 'players',
        component: PlayersPageComponent,
      },
      {
        path: 'referees',
        component: RefereesPageComponent,
      },
      {
        path: 'matches',
        component: MatchesPageComponent,
      },
      {
        path: 'tournaments',
        component: TournamentsPageComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
