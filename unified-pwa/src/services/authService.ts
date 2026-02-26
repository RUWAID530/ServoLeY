const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8084';

type AuthResult = {
  success: boolean;
  message: string;
  data?: any;
};

const mapHttpMessage = (status: number, fallback: string) => {
  if (status === 400) return fallback || 'Please check your input and try again.';
  if (status === 401) return fallback || 'Invalid credentials or expired session.';
  if (status === 403) return fallback || 'You do not have access to this action.';
  if (status === 404) return fallback || 'Requested resource was not found.';
  if (status === 409) return fallback || 'This account already exists.';
  if (status === 429) return fallback || 'Too many attempts. Please wait and try again.';
  if (status >= 500) return 'Server error. Please try again shortly.';
  return fallback || 'Request failed. Please try again.';
};

const parseApiResponse = async (response: Response): Promise<AuthResult> => {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.ok && payload?.success) {
    return {
      success: true,
      message: payload.message || 'Success',
      data: payload.data
    };
  }

  return {
    success: false,
    message: mapHttpMessage(response.status, payload?.message || ''),
    data: payload?.data
  };
};

const storeSession = (data: any) => {
  if (!data?.accessToken || !data?.user?.id || !data?.user?.userType) return;
  localStorage.setItem('token', data.accessToken);
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('userType', data.user.userType);
};

export const hashPassword = async (password: string): Promise<string> => password;

export const authService = {
  login: async (credentials: any): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials?.email,
          phone: credentials?.phone,
          password: credentials?.password,
          userType: credentials?.userType
        })
      });

      const result = await parseApiResponse(response);
      if (result.success && result.data) {
        storeSession(result.data);
      }
      return result;
    } catch {
      return {
        success: false,
        message: 'Network error. Check your internet connection and backend URL.'
      };
    }
  },

  register: async (userData: any): Promise<AuthResult> => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await parseApiResponse(response);
      if (result.success && result.data) {
        storeSession(result.data);
      }
      return result;
    } catch {
      return {
        success: false,
        message: 'Network error. Check your internet connection and backend URL.'
      };
    }
  },

  isLoggedIn: (): boolean => {
    return Boolean(localStorage.getItem('token') && localStorage.getItem('userId') && localStorage.getItem('userType'));
  },

  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
  }
};
