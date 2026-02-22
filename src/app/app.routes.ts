import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'books',
        loadComponent: () => import('./pages/books/book-list.component').then(m => m.BookListComponent),
      },
      {
        path: 'books/:id',
        loadComponent: () => import('./pages/books/book-detail.component').then(m => m.BookDetailComponent),
      },
      {
        path: 'my-checkouts',
        loadComponent: () => import('./pages/my-checkouts/my-checkouts.component').then(m => m.MyCheckoutsComponent),
      },
      {
        path: 'manage-users',
        loadComponent: () => import('./pages/manage-users/manage-users.component').then(m => m.ManageUsersComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
