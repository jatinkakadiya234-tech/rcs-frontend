import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice.js'

const AuthChecker = () => {
  const dispatch = useDispatch()
  const { token, isAuthenticated } = useSelector(state => state.auth)

  useEffect(() => {
    const checkAuth = () => {
      if (!token || !isAuthenticated) {
        dispatch(logout())
      }
    }

    // Check immediately
    checkAuth()

    // Check every 5 minutes
    const interval = setInterval(checkAuth, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [dispatch, token, isAuthenticated])

  return null
}

export default AuthChecker