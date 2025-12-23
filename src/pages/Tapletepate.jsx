import React, { useState, useEffect } from 'react'
import { FaEdit, FaTrash, FaTimes, FaPlus } from 'react-icons/fa'
import ApiService from '../services/api'
import { getMessageTypeLabel } from '../utils/messageTypes'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Tapletepate() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    text: '',
    imageUrl: ''
  })
  const [mediaFile, setMediaFile] = useState(null)
  const [messageType, setMessageType] = useState("text")
  const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }])
  const [richCard, setRichCard] = useState({ title: '', subtitle: '', imageUrl: '', actions: [] })
  const [carouselItems, setCarouselItems] = useState([{ title: '', subtitle: '', imageUrl: '', actions: [] }])
  const [carouselSuggestions, setCarouselSuggestions] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [imageCropModalOpen, setImageCropModalOpen] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [tempImageFile, setTempImageFile] = useState(null)
  const [cropCoords, setCropCoords] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [cropTarget, setCropTarget] = useState({ type: 'richCard', index: null })

  const uploadFile = async (file) => {
    try {
      const result = await ApiService.uploadFile(file)
      toast.success('File uploaded successfully')
      return result.url
    } catch (error) {
      toast.error('File upload failed: ' + error.message)
      return null
    }
  }

  const handleImageSelect = (file, target = 'richCard', index = null) => {
    if (file) {
      setCropTarget({ type: target, index })
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height })
          setCropCoords({ x: 0, y: 0, width: img.width, height: img.height })
          setTempImageFile(file)
          setImageCropModalOpen(true)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    }
  }

  const cropImage = async () => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = cropCoords.width
          canvas.height = cropCoords.height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(
            img,
            cropCoords.x,
            cropCoords.y,
            cropCoords.width,
            cropCoords.height,
            0,
            0,
            cropCoords.width,
            cropCoords.height
          )
          canvas.toBlob((blob) => {
            const croppedFile = new File([blob], tempImageFile.name, { type: 'image/jpeg' })
            resolve(croppedFile)
          }, 'image/jpeg', 0.95)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(tempImageFile)
    })
  }

  const handleCropConfirm = async () => {
    if (tempImageFile) {
      const croppedFile = await cropImage()
      const uploadedUrl = await uploadFile(croppedFile)
      if (uploadedUrl) {
        if (cropTarget.type === 'richCard') {
          setRichCard({...richCard, imageUrl: uploadedUrl, imageFile: croppedFile})
        } else if (cropTarget.type === 'carousel' && cropTarget.index !== null) {
          const newItems = [...carouselItems]
          newItems[cropTarget.index] = {
            ...newItems[cropTarget.index],
            imageUrl: uploadedUrl,
            imageFile: croppedFile
          }
          setCarouselItems(newItems)
        }
        setImageCropModalOpen(false)
        setTempImageFile(null)
      }
    }
  }

  const handleDeleteImage = (target = 'richCard', index = null) => {
    if (target === 'richCard') {
      setRichCard({...richCard, imageUrl: '', imageFile: null})
    } else if (target === 'carousel' && index !== null) {
      const newItems = [...carouselItems]
      newItems[index] = { ...newItems[index], imageUrl: '', imageFile: null }
      setCarouselItems(newItems)
    }
    setImageDimensions({ width: 0, height: 0 })
    toast.success('Image deleted')
  }

  useEffect(() => {
    if (user?._id) {
      fetchTemplates()
    }
  }, [user])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await ApiService.getUserTemplates(user?._id)
      setTemplates(response.data || [])
      
      toast.success('Templates fetched successfully')
    } catch (err) {
      toast.error('Failed to fetch templates')
      setError('Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const addAction = (target = 'main') => {
    const newAction = { type: 'reply', title: '', payload: '' }
    if (target === 'main') {
      setActions([...actions, newAction])
    } else if (target === 'richCard') {
      setRichCard({...richCard, actions: [...richCard.actions, newAction]})
    }
  }

  const removeAction = (index, target = 'main') => {
    if (target === 'main') {
      setActions(actions.filter((_, i) => i !== index))
    } else if (target === 'richCard') {
      setRichCard({...richCard, actions: richCard.actions.filter((_, i) => i !== index)})
    }
  }

  const addCarouselItem = () => {
    setCarouselItems([...carouselItems, { title: '', subtitle: '', imageUrl: '', actions: [] }])
  }

  const removeCarouselItem = (index) => {
    setCarouselItems(carouselItems.filter((_, i) => i !== index))
  }



  const handlePreview = (template) => {
    setPreviewData(template)
    setPreviewOpen(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      text: template.text || '',
      imageUrl: template.imageUrl || ''
    })
    setMessageType(template.messageType)
    setActions(template.actions || [])
    setRichCard(template.richCard || { title: '', subtitle: '', imageUrl: '', actions: [] })
    setCarouselItems(template.carouselItems || [])
    setCarouselSuggestions(template.carouselSuggestions || [])
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await ApiService.deleteTemplate(id)
        toast.success('Template deleted successfully')
        fetchTemplates()
      } catch (err) {
        toast.error('Failed to delete template')
        setError('Failed to delete template')
      }
    }
  }

  const resetForm = () => {
    setFormData({ name: '', text: '', imageUrl: '' })
    setMessageType('text')
    setActions([{ type: 'reply', title: '', payload: '' }])
    setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [] })
    setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [] }])
    setCarouselSuggestions([])
    setEditingTemplate(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Template name is required')
      setError('Template name is required')
      return
    }
    
    // Text validation only for text and text-with-action types
    if ((messageType === 'text' || messageType === 'text-with-action') && !formData.text.trim()) {
      toast.error('Template text is required')
      setError('Template text is required')
      return
    }
    
    const templateData = {
      name: formData.name.trim(),
      messageType,
      text: formData.text.trim(),
      imageUrl: formData.imageUrl.trim(),
      userId: user?._id
    }

    if (messageType === 'text-with-action') {
      templateData.actions = actions.filter(a => a.title.trim())
    } else if (messageType === 'rcs') {
      templateData.richCard = {
        ...richCard,
        actions: richCard.actions.filter(a => a.title.trim())
      }
    } else if (messageType === 'carousel') {
      const validItems = carouselItems.filter(item => {
        if (!item.title.trim()) return false
        const validActions = (item.actions || []).filter(a => 
          a.title.trim() && a.payload.trim() && (a.type !== 'url' || a.payload.startsWith('http'))
        )
        return validActions.length > 0
      }).map(item => ({
        ...item,
        actions: item.actions.filter(a => 
          a.title.trim() && a.payload.trim() && (a.type !== 'url' || a.payload.startsWith('http'))
        )
      }))
      
      if (validItems.length === 0) {
        const msg = 'Each carousel item must have at least one valid action with title and payload'
        toast.error(msg)
        setError(msg)
        return
      }
      
      templateData.carouselItems = validItems
      templateData.carouselSuggestions = carouselSuggestions.filter(s => s.title.trim() && s.payload.trim())
    }
    
    try {
      if (editingTemplate) {
        await ApiService.updateTemplate(editingTemplate._id, templateData)
        toast.success('Template updated successfully')
      } else {
        await ApiService.createTemplate(templateData)
        toast.success('Template created successfully')
      }
      await fetchTemplates()
      resetForm()
      setIsModalOpen(false)
      setError('')
    } catch (err) {
      console.error('Template save error:', err)
      
      let errorMsg = 'Failed to save template'
      const serverMsg = err.response?.data?.message || err.message || ''
      
      // Check for duplicate key error
      if (serverMsg.includes('E11000') && serverMsg.includes('name')) {
        errorMsg = `Template name "${formData.name}" already exists. Please use a different name.`
      } else {
        errorMsg = serverMsg
      }
      
      toast.error(errorMsg)
      setError(errorMsg)
    }
  }



  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Templates</h1>
          <div className="flex gap-2">
          
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Add Template
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm">SN</th>
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm">Name</th>
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm">Message Type</th>
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm">Preview</th>
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm ms-4"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Action</th>
                <th className="text-left py-4 px-4 font-semibold text-purple-900 text-sm ms-4"> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    Loading templates...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    No templates found
                  </td>
                </tr>
              ) : (
                templates.map((template, index) => (
                  <tr key={template._id} className="border-b border-gray-100 hover:bg-purple-50/30 transition-all duration-200">
                    <td className="py-4 px-4">
                      <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{template.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {getMessageTypeLabel(template.messageType)}
                      </span>
                    </td>
                    {/* <td className="py-4 px-4">
                      <div className="max-w-xs">
                        {template.messageType === 'plain-text' && (
                          <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 truncate">
                            {template.text}
                          </div>
                        )}
                        {template.messageType === 'text-with-action' && (
                          <div className="space-y-1">
                            <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 truncate">
                              {template.text}
                            </div>
                            <div className="flex gap-1">
                              {template.actions?.slice(0, 2).map((action, i) => (
                                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  {action.title}
                                </span>
                              ))}
                              {template.actions?.length > 2 && (
                                <span className="text-xs text-gray-500">+{template.actions.length - 2}</span>
                              )}
                            </div>
                          </div>
                        )}
                        {template.messageType === 'rcs' && (
                          <div className="border border-gray-200 rounded overflow-hidden">
                            {template.imageUrl && (
                              <img src={template.imageUrl} alt="RCS" className="w-full h-16 object-cover" />
                            )}
                            <div className="p-1 bg-gray-50">
                              <p className="text-xs text-gray-700 truncate">{template.text}</p>
                            </div>
                          </div>
                        )}
                        {template.messageType === 'carousel' && (
                          <div className="flex gap-1 overflow-x-auto">
                            {template.carouselItems?.slice(0, 3).map((item, i) => (
                              <div key={i} className="min-w-[60px] border border-gray-200 rounded overflow-hidden">
                                {item.imageUrl && (
                                  <img src={item.imageUrl} alt={`Card ${i+1}`} className="w-full h-12 object-cover" />
                                )}
                                <div className="p-1 bg-gray-50">
                                  <p className="text-xs text-gray-700 truncate">{item.title}</p>
                                </div>
                              </div>
                            ))}
                            {template.carouselItems?.length > 3 && (
                              <div className="min-w-[60px] flex items-center justify-center text-xs text-gray-500">
                                +{template.carouselItems.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td> */}  <button 
                          onClick={() => handlePreview(template)}
                          className="px-4 py-1.5 mt-5  bg-gray-100 text-gray-700 rounded-lg hover:bg-purple-100 hover:text-purple-700 transition-all duration-200 text-xs font-medium"
                        >
                          Preview
                        </button>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                      
                        <button 
                          onClick={() => handleEdit(template)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-all duration-200 border border-gray-300 hover:border-purple-300 rounded-lg"
                        >
                          <FaEdit className="text-xs" />
                          <span className="text-xs font-medium">Edit</span>
                        </button>
                        <button 
                          onClick={() => handleDelete(template._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 border border-red-300 hover:border-red-400 rounded-lg"
                        >
                          <FaTrash className="text-xs" />
                          <span className="text-xs font-medium">Delete</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {(() => {
                        const createdDate = new Date(template.createdAt)
                        const now = new Date()
                        const secondsDiff = (now - createdDate) / 1000
                        
                        if (secondsDiff < 3) {
                          return <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending</span>
                        } else {
                          return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Approved</span>
                        }
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
            &lt;
          </button>
          <button className="flex items-center justify-center w-9 h-9 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-all duration-200 font-medium">
            1
          </button>
          <button className="flex items-center justify-center w-9 h-9 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
            &gt;
          </button>
        </div>
      </div>



      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Template Preview</h2>
                <button onClick={() => setPreviewOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes className="text-lg" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-purple-600 text-white p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-500 font-bold text-sm">W</span>
                    </div>
                    <span className="font-medium"> Template Preview</span>
                  </div>
                </div>
                
                <div className="bg-white p-4">
                  {/* Plain Text Message */}
                  {previewData?.messageType === 'plain-text' && previewData?.text && (
                    <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewData.text}</p>
                    </div>
                  )}
                  
                  {/* Text with Actions */}
                  {previewData?.messageType === 'text-with-action' && (
                    <div className="max-w-xs">
                      {previewData?.text && (
                        <div className="bg-gray-100 p-3 rounded-lg mb-2">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{previewData.text}</p>
                        </div>
                      )}
                      {previewData?.actions?.length > 0 && (
                        <div className="space-y-1">
                          {previewData.actions.map((action, index) => (
                            <button key={index} className="w-full py-2 border border-blue-500 text-blue-500 rounded text-sm font-medium">
                              {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Image Message */}
                  {previewData?.messageType === 'image' && (
                    <div className="bg-gray-100 p-2 rounded-lg max-w-xs">
                      {previewData?.mediaUrl && (
                        <img 
                          src={previewData.mediaUrl} 
                          alt="Preview" 
                          className="w-full rounded-md mb-2"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x150/f5f5f5/666666?text=Image'
                          }}
                        />
                      )}
                      {previewData?.caption && (
                        <p className="text-sm text-gray-800">{previewData.caption}</p>
                      )}
                    </div>
                  )}
                  
                  {/* RCS Rich Card */}
                  {previewData?.messageType === 'rcs' && (
                    <div className="border border-gray-200 rounded-lg max-w-sm overflow-hidden">
                      {(previewData?.imageUrl || previewData?.richCard?.imageUrl) && (
                        <img 
                          src={previewData?.imageUrl || previewData?.richCard?.imageUrl} 
                          alt="RCS Card" 
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x128/f5f5f5/666666?text=RCS+Card'
                          }}
                        />
                      )}
                      <div className="p-3">
                        {(previewData?.richCard?.title || previewData?.text) && (
                          <h4 className="font-semibold text-gray-900 mb-1">{previewData?.richCard?.title || previewData?.text}</h4>
                        )}
                        {previewData?.richCard?.subtitle && (
                          <p className="text-xs text-gray-600 mb-2">{previewData.richCard.subtitle}</p>
                        )}
                        {(previewData?.richCard?.actions || previewData?.actions)?.length > 0 && (
                          <div className="space-y-2">
                            {(previewData?.richCard?.actions || previewData?.actions).map((action, index) => (
                              <button key={index} className="w-full py-2 bg-blue-500 text-white rounded text-sm font-medium">
                                {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Carousel */}
                  {previewData?.messageType === 'carousel' && previewData?.carouselItems?.length > 0 && (
                    <div className="max-w-sm">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {previewData.carouselItems.map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg min-w-[200px] overflow-hidden">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={`Carousel ${index + 1}`} 
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/200x96/f5f5f5/666666?text=Item+' + (index + 1)
                                }}
                              />
                            )}
                            <div className="p-2">
                              <h5 className="font-medium text-xs text-gray-900">{item.title}</h5>
                              {item.subtitle && (
                                <p className="text-xs text-gray-600 mt-1">{item.subtitle}</p>
                              )}
                              {item.actions?.length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {item.actions.map((action, actionIndex) => (
                                    <button key={actionIndex} className="w-full py-1 bg-blue-500 text-white rounded text-xs font-medium">
                                      {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 text-center mt-1">
                        Swipe to see more items →
                      </div>
                    </div>
                  )}
                  
                  {/* Button Message */}
                  {previewData?.messageType === 'button' && (
                    <div className="max-w-xs">
                      {previewData?.text && (
                        <div className="bg-gray-100 p-3 rounded-lg mb-2">
                          <p className="text-sm text-gray-800">{previewData.text}</p>
                        </div>
                      )}
                      {previewData?.buttons?.length > 0 && (
                        <div className="space-y-1">
                          {previewData.buttons.map((button, index) => (
                            <button key={index} className="w-full py-2 border border-blue-500 text-blue-500 rounded text-sm font-medium">
                              {button.type === 'call' ? '📞' : button.type === 'url' ? '🔗' : '💬'} {button.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Location Message */}
                  {previewData?.messageType === 'location' && (
                    <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                      <div className="text-center mb-2">
                        <span className="text-2xl">📍</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">Location Shared</p>
                      {previewData?.address && (
                        <p className="text-xs text-gray-600 mt-1">{previewData.address}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {previewData?.latitude}, {previewData?.longitude}
                      </p>
                    </div>
                  )}
                  
                  {/* Contact Message */}
                  {previewData?.messageType === 'contact' && (
                    <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600">👤</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{previewData?.contactName}</p>
                          <p className="text-xs text-gray-600">{previewData?.contactPhone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Default fallback */}
                  {!['text', 'text-with-action', 'text', 'image', 'rcs', 'button', 'location', 'contact', 'carousel'].includes(previewData?.messageType) && (
                    <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                      <p className="text-sm text-gray-600">Preview not available for {getMessageTypeLabel(previewData?.messageType)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import RCS Modal */}
     
      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex">
            {/* Left Side - Form */}
            <div className="w-1/2 p-6 overflow-y-auto border-r">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false)
                    resetForm()
                  }} 
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>

              
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Name & Message Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Template Name
                    </label>
                    <input
                      type="text"
                      placeholder="Template Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Message Type
                    </label>
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      className="w-full px-4 py-2 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50"
                    >
                      <option value="text">Plain Text</option>
                      <option value="text-with-action">Text with Actions</option>
                      <option value="rcs">RCS Rich Card</option>
                      <option value="carousel">Carousel</option>
                    </select>
                  </div>
                </div>

                {/* Message Editor - Only for text and text-with-action */}
                {(messageType === 'text' || messageType === 'text-with-action') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-500">*</span> Text
                    </label>
                    <textarea
                      value={formData.text}
                      onChange={(e) => setFormData({...formData, text: e.target.value})}
                      placeholder="Enter your message text..."
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

              

                {/* Actions for text-with-action */}
                {messageType === 'text-with-action' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
                      <button
                        type="button"
                        onClick={() => addAction('main')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" /> Add Action
                      </button>
                    </div>
                    {actions.map((action, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">Action {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeAction(index, 'main')}
                            className="text-red-600 hover:text-red-800 text-sm border border-red-300 px-3 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select 
                              value={action.type}
                              onChange={(e) => {
                                const newActions = [...actions]
                                const val = e.target.value
                                newActions[index].type = val
                                // If switched to call and title empty, set default title
                                if (val === 'call' && !newActions[index].title) {
                                  newActions[index].title = 'call now'
                                }
                                // If switched to url, clear title
                                if (val === 'url') {
                                  newActions[index].title = ''
                                }
                                setActions(newActions)
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                              <option value="reply">Reply</option>
                              <option value="url">URL</option>
                              <option value="call">Call</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <input
                              type="text"
                              value={action.title}
                              onChange={(e) => {
                                const newActions = [...actions]
                                newActions[index].title = e.target.value
                                setActions(newActions)
                              }}
                              placeholder="Action title"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {action.type === 'reply' ? 'Payload' : action.type === 'url' ? 'URL' : 'Phone'}
                            </label>
                            <input
                              type={action.type === 'url' ? 'url' : action.type === 'call' ? 'tel' : 'text'}
                              value={action.payload}
                              onChange={(e) => {
                                const newActions = [...actions]
                                newActions[index].payload = e.target.value
                                setActions(newActions)
                              }}
                              placeholder={action.type === 'reply' ? 'Reply text' : action.type === 'url' ? 'https://...' : '+1234567890'}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* RCS Rich Card */}
                {messageType === 'rcs' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Rich Card</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                          <input
                            type="text"
                            value={richCard.title}
                            onChange={(e) => setRichCard({...richCard, title: e.target.value})}
                            placeholder="Card title"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                          <input
                            type="text"
                            value={richCard.subtitle}
                            onChange={(e) => setRichCard({...richCard, subtitle: e.target.value})}
                            placeholder="Card subtitle"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              handleImageSelect(file)
                            }
                          }}
                          className="hidden"
                          id="richcard-image-upload"
                        />
                        <label
                          htmlFor="richcard-image-upload"
                          className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                            </svg>
                            <p className="mb-2 text-sm text-gray-700 font-medium">Browse Files to upload</p>
                          </div>
                        </label>
                        <p className="mt-2 text-xs text-gray-500 text-right">{richCard.imageFile ? `📎 ${richCard.imageFile.name}` : 'No selected File'}</p>
                        {richCard.imageFile && richCard.imageUrl && (
                          <div className="mt-3">
                            <div className="relative inline-block">
                              <img 
                                src={richCard.imageUrl} 
                                alt="Preview" 
                                className="max-w-xs rounded-lg border-2 border-gray-300" 
                                onLoad={(e) => {
                                  setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })
                                }} 
                              />
                              {imageDimensions.width > 0 && (
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                                  {imageDimensions.width}×{imageDimensions.height}px
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={() => document.getElementById('richcard-image-upload').click()}
                                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                              >
                                📷 Crop/Change
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteImage}
                                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* RCS Actions */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-semibold text-gray-900">Actions</h4>
                          <button
                            type="button"
                            onClick={() => addAction('richCard')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            <FaPlus className="text-xs inline mr-1" /> Add Action
                          </button>
                        </div>
                        {richCard.actions.map((action, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="font-medium text-gray-900 text-sm">Action {index + 1}</h6>
                              <button
                                type="button"
                                onClick={() => removeAction(index, 'richCard')}
                                className="text-red-600 hover:text-red-800 text-xs border border-red-300 px-2 py-1 rounded"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select 
                                  value={action.type}
                                  onChange={(e) => {
                                    const newActions = [...richCard.actions]
                                    const val = e.target.value
                                    newActions[index].type = val
                                    if (val === 'call' && !newActions[index].title) {
                                      newActions[index].title = 'call now'
                                    }
                                    if (val === 'url') {
                                      newActions[index].title = ''
                                    }
                                    setRichCard({...richCard, actions: newActions})
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                >
                                  <option value="reply">Reply</option>
                                  <option value="url">URL</option>
                                  <option value="call">Call</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                                <input
                                  type="text"
                                  value={action.title}
                                  onChange={(e) => {
                                    const newActions = [...richCard.actions]
                                    newActions[index].title = e.target.value
                                    setRichCard({...richCard, actions: newActions})
                                  }}
                                  placeholder="Action title"
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  {action.type === 'reply' ? 'Payload' : action.type === 'url' ? 'URL' : 'Phone'}
                                </label>
                                <input
                                  type={action.type === 'url' ? 'url' : action.type === 'call' ? 'tel' : 'text'}
                                  value={action.payload}
                                  onChange={(e) => {
                                    const newActions = [...richCard.actions]
                                    newActions[index].payload = e.target.value
                                    setRichCard({...richCard, actions: newActions})
                                  }}
                                  placeholder={action.type === 'reply' ? 'Reply text' : action.type === 'url' ? 'https://...' : '+1234567890'}
                                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Carousel Items */}
                {messageType === 'carousel' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Carousel Items</h3>
                      <button
                        type="button"
                        onClick={addCarouselItem}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <FaPlus className="text-xs" /> Add Item
                      </button>
                    </div>
                    {carouselItems.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-900">Item {index + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeCarouselItem(index)}
                            className="text-red-600 hover:text-red-800 text-sm border border-red-300 px-3 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  handleImageSelect(file, 'carousel', index)
                                }
                              }}
                              className="hidden"
                              id={`carousel-image-${index}`}
                            />
                            <label
                              htmlFor={`carousel-image-${index}`}
                              className="flex flex-col items-center justify-center w-full h-30 border-2 border-purple-600 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <svg className="w-12 h-12 mb-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                                </svg>
                                <p className="text-sm text-gray-700 font-medium">Browse Files to upload</p>
                              </div>
                            </label>
                            <p className="mt-2 text-xs text-gray-500 text-right">{item.imageFile ? `📎 ${item.imageFile.name}` : 'No selected File'}</p>
                            {item.imageFile && item.imageUrl && (
                              <div className="mt-3">
                                <div className="relative inline-block">
                                  <img
                                    src={item.imageUrl}
                                    alt="Preview"
                                    className="w-full rounded-lg border-2 h-30 border-gray-300"
                                    onLoad={(e) => {
                                      setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })
                                    }}
                                  />
                                  {imageDimensions.width > 0 && (
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
                                      {imageDimensions.width}×{imageDimensions.height}px
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => document.getElementById(`carousel-image-${index}`).click()}
                                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
                                  >
                                    📷 Crop/Change
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteImage('carousel', index)}
                                    className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const newItems = [...carouselItems]
                                  newItems[index].title = e.target.value
                                  setCarouselItems(newItems)
                                }}
                                placeholder="Item title"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                              <input
                                type="text"
                                value={item.subtitle}
                                onChange={(e) => {
                                  const newItems = [...carouselItems]
                                  newItems[index].subtitle = e.target.value
                                  setCarouselItems(newItems)
                                }}
                                placeholder="Item subtitle"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Carousel Item Actions */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-medium text-gray-700">Actions</h6>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...carouselItems]
                                if (!newItems[index].actions) newItems[index].actions = []
                                newItems[index].actions.push({ type: 'url', title: '', payload: '' })
                                setCarouselItems(newItems)
                              }}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              <FaPlus className="text-xs inline mr-1" /> Add Action
                            </button>
                          </div>
                          {item.actions?.map((action, actionIndex) => (
                            <div key={actionIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 bg-gray-50 rounded">
                              <select 
                                value={action.type}
                                onChange={(e) => {
                                  const newItems = [...carouselItems]
                                  const val = e.target.value
                                  newItems[index].actions[actionIndex].type = val
                                  if (val === 'call' && !newItems[index].actions[actionIndex].title) {
                                    newItems[index].actions[actionIndex].title = 'call now'
                                  }
                                  if (val === 'url') {
                                    newItems[index].actions[actionIndex].title = ''
                                  }
                                  setCarouselItems(newItems)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="reply">Reply</option>
                                <option value="url">URL</option>
                                <option value="call">Call</option>
                              </select>
                              <input
                                type="text"
                                value={action.title}
                                onChange={(e) => {
                                  const newItems = [...carouselItems]
                                  newItems[index].actions[actionIndex].title = e.target.value
                                  setCarouselItems(newItems)
                                }}
                                placeholder="Title"
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <input
                                type="text"
                                value={action.payload}
                                onChange={(e) => {
                                  const newItems = [...carouselItems]
                                  newItems[index].actions[actionIndex].payload = e.target.value
                                  setCarouselItems(newItems)
                                }}
                                placeholder="URL"
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newItems = [...carouselItems]
                                  newItems[index].actions.splice(actionIndex, 1)
                                  setCarouselItems(newItems)
                                }}
                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-md font-semibold text-gray-900">Global Suggestions</h4>
                        <button
                          type="button"
                          onClick={() => setCarouselSuggestions([...carouselSuggestions, { title: '', payload: '' }])}
                          className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
                        >
                          <FaPlus className="text-xs inline mr-1" /> Add Suggestion
                        </button>
                      </div>
                      {carouselSuggestions.map((suggestion, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 p-3 bg-indigo-50 rounded-lg">
                          <input
                            type="text"
                            value={suggestion.title}
                            onChange={(e) => {
                              const newSuggestions = [...carouselSuggestions]
                              newSuggestions[index].title = e.target.value
                              setCarouselSuggestions(newSuggestions)
                            }}
                            placeholder="Reply text"
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            value={suggestion.payload}
                            onChange={(e) => {
                              const newSuggestions = [...carouselSuggestions]
                              newSuggestions[index].payload = e.target.value
                              setCarouselSuggestions(newSuggestions)
                            }}
                            placeholder="Postback data"
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setCarouselSuggestions(carouselSuggestions.filter((_, i) => i !== index))}
                            className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      resetForm()
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side - Live Preview */}
            <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
        
              
              <div className="bg-white rounded-lg shadow-lg p-4">
                 <div className="bg-purple-600 text-white p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-purple-500 font-bold text-sm">W</span>
                    </div>
                    <span className="font-medium"> Template Preview</span>
                  </div>
                </div>
                
                <div className="p-4 min-h-600px]">
                  {/* Plain Text Preview */}
                  {messageType === 'plain-text' && formData.text && (
                    <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
                    </div>
                  )}
                  
                  {/* Text with Actions Preview */}
                  {messageType === 'text-with-action' && (
                    <div className="max-w-xs">
                      {formData.text && (
                        <div className="bg-gray-100 p-3 rounded-lg mb-2">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
                        </div>
                      )}
                      {actions.filter(a => a.title.trim()).length > 0 && (
                        <div className="space-y-1">
                          {actions.filter(a => a.title.trim()).map((action, index) => (
                            <button key={index} className="w-full py-2 border border-blue-500 text-blue-500 rounded text-sm font-medium">
                              {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* RCS Rich Card Preview */}
                  {messageType === 'rcs' && (
                    <div className="border border-gray-200 rounded-lg max-w-sm overflow-hidden">
                      {richCard.imageUrl && (
                        <img 
                          src={richCard.imageUrl} 
                          alt="RCS Card" 
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x128/f5f5f5/666666?text=RCS+Card'
                          }}
                        />
                      )}
                      <div className="p-3">
                        {richCard.title && (
                          <h4 className="font-semibold text-gray-900 mb-1">{richCard.title}</h4>
                        )}
                        {richCard.subtitle && (
                          <p className="text-xs text-gray-600 mb-2">{richCard.subtitle}</p>
                        )}
                        {formData.text && (
                          <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{formData.text}</p>
                        )}
                        {richCard.actions?.filter(a => a.title.trim()).length > 0 && (
                          <div className="space-y-2">
                            {richCard.actions.filter(a => a.title.trim()).map((action, index) => (
                              <button key={index} className="w-full py-2 bg-blue-500 text-white rounded text-sm font-medium">
                                {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Carousel Preview */}
                  {messageType === 'carousel' && carouselItems.filter(item => item.title.trim()).length > 0 && (
                    <div className="max-w-sm">
                      {formData.text && (
                        <div className="bg-gray-100 p-3 rounded-lg mb-3 max-w-xs">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
                        </div>
                      )}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {carouselItems.filter(item => item.title.trim()).map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg min-w-[200px] overflow-hidden">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={`Carousel ${index + 1}`} 
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/200x96/f5f5f5/666666?text=Item+' + (index + 1)
                                }}
                              />
                            )}
                            <div className="p-2">
                              <h5 className="font-medium text-xs text-gray-900">{item.title}</h5>
                              {item.subtitle && (
                                <p className="text-xs text-gray-600 mt-1">{item.subtitle}</p>
                              )}
                              {item.actions?.filter(a => a.title.trim()).length > 0 && (
                                <div className="space-y-1 mt-2">
                                  {item.actions.filter(a => a.title.trim()).map((action, actionIndex) => (
                                    <button key={actionIndex} className="w-full py-1 bg-blue-500 text-white rounded text-xs font-medium">
                                      {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {carouselSuggestions.filter(s => s.title.trim()).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {carouselSuggestions.filter(s => s.title.trim()).map((suggestion, index) => (
                            <button key={index} className="px-3 py-2 border border-purple-500 text-purple-600 rounded text-sm font-medium">
                              💬 {suggestion.title}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 text-center mt-2">
                        Swipe to see more items →
                      </div>
                    </div>
                  )}
                  
                  {/* Empty State */}
                  {!formData.text && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <div className="text-center">
                        <p className="text-sm">Start typing to see preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      {imageCropModalOpen && tempImageFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crop Image</h3>
              <button
                onClick={() => {
                  setImageCropModalOpen(false)
                  setTempImageFile(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Preview with Crop Area */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-x-auto">
                <div className="relative inline-block">
                  <img
                    id="cropImage"
                    src={URL.createObjectURL(tempImageFile)}
                    alt="Crop Preview"
                    className="max-w-full rounded-lg"
                    onLoad={(e) => {
                      setImageDimensions({
                        width: e.target.naturalWidth,
                        height: e.target.naturalHeight
                      })
                      if (cropCoords.width === 0) {
                        setCropCoords({
                          x: 0,
                          y: 0,
                          width: e.target.naturalWidth,
                          height: e.target.naturalHeight
                        })
                      }
                    }}
                  />
                  {/* Crop Area Overlay */}
                  <svg
                    className="absolute top-0 left-0 pointer-events-none"
                    id="cropOverlay"
                    style={{
                      width: imageDimensions.width,
                      height: imageDimensions.height
                    }}
                  >
                    <defs>
                      <mask id="cropMask">
                        <rect width={imageDimensions.width} height={imageDimensions.height} fill="white" />
                        <rect
                          x={cropCoords.x}
                          y={cropCoords.y}
                          width={cropCoords.width}
                          height={cropCoords.height}
                          fill="black"
                        />
                      </mask>
                    </defs>
                    <rect
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      fill="black"
                      opacity="0.5"
                      mask="url(#cropMask)"
                    />
                    <rect
                      x={cropCoords.x}
                      y={cropCoords.y}
                      width={cropCoords.width}
                      height={cropCoords.height}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Crop Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700">X Position</label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, imageDimensions.width - cropCoords.width)}
                    value={cropCoords.x}
                    onChange={(e) => setCropCoords({...cropCoords, x: parseInt(e.target.value)})}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">{cropCoords.x}px</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Y Position</label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(0, imageDimensions.height - cropCoords.height)}
                    value={cropCoords.y}
                    onChange={(e) => setCropCoords({...cropCoords, y: parseInt(e.target.value)})}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">{cropCoords.y}px</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Width</label>
                  <input
                    type="range"
                    min="50"
                    max={imageDimensions.width}
                    value={cropCoords.width}
                    onChange={(e) => setCropCoords({...cropCoords, width: parseInt(e.target.value)})}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">{cropCoords.width}px</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Height</label>
                  <input
                    type="range"
                    min="50"
                    max={imageDimensions.height}
                    value={cropCoords.height}
                    onChange={(e) => setCropCoords({...cropCoords, height: parseInt(e.target.value)})}
                    className="w-full mt-1"
                  />
                  <p className="text-xs text-gray-600 mt-1">{cropCoords.height}px</p>
                </div>
              </div>

              {/* Crop Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Image Information</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Original Size</p>
                    <p className="text-lg font-bold text-blue-900">{imageDimensions.width}×{imageDimensions.height}px</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Crop Size</p>
                    <p className="text-lg font-bold text-blue-900">{cropCoords.width}×{cropCoords.height}px</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Aspect Ratio</p>
                    <p className="text-lg font-bold text-blue-900">{(cropCoords.width / cropCoords.height).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Coverage</p>
                    <p className="text-lg font-bold text-blue-900">{Math.round((cropCoords.width * cropCoords.height) / (imageDimensions.width * imageDimensions.height) * 100)}%</p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setImageCropModalOpen(false)
                    setTempImageFile(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setCropCoords({
                      x: 0,
                      y: 0,
                      width: imageDimensions.width,
                      height: imageDimensions.height
                    })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  ✓ Crop & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





// "use client"

// import { useState, useEffect } from "react"
// import { FaEdit, FaTrash, FaTimes, FaPlus, FaEye, FaImage, FaFileAlt, FaLayerGroup, FaUpload } from "react-icons/fa"

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/templates"

// // Mock utility function - replace with your actual implementation
// const getMessageTypeLabel = (type) => {
//   const labels = {
//     text: "Plain Text",
//     "plain-text": "Plain Text",
//     "text-with-action": "Text with Actions",
//     rcs: "RCS Rich Card",
//     carousel: "Carousel",
//     image: "Image",
//     button: "Button",
//   }
//   return labels[type] || type
// }

// export default function TemplateManager() {
//   const [templates, setTemplates] = useState([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState("")

//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingTemplate, setEditingTemplate] = useState(null)
//   const [formData, setFormData] = useState({
//     name: "",
//     text: "",
//     imageUrl: "",
//   })
//   const [messageType, setMessageType] = useState("text")
//   const [actions, setActions] = useState([{ type: "reply", title: "", payload: "" }])
//   const [richCard, setRichCard] = useState({ title: "", subtitle: "", imageUrl: "", actions: [] })
//   const [carouselItems, setCarouselItems] = useState([{ title: "", subtitle: "", imageUrl: "", actions: [] }])
//   const [carouselSuggestions, setCarouselSuggestions] = useState([])
//   const [previewOpen, setPreviewOpen] = useState(false)
//   const [previewData, setPreviewData] = useState(null)
//   const [uploadingFile, setUploadingFile] = useState(false)

//   useEffect(() => {
//     fetchTemplates()
//   }, [])

//   const fetchTemplates = async () => {
//     setLoading(true)
//     setError("")
//     try {
//       const response = await fetch(API_BASE_URL)
//       if (!response.ok) throw new Error("Failed to fetch templates")
//       const data = await response.json()
//       setTemplates(data)
//     } catch (err) {
//       setError(err.message)
//       console.error("Error fetching templates:", err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleFileUpload = async (file, target = "richCard") => {
//     if (!file) return

//     setUploadingFile(true)
//     const formData = new FormData()
//     formData.append("file", file)

//     try {
//       const response = await fetch("/api/upload", {
//         method: "POST",
//         body: formData,
//       })

//       if (!response.ok) throw new Error("File upload failed")

//       const data = await response.json()
//       const fileUrl = data.url

//       // Update the appropriate state based on target
//       if (target === "richCard") {
//         setRichCard({ ...richCard, imageUrl: fileUrl })
//       } else if (target.startsWith("carousel-")) {
//         const index = Number.parseInt(target.split("-")[1])
//         const newItems = [...carouselItems]
//         newItems[index].imageUrl = fileUrl
//         setCarouselItems(newItems)
//       }
//     } catch (err) {
//       setError(err.message)
//       console.error("Error uploading file:", err)
//     } finally {
//       setUploadingFile(false)
//     }
//   }

//   const handlePreview = (template) => {
//     setPreviewData(template)
//     setPreviewOpen(true)
//   }

//   const handleEdit = (template) => {
//     setEditingTemplate(template)
//     setFormData({
//       name: template.name,
//       text: template.text || "",
//       imageUrl: template.imageUrl || "",
//     })
//     setMessageType(template.messageType)
//     setActions(template.actions || [{ type: "reply", title: "", payload: "" }])
//     setRichCard(template.richCard || { title: "", subtitle: "", imageUrl: "", actions: [] })
//     setCarouselItems(template.carouselItems || [{ title: "", subtitle: "", imageUrl: "", actions: [] }])
//     setCarouselSuggestions(template.carouselSuggestions || [])
//     setIsModalOpen(true)
//   }

//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this template?")) return

//     try {
//       const response = await fetch(`${API_BASE_URL}/${id}`, {
//         method: "DELETE",
//       })

//       if (!response.ok) throw new Error("Failed to delete template")

//       setTemplates(templates.filter((t) => t._id !== id))
//     } catch (err) {
//       setError(err.message)
//       console.error("Error deleting template:", err)
//     }
//   }

//   const resetForm = () => {
//     setFormData({ name: "", text: "", imageUrl: "" })
//     setMessageType("text")
//     setActions([{ type: "reply", title: "", payload: "" }])
//     setRichCard({ title: "", subtitle: "", imageUrl: "", actions: [] })
//     setCarouselItems([{ title: "", subtitle: "", imageUrl: "", actions: [] }])
//     setCarouselSuggestions([])
//     setEditingTemplate(null)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()

//     if (!formData.name.trim()) {
//       setError("Template name is required")
//       return
//     }

//     const templateData = {
//       name: formData.name.trim(),
//       messageType,
//       text: formData.text.trim(),
//       imageUrl: formData.imageUrl.trim(),
//       actions,
//       richCard,
//       carouselItems,
//       carouselSuggestions,
//     }

//     try {
//       const url = editingTemplate ? `${API_BASE_URL}/${editingTemplate._id}` : API_BASE_URL
//       const method = editingTemplate ? "PUT" : "POST"

//       const response = await fetch(url, {
//         method,
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.JSON.stringify(templateData),
//       })

//       if (!response.ok) throw new Error("Failed to save template")

//       const savedTemplate = await response.json()

//       if (editingTemplate) {
//         setTemplates(templates.map((t) => (t._id === editingTemplate._id ? savedTemplate : t)))
//       } else {
//         setTemplates([...templates, savedTemplate])
//       }

//       resetForm()
//       setIsModalOpen(false)
//       setError("")
//     } catch (err) {
//       setError(err.message)
//       console.error("Error saving template:", err)
//     }
//   }

//   const addAction = (target = "main") => {
//     const newAction = { type: "reply", title: "", payload: "" }
//     if (target === "main") {
//       setActions([...actions, newAction])
//     } else if (target === "richCard") {
//       setRichCard({ ...richCard, actions: [...richCard.actions, newAction] })
//     }
//   }

//   const removeAction = (index, target = "main") => {
//     if (target === "main") {
//       setActions(actions.filter((_, i) => i !== index))
//     } else if (target === "richCard") {
//       setRichCard({ ...richCard, actions: richCard.actions.filter((_, i) => i !== index) })
//     }
//   }

//   const addCarouselAction = (carouselIndex) => {
//     const newItems = [...carouselItems]
//     newItems[carouselIndex].actions.push({ title: "", type: "reply", value: "" })
//     setCarouselItems(newItems)
//   }

//   const removeCarouselAction = (carouselIndex, actionIndex) => {
//     const newItems = [...carouselItems]
//     newItems[carouselIndex].actions = newItems[carouselIndex].actions.filter((_, i) => i !== actionIndex)
//     setCarouselItems(newItems)
//   }

//   const removeCarouselItem = (index) => {
//     setCarouselItems(carouselItems.filter((_, i) => i !== index))
//   }

//   const addCarouselItem = () => {
//     setCarouselItems([...carouselItems, { title: "", subtitle: "", imageUrl: "", actions: [] }])
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
//         {/* Header Section */}
//         <div className="mb-8">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                 Message Templates
//               </h1>
//               <p className="mt-2 text-sm sm:text-base text-slate-600">Create and manage your messaging templates</p>
//             </div>
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
//             >
//               <FaPlus className="text-sm" />
//               <span>Create Template</span>
//             </button>
//           </div>
//         </div>

//         {error && (
//           <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 flex items-center justify-between">
//             <span>{error}</span>
//             <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
//               <FaTimes />
//             </button>
//           </div>
//         )}

//         {/* Table Container */}
//         <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
//           {/* Desktop Table View */}
//           <div className="hidden lg:block overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-blue-600 to-indigo-600">
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">#</th>
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">Name</th>
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">Type</th>
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">
//                     Preview
//                   </th>
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">
//                     Actions
//                   </th>
//                   <th className="text-left py-4 px-6 font-semibold text-white text-sm uppercase tracking-wide">
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {loading ? (
//                   <tr>
//                     <td colSpan="6" className="py-12 text-center text-slate-500">
//                       <div className="flex items-center justify-center gap-2">
//                         <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//                         Loading templates...
//                       </div>
//                     </td>
//                   </tr>
//                 ) : templates.length === 0 ? (
//                   <tr>
//                     <td colSpan="6" className="py-16 text-center">
//                       <div className="flex flex-col items-center gap-3">
//                         <FaFileAlt className="text-5xl text-slate-300" />
//                         <p className="text-slate-500 text-lg">No templates found</p>
//                         <button
//                           onClick={() => setIsModalOpen(true)}
//                           className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
//                         >
//                           Create your first template
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   templates.map((template, index) => (
//                     <tr key={template._id} className="hover:bg-blue-50/50 transition-colors duration-200">
//                       <td className="py-4 px-6">
//                         <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-bold shadow-sm">
//                           {index + 1}
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center gap-3">
//                           <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg shadow-sm">
//                             {template.messageType === "rcs" ? (
//                               <FaImage className="text-white text-sm" />
//                             ) : template.messageType === "carousel" ? (
//                               <FaLayerGroup className="text-white text-sm" />
//                             ) : (
//                               <FaFileAlt className="text-white text-sm" />
//                             )}
//                           </div>
//                           <span className="font-semibold text-slate-800">{template.name}</span>
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-semibold shadow-sm">
//                           {getMessageTypeLabel(template.messageType)}
//                         </span>
//                       </td>
//                       <td className="py-4 px-6">
//                         <button
//                           onClick={() => handlePreview(template)}
//                           className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
//                         >
//                           <FaEye className="text-xs" />
//                           View
//                         </button>
//                       </td>
//                       <td className="py-4 px-6">
//                         <div className="flex items-center gap-2 flex-wrap">
//                           <button
//                             onClick={() => handleEdit(template)}
//                             className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300 rounded-lg shadow-sm hover:shadow font-medium text-sm"
//                           >
//                             <FaEdit className="text-xs" />
//                             <span className="hidden xl:inline">Edit</span>
//                           </button>
//                           <button
//                             onClick={() => handleDelete(template._id)}
//                             className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300 rounded-lg shadow-sm hover:shadow font-medium text-sm"
//                           >
//                             <FaTrash className="text-xs" />
//                             <span className="hidden xl:inline">Delete</span>
//                           </button>
//                           {(template.actions?.length > 0 || template.richCard?.actions?.length > 0) && (
//                             <div className="flex gap-1 ml-2">
//                               {[...(template.actions || []), ...(template.richCard?.actions || [])].map(
//                                 (action, idx) => (
//                                   <span
//                                     key={idx}
//                                     className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold"
//                                     title={action.title}
//                                   >
//                                     {action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}
//                                   </span>
//                                 ),
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="py-4 px-6">
//                         {(() => {
//                           const createdDate = new Date(template.createdAt)
//                           const now = new Date()
//                           const secondsDiff = (now - createdDate) / 1000

//                           if (secondsDiff < 3) {
//                             return (
//                               <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 rounded-full text-xs font-semibold shadow-sm">
//                                 <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
//                                 Pending
//                               </span>
//                             )
//                           } else {
//                             return (
//                               <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-semibold shadow-sm">
//                                 <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
//                                 Approved
//                               </span>
//                             )
//                           }
//                         })()}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Mobile Card View */}
//           <div className="lg:hidden divide-y divide-slate-100">
//             {loading ? (
//               <div className="py-12 text-center text-slate-500">
//                 <div className="flex items-center justify-center gap-2">
//                   <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//                   Loading templates...
//                 </div>
//               </div>
//             ) : templates.length === 0 ? (
//               <div className="py-16 text-center px-4">
//                 <FaFileAlt className="text-5xl text-slate-300 mx-auto mb-4" />
//                 <p className="text-slate-500 text-lg mb-4">No templates found</p>
//                 <button
//                   onClick={() => setIsModalOpen(true)}
//                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
//                 >
//                   Create your first template
//                 </button>
//               </div>
//             ) : (
//               templates.map((template, index) => (
//                 <div key={template._id} className="p-4 hover:bg-blue-50/50 transition-colors">
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex items-center gap-3 flex-1">
//                       <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-bold shadow-sm flex-shrink-0">
//                         {index + 1}
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <h3 className="font-semibold text-slate-800 truncate">{template.name}</h3>
//                         <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-semibold shadow-sm mt-1">
//                           {getMessageTypeLabel(template.messageType)}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="ml-2">
//                       {(() => {
//                         const createdDate = new Date(template.createdAt)
//                         const now = new Date()
//                         const secondsDiff = (now - createdDate) / 1000

//                         if (secondsDiff < 3) {
//                           return (
//                             <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap">
//                               <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
//                               Pending
//                             </span>
//                           )
//                         } else {
//                           return (
//                             <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-semibold shadow-sm whitespace-nowrap">
//                               <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
//                               Approved
//                             </span>
//                           )
//                         }
//                       })()}
//                     </div>
//                   </div>

//                   <div className="flex items-center gap-2 flex-wrap">
//                     <button
//                       onClick={() => handlePreview(template)}
//                       className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 text-xs font-medium shadow-sm"
//                     >
//                       <FaEye className="text-xs" />
//                       Preview
//                     </button>
//                     <button
//                       onClick={() => handleEdit(template)}
//                       className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 border border-blue-200 hover:border-blue-300 rounded-lg shadow-sm font-medium text-xs"
//                     >
//                       <FaEdit className="text-xs" />
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(template._id)}
//                       className="flex items-center gap-1.5 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 border border-red-200 hover:border-red-300 rounded-lg shadow-sm font-medium text-xs"
//                     >
//                       <FaTrash className="text-xs" />
//                       Delete
//                     </button>
//                     {(template.actions?.length > 0 || template.richCard?.actions?.length > 0) && (
//                       <div className="flex gap-1">
//                         {[...(template.actions || []), ...(template.richCard?.actions || [])].map((action, idx) => (
//                           <span
//                             key={idx}
//                             className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold"
//                             title={action.title}
//                           >
//                             {action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}
//                           </span>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Pagination */}
//           <div className="flex items-center justify-center gap-2 p-6 border-t border-slate-200 bg-slate-50">
//             <button className="flex items-center justify-center w-10 h-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
//               &lt;
//             </button>
//             <button className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 font-semibold transform hover:scale-105">
//               1
//             </button>
//             <button className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
//               2
//             </button>
//             <button className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
//               3
//             </button>
//             <button className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-300">
//               &gt;
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Preview Modal */}
//       {previewOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
//           <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
//             <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl font-bold">Template Preview</h2>
//                   <p className="text-blue-100 text-sm mt-1">{previewData?.name}</p>
//                 </div>
//                 <button
//                   onClick={() => setPreviewOpen(false)}
//                   className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
//                 >
//                   <FaTimes className="text-xl" />
//                 </button>
//               </div>
//             </div>

//             <div className="p-6 bg-slate-50">
//               <div className="bg-white rounded-xl shadow-lg p-6 max-w-md mx-auto">
//                 {/* Plain Text Message */}
//                 {(previewData?.messageType === "plain-text" || previewData?.messageType === "text") &&
//                   previewData?.text && (
//                     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
//                       <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{previewData.text}</p>
//                     </div>
//                   )}

//                 {/* Text with Actions */}
//                 {previewData?.messageType === "text-with-action" && (
//                   <div className="space-y-3">
//                     {previewData?.text && (
//                       <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
//                         <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{previewData.text}</p>
//                       </div>
//                     )}
//                     {previewData?.actions?.length > 0 && (
//                       <div className="space-y-2">
//                         {previewData.actions.map((action, index) => (
//                           <button
//                             key={index}
//                             className="w-full py-3 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
//                           >
//                             <span>{action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}</span>
//                             <span>{action.title}</span>
//                             <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">{action.type}</span>
//                           </button>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {/* RCS Rich Card */}
//                 {previewData?.messageType === "rcs" && (
//                   <div className="border-2 border-slate-200 rounded-xl overflow-hidden shadow-lg">
//                     {(previewData?.imageUrl || previewData?.richCard?.imageUrl) && (
//                       <img
//                         src={previewData?.imageUrl || previewData?.richCard?.imageUrl}
//                         alt="RCS Card"
//                         className="w-full h-48 object-cover"
//                       />
//                     )}
//                     <div className="p-4 bg-white">
//                       {(previewData?.richCard?.title || previewData?.text) && (
//                         <h4 className="font-bold text-slate-900 mb-2 text-lg">
//                           {previewData?.richCard?.title || previewData?.text}
//                         </h4>
//                       )}
//                       {previewData?.richCard?.subtitle && (
//                         <p className="text-sm text-slate-600 mb-3">{previewData.richCard.subtitle}</p>
//                       )}
//                       {(previewData?.richCard?.actions || previewData?.actions)?.length > 0 && (
//                         <div className="space-y-2">
//                           {(previewData?.richCard?.actions || previewData?.actions).map((action, index) => (
//                             <button
//                               key={index}
//                               className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
//                             >
//                               <span>{action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}</span>
//                               <span>{action.title}</span>
//                               <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{action.type}</span>
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Carousel */}
//                 {previewData?.messageType === "carousel" && previewData?.carouselItems?.length > 0 && (
//                   <div>
//                     <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
//                       {previewData.carouselItems.map((item, index) => (
//                         <div
//                           key={index}
//                           className="border-2 border-slate-200 rounded-xl min-w-[240px] overflow-hidden shadow-lg flex-shrink-0"
//                         >
//                           {item.imageUrl && (
//                             <div className="relative">
//                               <img
//                                 src={item.imageUrl || "/placeholder.svg?height=150&width=240&query=carousel item"}
//                                 alt={`Carousel ${index + 1}`}
//                                 className="w-full h-32 object-cover"
//                               />
//                               <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
//                                 {index + 1}/{previewData.carouselItems.length}
//                               </div>
//                             </div>
//                           )}
//                           <div className="p-3 bg-white">
//                             <h5 className="font-semibold text-sm text-slate-900">{item.title}</h5>
//                             {item.subtitle && <p className="text-xs text-slate-600 mt-1">{item.subtitle}</p>}
//                             {item.actions?.length > 0 && (
//                               <div className="space-y-1 mt-2">
//                                 {item.actions.map((action, actionIndex) => (
//                                   <button
//                                     key={actionIndex}
//                                     className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-1"
//                                   >
//                                     <span>{action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}</span>{" "}
//                                     <span>{action.title}</span>
//                                   </button>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <div className="text-xs text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
//                       <span>←</span>
//                       <span>Swipe to see more items</span>
//                       <span>→</span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Create/Edit Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
//           <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl animate-scale-in my-8 max-h-[95vh] flex flex-col">
//             {/* Modal Header */}
//             <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl z-10 flex-shrink-0">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h2 className="text-2xl sm:text-3xl font-bold">
//                     {editingTemplate ? "Edit Template" : "Create New Template"}
//                   </h2>
//                   <p className="text-blue-100 text-sm mt-1">Design your perfect message template</p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setIsModalOpen(false)
//                     resetForm()
//                   }}
//                   className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors flex-shrink-0"
//                 >
//                   <FaTimes className="text-xl" />
//                 </button>
//               </div>
//             </div>

//             {/* Modal Body - Scrollable */}
//             <div className="flex-1 overflow-y-auto">
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
//                 {/* Left Side - Form */}
//                 <div className="space-y-6">
//                   <form onSubmit={handleSubmit} className="space-y-6">
//                     {/* Template Name & Message Type */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <div>
//                         <label className="block text-sm font-semibold text-slate-700 mb-2">
//                           <span className="text-red-500">*</span> Template Name
//                         </label>
//                         <input
//                           type="text"
//                           placeholder="Enter template name"
//                           value={formData.name}
//                           onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                           required
//                           className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
//                         />
//                       </div>
//                       <div>
//                         <label className="block text-sm font-semibold text-slate-700 mb-2">
//                           <span className="text-red-500">*</span> Message Type
//                         </label>
//                         <select
//                           value={messageType}
//                           onChange={(e) => setMessageType(e.target.value)}
//                           className="w-full px-4 py-3 border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 font-medium text-blue-900 transition-all"
//                         >
//                           <option value="text">Plain Text</option>
//                           <option value="text-with-action">Text with Actions</option>
//                           <option value="rcs">RCS Rich Card</option>
//                           <option value="carousel">Carousel</option>
//                         </select>
//                       </div>
//                     </div>

//                     {/* Message Text */}
//                     {(messageType === "text" || messageType === "text-with-action") && (
//                       <div>
//                         <label className="block text-sm font-semibold text-slate-700 mb-2">
//                           <span className="text-red-500">*</span> Message Text
//                         </label>
//                         <textarea
//                           value={formData.text}
//                           onChange={(e) => setFormData({ ...formData, text: e.target.value })}
//                           placeholder="Enter your message here..."
//                           required
//                           rows={4}
//                           className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-white"
//                         />
//                       </div>
//                     )}

//                     {/* Actions for text-with-action */}
//                     {messageType === "text-with-action" && (
//                       <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200">
//                         <div className="flex items-center justify-between mb-4">
//                           <h3 className="text-lg font-bold text-slate-800">Quick Actions</h3>
//                           <button
//                             type="button"
//                             onClick={() => addAction("main")}
//                             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md"
//                           >
//                             <FaPlus className="text-xs" /> Add Action
//                           </button>
//                         </div>
//                         <div className="space-y-3">
//                           {actions.map((action, index) => (
//                             <div key={index} className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
//                               <div className="flex items-center justify-between mb-3">
//                                 <h5 className="font-semibold text-slate-800">
//                                   Action {index + 1}
//                                   <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
//                                     {action.type}
//                                   </span>
//                                 </h5>
//                                 <button
//                                   type="button"
//                                   onClick={() => removeAction(index, "main")}
//                                   className="text-red-600 hover:text-red-700 text-sm border-2 border-red-300 px-3 py-1 rounded-lg hover:bg-red-50 transition-all font-medium"
//                                 >
//                                   Remove
//                                 </button>
//                               </div>
//                               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//                                 <select
//                                   value={action.type}
//                                   onChange={(e) => {
//                                     const newActions = [...actions]
//                                     newActions[index].type = e.target.value
//                                     setActions(newActions)
//                                   }}
//                                   className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                 >
//                                   <option value="reply">Reply</option>
//                                   <option value="url">URL</option>
//                                   <option value="call">Call</option>
//                                 </select>
//                                 <input
//                                   type="text"
//                                   value={action.title}
//                                   onChange={(e) => {
//                                     const newActions = [...actions]
//                                     newActions[index].title = e.target.value
//                                     setActions(newActions)
//                                   }}
//                                   placeholder="Action title"
//                                   className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                 />
//                                 <input
//                                   type="text"
//                                   value={action.payload}
//                                   onChange={(e) => {
//                                     const newActions = [...actions]
//                                     newActions[index].payload = e.target.value
//                                     setActions(newActions)
//                                   }}
//                                   placeholder={
//                                     action.type === "url"
//                                       ? "https://..."
//                                       : action.type === "call"
//                                         ? "+1234567890"
//                                         : "Reply text"
//                                   }
//                                   className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                 />
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* RCS Rich Card */}
//                     {messageType === "rcs" && (
//                       <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border-2 border-indigo-200">
//                         <h3 className="text-lg font-bold text-slate-800 mb-4">RCS Rich Card Content</h3>
//                         <div className="space-y-4">
//                           <div>
//                             <label className="block text-sm font-semibold text-slate-700 mb-2">Card Image</label>
//                             <div className="flex gap-2">
//                               <input
//                                 type="url"
//                                 value={richCard.imageUrl}
//                                 onChange={(e) => setRichCard({ ...richCard, imageUrl: e.target.value })}
//                                 placeholder="Image URL"
//                                 className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
//                               />
//                               <label className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all cursor-pointer text-sm font-medium shadow-md">
//                                 <FaUpload className="text-xs" />
//                                 <span className="hidden sm:inline">Upload</span>
//                                 <input
//                                   type="file"
//                                   accept="image/*"
//                                   onChange={(e) => handleFileUpload(e.target.files?.[0], "richCard")}
//                                   className="hidden"
//                                   disabled={uploadingFile}
//                                 />
//                               </label>
//                             </div>
//                             {uploadingFile && <p className="text-xs text-indigo-600 mt-1">Uploading...</p>}
//                           </div>
//                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                             <input
//                               type="text"
//                               value={richCard.title}
//                               onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
//                               placeholder="Card title *"
//                               className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
//                             />
//                             <input
//                               type="text"
//                               value={richCard.subtitle}
//                               onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
//                               placeholder="Card subtitle"
//                               className="px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
//                             />
//                           </div>

//                           {/* Rich Card Actions */}
//                           <div className="bg-white p-4 rounded-xl border-2 border-slate-200">
//                             <div className="flex items-center justify-between mb-3">
//                               <h4 className="font-semibold text-slate-800 text-sm">Card Actions</h4>
//                               <button
//                                 type="button"
//                                 onClick={() => addAction("richCard")}
//                                 className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-xs font-medium"
//                               >
//                                 <FaPlus className="text-xs" /> Add
//                               </button>
//                             </div>
//                             <div className="space-y-2">
//                               {richCard.actions.map((action, index) => (
//                                 <div key={index} className="flex gap-2">
//                                   <select
//                                     value={action.type}
//                                     onChange={(e) => {
//                                       const newActions = [...richCard.actions]
//                                       newActions[index].type = e.target.value
//                                       setRichCard({ ...richCard, actions: newActions })
//                                     }}
//                                     className="px-2 py-2 border-2 border-slate-200 rounded-lg text-xs bg-white"
//                                   >
//                                     <option value="reply">Reply</option>
//                                     <option value="url">URL</option>
//                                     <option value="call">Call</option>
//                                   </select>
//                                   <input
//                                     type="text"
//                                     value={action.title}
//                                     onChange={(e) => {
//                                       const newActions = [...richCard.actions]
//                                       newActions[index].title = e.target.value
//                                       setRichCard({ ...richCard, actions: newActions })
//                                     }}
//                                     placeholder="Title"
//                                     className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg text-xs bg-white"
//                                   />
//                                   <input
//                                     type="text"
//                                     value={action.payload}
//                                     onChange={(e) => {
//                                       const newActions = [...richCard.actions]
//                                       newActions[index].payload = e.target.value
//                                       setRichCard({ ...richCard, actions: newActions })
//                                     }}
//                                     placeholder="Payload"
//                                     className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-lg text-xs bg-white"
//                                   />
//                                   <button
//                                     type="button"
//                                     onClick={() => removeAction(index, "richCard")}
//                                     className="text-red-600 hover:text-red-700 px-2"
//                                   >
//                                     <FaTrash className="text-xs" />
//                                   </button>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* Carousel Items */}
//                     {messageType === "carousel" && (
//                       <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200">
//                         <div className="flex items-center justify-between mb-4">
//                           <h3 className="text-lg font-bold text-slate-800">Carousel Items</h3>
//                           <button
//                             type="button"
//                             onClick={addCarouselItem}
//                             className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-sm font-medium shadow-md"
//                           >
//                             <FaPlus className="text-xs" /> Add Item
//                           </button>
//                         </div>
//                         <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
//                           {carouselItems.map((item, index) => (
//                             <div key={index} className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-sm">
//                               <div className="flex items-center justify-between mb-3">
//                                 <h5 className="font-semibold text-slate-800">Item {index + 1}</h5>
//                                 <button
//                                   type="button"
//                                   onClick={() => removeCarouselItem(index)}
//                                   className="text-red-600 hover:text-red-700 text-sm border-2 border-red-300 px-3 py-1 rounded-lg hover:bg-red-50 transition-all font-medium"
//                                 >
//                                   Remove
//                                 </button>
//                               </div>
//                               <div className="space-y-3">
//                                 <div>
//                                   <div className="flex gap-2">
//                                     <input
//                                       type="url"
//                                       value={item.imageUrl}
//                                       onChange={(e) => {
//                                         const newItems = [...carouselItems]
//                                         newItems[index].imageUrl = e.target.value
//                                         setCarouselItems(newItems)
//                                       }}
//                                       placeholder="Image URL"
//                                       className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
//                                     />
//                                     <label className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all cursor-pointer text-sm font-medium shadow-sm">
//                                       <FaUpload className="text-xs" />
//                                       <input
//                                         type="file"
//                                         accept="image/*"
//                                         onChange={(e) => handleFileUpload(e.target.files?.[0], `carousel-${index}`)}
//                                         className="hidden"
//                                         disabled={uploadingFile}
//                                       />
//                                     </label>
//                                   </div>
//                                 </div>
//                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                                   <input
//                                     type="text"
//                                     value={item.title}
//                                     onChange={(e) => {
//                                       const newItems = [...carouselItems]
//                                       newItems[index].title = e.target.value
//                                       setCarouselItems(newItems)
//                                     }}
//                                     placeholder="Item title *"
//                                     className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
//                                   />
//                                   <input
//                                     type="text"
//                                     value={item.subtitle}
//                                     onChange={(e) => {
//                                       const newItems = [...carouselItems]
//                                       newItems[index].subtitle = e.target.value
//                                       setCarouselItems(newItems)
//                                     }}
//                                     placeholder="Item subtitle"
//                                     className="px-3 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
//                                   />
//                                 </div>

//                                 <div className="mt-4 pt-4 border-t border-slate-200">
//                                   <div className="flex items-center justify-between mb-3">
//                                     <label className="text-sm font-semibold text-slate-700">Actions</label>
//                                     <button
//                                       type="button"
//                                       onClick={() => addCarouselAction(index)}
//                                       className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-xs font-medium"
//                                     >
//                                       <FaPlus className="text-xs" /> Add Action
//                                     </button>
//                                   </div>
//                                   {item.actions && item.actions.length > 0 && (
//                                     <div className="space-y-2">
//                                       {item.actions.map((action, actionIndex) => (
//                                         <div
//                                           key={actionIndex}
//                                           className="bg-slate-50 border border-slate-200 rounded-lg p-3"
//                                         >
//                                           <div className="flex items-center justify-between mb-2">
//                                             <span className="text-xs font-semibold text-slate-600">
//                                               Action {actionIndex + 1}
//                                             </span>
//                                             <button
//                                               type="button"
//                                               onClick={() => removeCarouselAction(index, actionIndex)}
//                                               className="text-red-600 hover:text-red-700 text-xs"
//                                             >
//                                               Remove
//                                             </button>
//                                           </div>
//                                           <div className="space-y-2">
//                                             <input
//                                               type="text"
//                                               value={action.title}
//                                               onChange={(e) => {
//                                                 const newItems = [...carouselItems]
//                                                 newItems[index].actions[actionIndex].title = e.target.value
//                                                 setCarouselItems(newItems)
//                                               }}
//                                               placeholder="Action title *"
//                                               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                             />
//                                             <select
//                                               value={action.type}
//                                               onChange={(e) => {
//                                                 const newItems = [...carouselItems]
//                                                 newItems[index].actions[actionIndex].type = e.target.value
//                                                 setCarouselItems(newItems)
//                                               }}
//                                               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                             >
//                                               <option value="reply">Reply</option>
//                                               <option value="url">URL</option>
//                                               <option value="call">Call</option>
//                                             </select>
//                                             <input
//                                               type="text"
//                                               value={action.value}
//                                               onChange={(e) => {
//                                                 const newItems = [...carouselItems]
//                                                 newItems[index].actions[actionIndex].value = e.target.value
//                                                 setCarouselItems(newItems)
//                                               }}
//                                               placeholder={
//                                                 action.type === "url"
//                                                   ? "https://example.com"
//                                                   : action.type === "call"
//                                                     ? "+1234567890"
//                                                     : "Reply text"
//                                               }
//                                               className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm bg-white"
//                                             />
//                                           </div>
//                                         </div>
//                                       ))}
//                                     </div>
//                                   )}
//                                   {(!item.actions || item.actions.length === 0) && (
//                                     <p className="text-xs text-slate-500 text-center py-2">No actions added yet</p>
//                                   )}
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     {/* Form Actions */}
//                     <div className="flex items-center gap-3 pt-4 border-t border-slate-200 sticky bottom-0 bg-white py-4 -mx-6 px-6">
//                       <button
//                         type="submit"
//                         className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold text-base transform hover:scale-[1.02]"
//                       >
//                         {editingTemplate ? "Update Template" : "Create Template"}
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setIsModalOpen(false)
//                           resetForm()
//                         }}
//                         className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-semibold text-base"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </form>
//                 </div>

//                 {/* Right Side - Live Preview */}
//                 <div className="hidden lg:block">
//                   <div className="sticky top-6">
//                     <div className="bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl p-6 border-2 border-slate-200 shadow-lg">
//                       <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
//                         <FaEye className="text-blue-600" />
//                         Live Preview
//                       </h3>

//                       {/* Text Preview */}
//                       {(messageType === "text" || messageType === "text-with-action") && formData.text && (
//                         <div className="bg-white rounded-xl shadow-lg p-5 max-w-sm">
//                           <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm">
//                             <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
//                               {formData.text}
//                             </p>
//                           </div>
//                           {messageType === "text-with-action" && actions.filter((a) => a.title.trim()).length > 0 && (
//                             <div className="space-y-2 mt-3">
//                               {actions
//                                 .filter((a) => a.title.trim())
//                                 .map((action, index) => (
//                                   <button
//                                     key={index}
//                                     className="w-full py-3 border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2"
//                                   >
//                                     <span>{action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}</span>
//                                     <span>{action.title}</span>
//                                     <span className="text-xs bg-blue-100 px-2 py-0.5 rounded-full">{action.type}</span>
//                                   </button>
//                                 ))}
//                             </div>
//                           )}
//                         </div>
//                       )}

//                       {/* RCS Preview */}
//                       {messageType === "rcs" && richCard.title && (
//                         <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-sm">
//                           <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
//                             {richCard.imageUrl && (
//                               <img
//                                 src={richCard.imageUrl || "/placeholder.svg?height=200&width=400&query=rcs card"}
//                                 alt="RCS Card"
//                                 className="w-full h-40 object-cover"
//                               />
//                             )}
//                             <div className="p-4 bg-white">
//                               <h4 className="font-bold text-slate-900 mb-2">{richCard.title}</h4>
//                               {richCard.subtitle && <p className="text-sm text-slate-600 mb-3">{richCard.subtitle}</p>}
//                               {richCard.actions.filter((a) => a.title.trim()).length > 0 && (
//                                 <div className="space-y-2">
//                                   {richCard.actions
//                                     .filter((a) => a.title.trim())
//                                     .map((action, index) => (
//                                       <button
//                                         key={index}
//                                         className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2"
//                                       >
//                                         <span>
//                                           {action.type === "call" ? "📞" : action.type === "url" ? "🔗" : "💬"}
//                                         </span>
//                                         <span>{action.title}</span>
//                                         <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
//                                           {action.type}
//                                         </span>
//                                       </button>
//                                     ))}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Carousel Preview */}
//                       {messageType === "carousel" && carouselItems.filter((item) => item.title.trim()).length > 0 && (
//                         <div className="max-w-sm">
//                           <div className="flex gap-3 overflow-x-auto pb-3">
//                             {carouselItems
//                               .filter((item) => item.title.trim())
//                               .map((item, index) => (
//                                 <div
//                                   key={index}
//                                   className="border-2 border-slate-200 rounded-xl min-w-[220px] overflow-hidden shadow-lg flex-shrink-0"
//                                 >
//                                   {item.imageUrl && (
//                                     <div className="relative">
//                                       <img
//                                         src={item.imageUrl || "/placeholder.svg?height=120&width=220&query=carousel"}
//                                         alt={`Item ${index + 1}`}
//                                         className="w-full h-28 object-cover"
//                                       />
//                                       <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
//                                         {index + 1}/{carouselItems.filter((i) => i.title.trim()).length}
//                                       </div>
//                                     </div>
//                                   )}
//                                   <div className="p-3 bg-white">
//                                     <h5 className="font-semibold text-sm text-slate-900">{item.title}</h5>
//                                     {item.subtitle && <p className="text-xs text-slate-600 mt-1">{item.subtitle}</p>}
//                                   </div>
//                                 </div>
//                               ))}
//                           </div>
//                           <div className="text-xs text-slate-500 text-center mt-2">← Swipe to see more →</div>
//                         </div>
//                       )}

//                       {/* Empty State */}
//                       {!formData.text &&
//                         !richCard.title &&
//                         carouselItems.filter((i) => i.title.trim()).length === 0 && (
//                           <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16">
//                             <FaFileAlt className="text-6xl mb-4 opacity-50" />
//                             <p className="text-sm">Start creating to see preview</p>
//                           </div>
//                         )}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
