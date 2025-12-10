import React, { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { isTokenExpired } from '../utils/cookieUtils'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, logout } = useAuth()

  useEffect(() => {
    if (isTokenExpired()) {
      logout()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!isAuthenticated()) {
    window.location.href = '/login'
    return null
  }

  return children
}

export default ProtectedRoute