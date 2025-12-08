import React, { useState } from 'react'
import ApiService from '../services/api'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    email: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setErrors({})
      setSuccess('')
      
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      }
      
      const response = await ApiService.registerUser(userData)
      
      if (response.message === 'User registered successfully') {
        setSuccess('Account created successfully! You can now login.')
        setFormData({ name: '', password: '', email: '', phone: '' })
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      }
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4'>
      <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>Create Account</h1>
          <p className='text-gray-600'>Join us today! Fill in your details</p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {errors.general}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          {/* Name */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Name</label>
            <input 
              className='w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none'
              type="text" 
              name="name"
              placeholder='Enter your full name'
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          {/* Email */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Email</label>
            <input 
              className='w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none'
              type="email" 
              name="email"
              placeholder='Enter your email'
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Phone Number */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Phone Number</label>
            <input 
              className='w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none'
              type="tel" 
              name="phone"
              placeholder='Enter your phone number'
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className='space-y-2'>
            <label className='text-sm font-medium text-gray-700'>Password</label>
            <input 
              className='w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none'
              type="password" 
              name="password"
              placeholder='Create a password'
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Submit Button */}
          <button 
            className='w-full bg-purple-600 text-white rounded-xl p-3 font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl mt-4 disabled:opacity-50'
            type='submit'
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Login Link */}
          <div className='text-center mt-4'>
            <p className='text-gray-600'>
              Already have an account?{' '}
              <a href="/login" className='text-blue-500 hover:text-blue-700 font-semibold transition-colors duration-200'>
                Sign In
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}