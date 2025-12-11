import React, { useState } from 'react'
import ApiService from '../services/api'
import toast from 'react-hot-toast'
import { FiEye, FiEyeOff } from 'react-icons/fi'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const validate = () => {
    const next = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    
    if (!formData.name.trim()) {
      next.name = 'Name is required'
    } else if (formData.name.trim().length < 3) {
      next.name = 'Name must be at least 3 characters'
    }
    
    if (!formData.email.trim()) {
      next.email = 'Email is required'
    } else if (!emailRegex.test(formData.email)) {
      next.email = 'Invalid email format'
    }
    
    if (!formData.phone.trim()) {
      next.phone = 'Phone number is required'
    } else if (!phoneRegex.test(formData.phone)) {
      next.phone = 'Invalid phone number'
    }
    
    if (!formData.password) {
      next.password = 'Password is required'
    } else if (formData.password.length < 6) {
      next.password = 'Password must be at least 6 characters'
    }
    
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) {
      toast.error('Please fix the errors')
      return
    }
    
    try {
      setLoading(true)
      setErrors({})
      
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      }
      
      const response = await ApiService.registerUser(userData)
      
      if (response.message === 'User registered successfully') {
        toast.success('Account created successfully!')
        setFormData({ name: '', password: '', email: '', phone: '' })
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    } catch (error) {
      toast.error(error.message || 'Registration failed')
      setErrors({ general: error.message || 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-12">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600 mb-8">Join us today and get started</p>

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                {errors.general}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input 
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                  type="text" 
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input 
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                  type="email" 
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                <input 
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                  type="tel" 
                  name="phone"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input 
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
              </div>

              <button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 mt-6"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-8 text-center text-gray-600">
              Already have an account? <a href="/login" className="font-semibold text-purple-600 hover:text-purple-700">Sign In</a>
            </p>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-purple-500 to-indigo-600 p-12 flex-col justify-center items-center text-white">
          <div className="text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-sm">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
            </div>
            <h2 className="text-4xl font-bold mb-4">RCS Messaging</h2>
            <p className="text-lg text-white/90 mb-8">Start sending rich, interactive messages</p>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                <span>Rich Media Support</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                <span>Interactive Buttons</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                <span>Real-time Analytics</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">✓</div>
                <span>Carousel Messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}