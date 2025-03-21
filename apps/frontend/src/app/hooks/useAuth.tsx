import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { User } from "@juniorhub/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setUser: (user: User) => void;
  getAuthHeaders: () => { Authorization: string } | Record<string, never>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Helper function to normalize user object from API responses
const normalizeUser = (userData: any): User => {
  if (!userData) return userData;

  // Create a new object with the necessary properties
  return {
    // If _id exists but id doesn't, use _id as id
    id: userData.id || userData._id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    profilePicture: userData.profilePicture,
    bio: userData.bio,
    skills: userData.skills,
    projects: userData.projects,
    applications: userData.applications,
    portfolio: userData.portfolio,
    experienceLevel: userData.experienceLevel,
    createdAt: userData.createdAt,
    updatedAt: userData.updatedAt,
    // Include any other needed properties
    ...(userData.accessToken && { accessToken: userData.accessToken }),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (token) {
        try {
          // Set default Authorization header for all requests
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

          // Get current user
          const response = await axios.get(`${API_URL}/auth/me`);

          if (response.data.success) {
            setUser(normalizeUser(response.data.data.user));
          } else {
            // If token is invalid, clear it
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            delete axios.defaults.headers.common["Authorization"];
          }
        } catch (err) {
          // If token is expired, try to refresh it
          const refreshToken = localStorage.getItem("refreshToken");

          if (refreshToken) {
            try {
              const refreshResponse = await axios.post(
                `${API_URL}/auth/refresh-token`,
                {
                  refreshToken,
                }
              );

              if (refreshResponse.data.success) {
                const { accessToken, refreshToken: newRefreshToken } =
                  refreshResponse.data.data.tokens;

                // Update tokens
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                // Set default Authorization header
                axios.defaults.headers.common[
                  "Authorization"
                ] = `Bearer ${accessToken}`;

                // Get current user
                const userResponse = await axios.get(`${API_URL}/auth/me`);

                if (userResponse.data.success) {
                  setUser(normalizeUser(userResponse.data.data.user));
                }
              } else {
                // If refresh token is invalid, clear tokens
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                delete axios.defaults.headers.common["Authorization"];
              }
            } catch (refreshErr) {
              // If refresh fails, clear tokens
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              delete axios.defaults.headers.common["Authorization"];
            }
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Get authentication headers for API requests
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Save tokens
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        // Set default Authorization header
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${tokens.accessToken}`;

        // Set user
        setUser(normalizeUser(user));
      } else {
        setError(response.data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Save tokens
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        // Set default Authorization header
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${tokens.accessToken}`;

        // Set user
        setUser(normalizeUser(user));
      } else {
        setError(response.data.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Google login function
  const googleLogin = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token,
      });

      if (response.data.success) {
        const { user, tokens } = response.data.data;

        // Save tokens
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);

        // Set default Authorization header
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${tokens.accessToken}`;

        // Set user
        setUser(normalizeUser(user));
      } else {
        setError(response.data.error || "Google login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Google login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      // Ignore errors on logout
    } finally {
      // Clear tokens and user
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    error,
    setUser,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
