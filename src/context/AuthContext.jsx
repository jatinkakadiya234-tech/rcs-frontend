import React, { createContext, useContext, useState, useEffect } from 'react'

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
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('jio_token')
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('jio_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('jio_token')
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    if (user?._id) {
      try {
        const response = await fetch(`/api/user/profile/${user._id}`)
        const data = await response.json()
        if (data.success) {
          const updatedUser = data.user
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
      } catch (error) {
        console.error('Error refreshing user:', error)
      }
    }
  }

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('jio_token')
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