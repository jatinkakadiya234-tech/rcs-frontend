import React, { createContext, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout as logoutAction, getProfile } from '../redux/slices/authSlice.js'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch()
  const { user, token, isAuthenticated, loading } = useSelector(state => state.auth)

  const login = (userData, token) => {
    // Login is handled by Redux thunks
  }

  const logout = () => {
    dispatch(logoutAction())
    toast.success('Logged out successfully')
    setTimeout(() => {
      window.location.href = '/login'
    }, 500)
  }

  const refreshUser = async () => {
    if (user?._id) {
      dispatch(getProfile())
    }
  }

  const isAuthenticatedCheck = () => {
    return isAuthenticated
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshUser,
      isAuthenticated: isAuthenticatedCheck,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}