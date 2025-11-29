import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginRequest, RegisterRequest, AuthUser } from '../../../shared/src/types/auth';
import { authService } from '../services/authService';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: AuthUser) => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
        try {
          set({ isLoading: true, error: null });

          console.log('[AuthStore] Attempting login with:', credentials.identifier);
          const response = await authService.login(credentials);
          console.log('[AuthStore] Login response:', response);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            console.log('[AuthStore] Login successful, setting auth state');
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return { success: true, user };
          } else {
            console.log('[AuthStore] Login failed:', response.message);
            const errorMsg = response.message || 'Login failed';
            set({
              isLoading: false,
              error: errorMsg
            });
            return { success: false, error: errorMsg };
          }
        } catch (error) {
          console.error('[AuthStore] Login error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      register: async (userData: RegisterRequest): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          console.log('[AuthStore] Attempting registration with:', userData.email);
          const response = await authService.register(userData);
          console.log('[AuthStore] Registration response:', response);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            console.log('[AuthStore] Registration successful, setting auth state');
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            console.log('[AuthStore] Auth state set, isAuthenticated should now be true');
            return true;
          } else {
            console.log('[AuthStore] Registration failed:', response.message);
            console.log('[AuthStore] Validation errors:', response.errors);
            
            // Format validation errors for display
            let errorMessage = response.message || 'Registration failed';
            if (response.errors && Array.isArray(response.errors)) {
              const errorDetails = response.errors.map((err: any) => 
                `${err.field}: ${err.message}`
              ).join(', ');
              errorMessage = `${errorMessage} - ${errorDetails}`;
            }
            
            set({
              isLoading: false,
              error: errorMessage
            });
            return false;
          }
        } catch (error) {
          console.error('[AuthStore] Registration error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        console.log('[AuthStore] Logging out...');
        
        // Clear state FIRST before making API call
        const currentRefreshToken = get().refreshToken;
        
        // Immediately clear local state and storage
        localStorage.removeItem('wakili-auth-storage');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null
        });
        
        console.log('[AuthStore] State cleared');
        
        // Try to notify backend (but don't wait or care if it fails)
        try {
          if (currentRefreshToken) {
            await authService.logout(currentRefreshToken).catch(() => {
              // Ignore errors - we're already logged out locally
            });
          }
        } catch (error) {
          // Ignore - logout is already complete locally
        }
        
        console.log('[AuthStore] Logout complete');
      },

      refreshAuth: async (): Promise<boolean> => {
        try {
          const { refreshToken } = get();
          
          if (!refreshToken) {
            return false;
          }

          const response = await authService.refreshToken(refreshToken);
          
          if (response.success && response.data) {
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
            
            set({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken
            });

            return true;
          } else {
            // Refresh failed, logout user
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('Token refresh error:', error);
          get().logout();
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: AuthUser) => {
        set({ user });
      },

      updateProfile: (updates: Partial<AuthUser>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates }
          });
        }
      },

      changePassword: async (currentPassword: string, newPassword: string): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });
          const response = await authService.changePassword(currentPassword, newPassword);
          if (response.success) {
            set({ isLoading: false, error: null });
            return true;
          } else {
            set({ isLoading: false, error: response.message || 'Password change failed' });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Password change failed';
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },
    }),
    {
      name: 'wakili-auth-storage',
      // Only persist specific fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      // Add version to force refresh if structure changes
      version: 1
    }
  )
);