import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal(false);
  isDark = this._isDark.asReadonly();

  constructor() {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      this._isDark.set(true);
      this.applyTheme(true);
    } else if (stored === null) {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this._isDark.set(prefersDark);
      this.applyTheme(prefersDark);
    }
  }

  toggle() {
    const newValue = !this._isDark();
    this._isDark.set(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    this.applyTheme(newValue);
  }

  private applyTheme(isDark: boolean) {
    document.body.style.colorScheme = isDark ? 'dark' : 'light';
  }
}
