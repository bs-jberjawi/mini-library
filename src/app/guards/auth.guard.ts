import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

function waitForLoad(supabase: SupabaseService): Promise<void> {
  return new Promise(resolve => {
    if (!supabase.loading()) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (!supabase.loading()) {
        clearInterval(interval);
        resolve();
      }
    }, 50);
  });
}

export const authGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await waitForLoad(supabase);

  if (supabase.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await waitForLoad(supabase);

  if (supabase.canManageBooks()) {
    return true;
  }

  router.navigate(['/']);
  return false;
};
