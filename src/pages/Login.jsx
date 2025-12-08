import React, { useState } from 'react'
import ApiService from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Email is required'
    if (!form.password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    try {
      setLoading(true)
      setErrors({})
      
      const credentials = {
        emailorphone: form.email,
        password: form.password
      }
      
      const response = await ApiService.loginUser(credentials)
      
      if (response.message === 'Login successful') {
        login(response.user, response.jio_token)
        // Redirect based on user role
        if (response.user.role === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/'
        }
      }
    } catch (error) {
      setErrors({ general: error.message || 'Login failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue</p>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4"> 
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <a href="#" className="text-sm text-purple-600 hover:text-purple-700">Forgot?</a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="rounded text-purple-600 focus:ring-purple-500"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account? <a href="/ragister" className="text-purple-600 hover:text-purple-700 font-medium">Create one</a>
        </p>
      </div>
    </div>
  )
}


