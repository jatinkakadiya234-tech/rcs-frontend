import React, { useEffect, Suspense } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice.js'
import { Navigate } from 'react-router-dom'

const AppRoute = ({ children, allowedRoles, requiresAuth = true }) => {
  const dispatch = useDispatch()
  const { user, isAuthenticated, loading } = useSelector(state => state.auth)

  console.log('AppRoute state:', { user, isAuthenticated, loading, allowedRoles, userRole: user?.role })

  useEffect(() => {
    if (!isAuthenticated && requiresAuth) {
      dispatch(logout())
    }
  }, [dispatch, isAuthenticated, requiresAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Public routes
  if (!requiresAuth) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }>
        {children}
      </Suspense>
    )
  }

  // Protected routes
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Role-based access - case insensitive comparison
  if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === user?.role?.toLowerCase())) {
    console.log('Role mismatch:', { userRole: user?.role, allowedRoles })
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/'} replace />
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      {children}
    </Suspense>
  )
}

export default AppRoute