import { Injectable, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Profile } from '../models/interfaces';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  private _session = signal<Session | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  session = this._session.asReadonly();
  profile = this._profile.asReadonly();
  loading = this._loading.asReadonly();

  user = computed(() => this._session()?.user ?? null);
  isAuthenticated = computed(() => !!this._session());
  userRole = computed(() => this._profile()?.role ?? 'member');
  isAdmin = computed(() => this._profile()?.role === 'admin');
  isLibrarian = computed(() => this._profile()?.role === 'librarian');
  canManageBooks = computed(() => {
    const role = this._profile()?.role;
    return role === 'admin' || role === 'librarian';
  });

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.init();
  }

  private async init() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this._session.set(session);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      }
    } finally {
      this._loading.set(false);
    }

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      this._session.set(session);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this._profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      this._profile.set(data as Profile);
    }
  }

  async signInWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this._session.set(null);
    this._profile.set(null);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
