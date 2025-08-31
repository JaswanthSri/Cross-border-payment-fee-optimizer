"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  username: string
  name: string
  country_of_residence: string
}

export interface TransferHistory {
  transfer_id: string
  amount: number
  source_country: string
  destination_country: string
  best_provider: string
  total_cost: number
  timestamp: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, name: string, countryOfResidence: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  error: string | null
  clearError: () => void
  transferHistory: TransferHistory[]
  fetchTransferHistory: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transferHistory, setTransferHistory] = useState<TransferHistory[]>([])

  // Check if user is already logged in on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    if (savedToken) {
      setToken(savedToken)
      fetchCurrentUser(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        await fetchTransferHistory(authToken)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('authToken')
        setToken(null)
        setUser(null)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
      localStorage.removeItem('authToken')
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransferHistory = async (authToken?: string) => {
    const tokenToUse = authToken || token
    if (!tokenToUse) return

    try {
      const response = await fetch('http://127.0.0.1:8000/api/transfer/history', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransferHistory(data.history)
      }
    } catch (err) {
      console.error('Error fetching transfer history:', err)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('authToken', data.access_token)
        await fetchTransferHistory(data.access_token)
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Login failed')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (username: string, password: string, name: string, countryOfResidence: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, name, country_of_residence: countryOfResidence })
      })
      
      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Registration failed')
        return false
      }
    } catch (err) {
      setError('Network error. Please try again.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setTransferHistory([])
    localStorage.removeItem('authToken')
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error,
    clearError,
    transferHistory,
    fetchTransferHistory: () => fetchTransferHistory()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 