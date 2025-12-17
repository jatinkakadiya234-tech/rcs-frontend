import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import ApiService from '../services/api'

export default function CreateCampaign() {
  const [numbers, setNumbers] = useState([])
  const [newNumber, setNewNumber] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [message, setMessage] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)

  // Format phone number with +91 if needed
  const formatPhoneNumber = (number) => {
    const cleanNum = number.replace(/[^\d+]/g, '')
    if (cleanNum.startsWith('+91')) {
      return cleanNum
    }
    if (cleanNum.startsWith('91') && cleanNum.length === 12) {
      return '+' + cleanNum
    }
    if (cleanNum.length === 10 && !cleanNum.startsWith('+')) {
      return '+91' + cleanNum
    }
    return cleanNum
  }

  // Check number capabilities using API
  const checkNumberCapabilities = async (phoneNumbers) => {
    try {
      setIsChecking(true)
      const response = await ApiService.checkNumberAvailability(phoneNumbers)
      return response
    } catch (error) {
      console.error('Error checking number capabilities:', error)
      toast.error('Failed to check number capabilities: ' + error.message)
      return null
    } finally {
      setIsChecking(false)
    }
  }

  // Add number with capability check
  const addNumber = async () => {
    if (!newNumber.trim()) {
      toast.error('Please enter a phone number')
      return
    }

    const formattedNumber = formatPhoneNumber(newNumber.trim())
    
    // Check if number already exists
    if (numbers.includes(formattedNumber)) {
      toast.error('Number already exists')
      setNewNumber('')
      return
    }

    // Check number capabilities
    const capabilityResult = await checkNumberCapabilities([formattedNumber])
    
    if (capabilityResult) {
      // Add number if capability check passes
      setNumbers(prev => [...prev, formattedNumber])
      setNewNumber('')
      toast.success('Number added successfully!')
    }
  }

  // Import numbers from Excel with capability check
  const importFromExcel = async (file) => {
    try {
      setIsChecking(true)
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'array' })
          const numbersSet = new Set()

          workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName]
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

            rows.forEach((row) => {
              row.forEach((cell) => {
                if (cell == null) return
                const text = String(cell).trim()
                const matches = text.match(/(\+?\d{1,3}[-.\ ]?)?\(?\d{1,4}\)?[-.\ ]?\d{1,4}[-.\ ]?\d{1,9}/g)
                
                if (matches) {
                  matches.forEach((m) => {
                    const cleanNum = m.replace(/[^\d+]/g, '')
                    if (cleanNum.length >= 7 && cleanNum.length <= 15) {
                      numbersSet.add(formatPhoneNumber(cleanNum))
                    }
                  })
                }
              })
            })
          })

          const extractedNumbers = Array.from(numbersSet)
          
          if (extractedNumbers.length > 0) {
            // Check capabilities for all numbers
            const capabilityResult = await checkNumberCapabilities(extractedNumbers)
            
            if (capabilityResult) {
              // Filter out existing numbers
              const newNumbers = extractedNumbers.filter(num => !numbers.includes(num))
              setNumbers(prev => [...prev, ...newNumbers])
              toast.success(`${newNumbers.length} numbers imported successfully!`)
            }
          } else {
            toast.error('No valid phone numbers found in the file')
          }
        } catch (error) {
          console.error('Error processing Excel file:', error)
          toast.error('Error processing Excel file')
        } finally {
          setIsChecking(false)
        }
      }
      
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error reading file:', error)
      toast.error('Error reading file')
      setIsChecking(false)
    }
  }

  // Remove number from list
  const removeNumber = (index) => {
    setNumbers(prev => prev.filter((_, i) => i !== index))
  }

  // Send campaign
  const sendCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error('Please enter campaign name')
      return
    }
    
    if (!message.trim()) {
      toast.error('Please enter message')
      return
    }
    
    if (numbers.length === 0) {
      toast.error('Please add at least one phone number')
      return
    }

    try {
      const campaignData = {
        campaignName,
        title: message,
        phoneNumbers: numbers
      }
      
      const response = await ApiService.sendNormalSms(campaignData)
      toast.success('Campaign sent successfully!')
      
      // Reset form
      setCampaignName('')
      setMessage('')
      setNumbers([])
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast.error('Failed to send campaign: ' + error.message)
    }
  }

  return (
    <div className="w-full mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Send Message Campaign</h1>
        
        {/* Campaign Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Enter campaign name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Media Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                setMediaFile(file)
                setMediaPreview(URL.createObjectURL(file))
              }
            }}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
          >
            Choose Image
          </label>
          {mediaFile && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">📎 {mediaFile.name}</p>
              {mediaPreview && (
                <img src={mediaPreview} alt="Preview" className="mt-2 max-w-xs rounded-lg border border-gray-300" />
              )}
            </div>
          )}
        </div>

        {/* Add Number Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Phone Numbers
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter phone number (e.g., 9876543210)"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={addNumber}
              disabled={isChecking}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : 'Add'}
            </button>
          </div>
          
          {/* Excel Import */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Import from Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files[0]
                if (file) {
                  importFromExcel(file)
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Numbers List */}
        {numbers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Added Numbers ({numbers.length})
            </h3>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
              {numbers.map((number, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                  <span className="font-mono text-sm">{number}</span>
                  <button
                    onClick={() => removeNumber(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Button */}
        <div className="flex justify-end">
          <button
            onClick={sendCampaign}
            disabled={isChecking}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
          >
            {isChecking ? 'Processing...' : 'Send Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}