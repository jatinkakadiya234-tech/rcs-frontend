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
      console.log(response.data);
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
      setError('Template name is required')
      return
    }
    
    if (!formData.text.trim()) {
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
        setError('Each carousel item must have at least one valid action with title and payload')
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
      toast.error(err.response?.data?.message || err.message || 'Failed to save template')
      setError(err.response?.data?.message || err.message || 'Failed to save template')
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
                <div className="bg-green-500 text-white p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-500 font-bold text-sm">W</span>
                    </div>
                    <span className="font-medium">WhatsApp Business</span>
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

                {/* Message Editor */}
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
                                newActions[index].type = e.target.value
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
                              setRichCard({...richCard, imageUrl: URL.createObjectURL(file), imageFile: file})
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
                            <img src={richCard.imageUrl} alt="Preview" className="max-w-xs rounded-lg border-2 border-gray-300" />
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
                                    newActions[index].type = e.target.value
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
                              onChange={(e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  const newItems = [...carouselItems]
                                  newItems[index].imageUrl = URL.createObjectURL(file)
                                  newItems[index].imageFile = file
                                  setCarouselItems(newItems)
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
                            {item.imageUrl && (
                              <div className="mt-3">
                                <img src={item.imageUrl} alt="Preview" className="w-full rounded-lg border-2 h-30 border-gray-300" />
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
                                  newItems[index].actions[actionIndex].type = e.target.value
                                  setCarouselItems(newItems)
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-xs"
                              >
                                <option value="url">URL</option>
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
         s
              
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="bg-green-500 text-white p-3 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-500 font-bold text-sm">W</span>
                    </div>
                    <span className="font-medium">WhatsApp Business</span>
                  </div>
                </div>
                
                <div className="p-4 min-h-[400px]">
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
    </div>
  )
}
