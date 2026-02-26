import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: any | null
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: localStorage.getItem('token'),
    user: null
  })

  // ... rest of your auth logic ...

  return {
    ...authState,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading
  }
}
