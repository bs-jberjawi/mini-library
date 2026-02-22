import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'books',
    loadComponent: () => import('./pages/books/book-list.component').then(m => m.BookListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/books/book-detail.component').then(m => m.BookDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-checkouts',
    loadComponent: () => import('./pages/my-checkouts/my-checkouts.component').then(m => m.MyCheckoutsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'manage-users',
    loadComponent: () => import('./pages/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
