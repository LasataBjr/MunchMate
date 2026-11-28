import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  login as loginRequest,
  register as registerRequest,
  getCurrentUser,
  logout as logoutRequest,
} from "../../services/api/auth.api";

import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from "../../types/auth.types";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check the existing login session when the app starts.
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await getCurrentUser();
        setUser(response.user);
      } catch {
        // No valid session exists.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  async function login(input: LoginInput): Promise<AuthUser> {
    await loginRequest(input);

    // Ask the backend to verify the newly created session.
    const response = await getCurrentUser();

    setUser(response.user);

    return response.user;
  }
  
  async function register(input: RegisterInput): Promise<AuthUser> {
    await registerRequest(input);

    // Registration creates a login session, so retrieve the authenticated user.
    const response = await getCurrentUser();

    setUser(response.user);

    return response.user;
  }

  async function logout(): Promise<void> {
    try {
      await logoutRequest();
    } finally {
      // Clear local authentication state even if the request fails.
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for accessing authentication.
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}