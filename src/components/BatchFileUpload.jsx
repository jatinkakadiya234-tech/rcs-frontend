import React, { useState } from 'react'
import { FiUpload, FiFile, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

const BatchFileUpload = ({ onNumbersLoaded, maxNumbers = 10000 }) => {
  const [loading, setLoading] = useState(false)
  const [fileInfo, setFileInfo] = useState(null)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setFileInfo({ name: file.name, size: file.size })

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const numbers = []
      const seen = new Set()
      
      lines.forEach((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed) return
        
        // Extract number (handle various formats)
        let num = trimmed.replace(/[^\d+]/g, '')
        
        // Format to +91xxxxxxxxxx
        if (num.startsWith('+91')) {
          num = num.substring(3)
        } else if (num.startsWith('91') && num.length > 10) {
          num = num.substring(2)
        } else if (num.startsWith('0')) {
          num = num.substring(1)
        }
        
        // Validate 10 digit number
        if (/^\d{10}$/.test(num)) {
          const fullNum = '+91' + num
          if (!seen.has(fullNum) && numbers.length < maxNumbers) {
            seen.add(fullNum)
            numbers.push(fullNum)
          }
        }
      })
      
      if (numbers.length === 0) {
        toast.error('No valid phone numbers found in file')
        return
      }
      
      if (numbers.length > maxNumbers) {
        toast.warning(`File contains ${numbers.length} numbers, only first ${maxNumbers} will be processed`)
      }
      
      onNumbersLoaded(numbers.slice(0, maxNumbers))
      toast.success(`📁 ${numbers.length} numbers loaded from file`)
      
    } catch (error) {
      toast.error('Error reading file: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
      <label className="cursor-pointer block">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            {loading ? (
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : fileInfo ? (
              <FiCheck className="text-blue-600 text-xl" />
            ) : (
              <FiUpload className="text-blue-600 text-xl" />
            )}
          </div>
          
          <p className="text-sm font-medium text-gray-700 mb-1">
            {fileInfo ? 'File Loaded' : 'Upload Numbers File'}
          </p>
          
          {fileInfo ? (
            <div className="text-xs text-gray-500">
              <p>{fileInfo.name}</p>
              <p>{(fileInfo.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Supports .txt, .csv files with phone numbers
            </p>
          )}
        </div>
        
        <input
          type="file"
          accept=".txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
          disabled={loading}
        />
      </label>
      
      {loading && (
        <div className="mt-2 text-center">
          <p className="text-xs text-blue-600">Processing file...</p>
        </div>
      )}
    </div>
  )
}

export default BatchFileUpload