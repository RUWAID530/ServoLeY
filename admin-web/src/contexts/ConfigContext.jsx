import React, { createContext, useContext, useReducer, useEffect } from 'react'

const ConfigContext = createContext()

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'SET_API_URL':
          return { ...state, apiUrl: action.payload }
        case 'SET_LOADING':
          return { ...state, loading: action.payload }
        default:
          return state
      }
    },
    {
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
      loading: false
    }
  )

  return (
    <ConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export default ConfigContext
