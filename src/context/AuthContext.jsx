import React, { createContext, useContext, useState, useEffect } from 'react'
import { setCookie, getCookie, deleteCookie, isTokenExpired } from '../utils/cookieUtils'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    const token = getCookie('jio_token')
    const userData = getCookie('user_data')
    
    if (token && userData && !isTokenExpired()) {
      setUser(JSON.parse(userData))
    } else if (token) {
      logout()
    }
    setLoading(false)
  }

  const login = (userData, token) => {
    setCookie('jio_token', token, 1)
    setCookie('user_data', JSON.stringify(userData), 1)
    setCookie('login_time', new Date().getTime().toString(), 1)
    setUser(userData)
  }

  const logout = () => {
    deleteCookie('jio_token')
    deleteCookie('user_data')
    deleteCookie('login_time')
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    if (user?._id) {
      try {
        const response = await fetch(`/api/api/v1/user/profile/${user._id}`)
        const data = await response.json()
        if (data.success) {
          const updatedUser = data.user
          setCookie('user_data', JSON.stringify(updatedUser), 1)
          setUser(updatedUser)
        }
      } catch (error) {
        console.error('Error refreshing user:', error)
      }
    }
  }

  const isAuthenticated = () => {
    const token = getCookie('jio_token')
    return !!user && !!token && !isTokenExpired()
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshUser,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}