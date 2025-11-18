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
  login: (credentials: LoginRequest) => Promise<boolean>;
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
      login: async (credentials: LoginRequest): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Login failed'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      register: async (userData: RegisterRequest): Promise<boolean> => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.register(userData);
          
          if (response.success && response.data) {
            const { user, accessToken, refreshToken } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return true;
          } else {
            set({
              isLoading: false,
              error: response.message || 'Registration failed'
            });
            return false;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({
            isLoading: false,
            error: errorMessage
          });
          return false;
        }
      },

      logout: async (): Promise<void> => {
        try {
          const { refreshToken } = get();
          
          if (refreshToken) {
            await authService.logout(refreshToken);
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
        }
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