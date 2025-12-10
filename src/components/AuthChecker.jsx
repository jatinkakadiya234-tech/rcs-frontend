import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { isTokenExpired } from '../utils/cookieUtils'

const AuthChecker = () => {
  const { logout, isAuthenticated } = useAuth()

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated() && isTokenExpired()) {
        logout()
      }
    }

    // Check immediately
    checkAuth()

    // Check every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [logout, isAuthenticated])

  return null
}

export default AuthChecker