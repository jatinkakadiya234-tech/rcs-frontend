import React, { useState, useEffect } from 'react'
import { FiCheck, FiUpload, FiX, FiEye, FiSend, FiPlus, FiTrash2 } from 'react-icons/fi'
import * as XLSX from 'xlsx'
import ModernTemplatePreview from '../components/ModernTemplatePreview'
import api from '../services/api'
 import { useAuth } from '../context/AuthContext'

const MESSAGE_TYPES = {
  
  'plain-text': 'Plain Text',
  'text-with-action': 'Text with Actions',
  'rcs': 'RCS Rich Card',
  'carousel': 'Carousel',
  'webview': 'Webview Action',
  'dialer-action': 'Dialer Action'
}

const BUTTON_TYPES = ['URL Button', 'Call Button', 'Quick Reply Button']

export default function SendMessageClean() {
  const { user, refreshUser } = useAuth()
  const [messageType, setMessageType] = useState('text')
  const [template, setTemplate] = useState('new')
/*  */  const [templates, setTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [message, setMessage] = useState('')
  const [contacts, setContacts] = useState([])
  const [excludeUnsub, setExcludeUnsub] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  
  // RCS Rich Card
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [footer, setFooter] = useState('')
  const [buttons, setButtons] = useState([])
  
  // Carousel
  const [carouselCards, setCarouselCards] = useState([])
  
  // Variables
  const [variables, setVariables] = useState({})
  
  // Response Modal
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [responseData, setResponseData] = useState(null)
  const [checkingCapability, setCheckingCapability] = useState(false)
  const [sending, setSending] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultData, setResultData] = useState(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates()
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleTemplateSelect = async (templateId) => {
    if (templateId === 'new') {
      setTemplate('new')
      setSelectedTemplate(null)
      setMessage('')
      setMessageType('text')
      setButtons([])
      setCarouselCards([])
      setMediaUrl('')
      setFooter('')
      return
    }

    try {
      const response = await api.getTemplateById(templateId)
      const templateData = response.data
      setSelectedTemplate(templateData)
      setTemplate(templateId)
      setMessageType(templateData.messageType)
      
      // Reset all fields
      setMessage('')
      setMediaUrl('')
      setFooter('')
      setButtons([])
      setCarouselCards([])
      
      // Set message based on type
      if (templateData.text) setMessage(templateData.text)
      if (templateData.richCard?.title) setMessage(templateData.richCard.title)
      if (templateData.richCard?.subtitle) setFooter(templateData.richCard.subtitle)
      if (templateData.richCard?.imageUrl) setMediaUrl(templateData.richCard.imageUrl)
      if (templateData.imageUrl) setMediaUrl(templateData.imageUrl)
      
      // Set buttons for RCS (from richCard.actions)
      if (templateData.richCard?.actions && templateData.richCard.actions.length > 0) {
        setButtons(templateData.richCard.actions.map((action, idx) => ({
          id: Date.now() + idx,
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || ''
        })))
      }
      // Set buttons for text-with-action (from actions)
      else if (templateData.actions && templateData.actions.length > 0) {
        setButtons(templateData.actions.map((action, idx) => ({
          id: Date.now() + idx,
          type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
          title: action.title,
          value: action.payload || ''
        })))
      }
      
      // Set carousel cards
      if (templateData.carouselItems && templateData.carouselItems.length > 0) {
        setCarouselCards(templateData.carouselItems.map((item, idx) => ({
          id: Date.now() + idx,
          title: item.title,
          description: item.subtitle || item.description || '',
          imageUrl: item.imageUrl || '',
          buttons: item.actions?.map((action, btnIdx) => ({
            id: Date.now() + idx + btnIdx,
            type: action.type === 'url' ? 'URL Button' : action.type === 'call' ? 'Call Button' : 'Quick Reply Button',
            title: action.title,
            value: action.payload || action.url || action.phoneNumber || ''
          })) || []
        })))
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Failed to load template')
    }
  }

  const uploadFile = async (file) => {
    try {
      const result = await api.uploadFile(file)
      return result.url
    } catch (error) {
      console.error('File upload error:', error)
      alert('File upload failed')
      return null
    }
  }

  const addContact = async () => {
    const newContact = { id: Date.now(), number: '+91', vars: {} }
    setContacts([...contacts, newContact])
  }


  const checkRcsCapability = async (numbers) => {
    try {
      const phoneNumbers  = numbers
      const response = await api.chackcapebalNumber(phoneNumbers)
      return response.data
      console.log(response.data);
    } catch (error) {
      console.error('Error checking RCS capability:', error)
      return null
    }
  }

  const updateContact = async (id, value) => {
    // Ensure +91 prefix
    if (!value.startsWith('+91') && value.length > 0) {
      value = '+91' + value.replace(/^\+?91?/, '')
    }
    
    // If user types 10 digits, auto-add +91
    if (/^\d{10}$/.test(value)) {
      value = '+91' + value
    }
    
    setContacts(contacts.map(c => c.id === id ? { ...c, number: value, checking: true } : c))
    
    // Check RCS capability if number is complete (10 digits after +91)
    if (value.length >= 13 && value.startsWith('+91')) {
      try {
        setCheckingCapability(true)
        const response = await checkRcsCapability([value])
       
        const rcsMessaging = response?.data?.rcsMessaging || response?.rcsMessaging
        const rcsData = rcsMessaging?.[value]
        
        const isCapable = rcsData?.features && rcsData.features.length > 0
        console.log('Is Capable:', isCapable)
        setContacts(prev => prev.map(c => 
          c.id === id ? { ...c, number: value, checking: false, capable: isCapable } : c
        ))
        
        // Remove if not capable
        if (!isCapable) {
          setTimeout(() => {
            setContacts(prev => prev.filter(c => c.id !== id))
          }, 1000)
        }
      } catch (error) {
        setContacts(prev => prev.map(c => 
          c.id === id ? { ...c, checking: false, capable: false } : c
        ))
      } finally {
        setCheckingCapability(false)
      }
    } else {
      setContacts(prev => prev.map(c => 
        c.id === id ? { ...c, checking: false, capable: null } : c
      ))
    }
  }

  const deleteContact = (id) => {
    setContacts(contacts.filter(c => c.id !== id))
  }

  const importExcel = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })
      
      const imported = []
      data.forEach((row, idx) => {
        if (idx === 0 || !row.length) return
        row.forEach(cell => {
          if (cell) {
            let num = String(cell).trim()
            // Add +91 prefix if not present
            if (!num.startsWith('+91') && /^\d{10}$/.test(num)) {
              num = '+91' + num
            }
            if (num && /^\+91\d{10}$/.test(num)) {
              imported.push(num)
            }
          }
        })
      })
      
      if (imported.length > 0) {
        setCheckingCapability(true)
        const capableNumbers = []
        for (const num of imported) {
          try {
            console.log('Checking imported number:', num)
            const capabilityResult = await checkRcsCapability([num])
            console.log('Import Response:', capabilityResult)
            const rcsMessaging = capabilityResult?.data?.rcsMessaging || capabilityResult?.rcsMessaging
            const rcsData = rcsMessaging?.[num]
            console.log('Import RCS Data:', rcsData)
            if (rcsData?.features && rcsData.features.length > 0) {
              console.log('Adding capable number:', num)
              capableNumbers.push({ id: Date.now() + Math.random(), number: num, vars: {}, capable: true })
            } else {
              console.log('Number not capable:', num)
            }
          } catch (error) {
            console.error('Error checking capability for', num)
          }
        }
        
        if (capableNumbers.length > 0) {
          setContacts([...contacts, ...capableNumbers])
          alert(`${capableNumbers.length} RCS capable numbers added out of ${imported.length} total`)
        } else {
          alert('No RCS capable numbers found in the imported file')
        }
        setCheckingCapability(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const clearAllContacts = () => {
    if (confirm('Are you sure you want to clear all contacts?')) {
      setContacts([])
    }
  }

  const addButton = () => {
    setButtons([...buttons, { id: Date.now(), type: 'URL Button', title: '', value: '' }])
  }

  const updateButton = (id, field, value) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const deleteButton = (id) => {
    setButtons(buttons.filter(b => b.id !== id))
  }

  const addCarouselCard = () => {
    setCarouselCards([...carouselCards, { id: Date.now(), title: '', description: '', image: null, buttons: [] }])
  }

  const updateCarouselCard = (id, field, value) => {
    setCarouselCards(carouselCards.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const deleteCarouselCard = (id) => {
    setCarouselCards(carouselCards.filter(c => c.id !== id))
  }

  const addCardButton = (cardId) => {
    setCarouselCards(carouselCards.map(c => 
      c.id === cardId ? { ...c, buttons: [...c.buttons, { id: Date.now(), type: 'URL Button', title: '', value: '' }] } : c
    ))
  }

  const updateCardButton = (cardId, btnId, field, value) => {
    setCarouselCards(carouselCards.map(c => 
      c.id === cardId ? { ...c, buttons: c.buttons.map(b => b.id === btnId ? { ...b, [field]: value } : b) } : c
    ))
  }

  const deleteCardButton = (cardId, btnId) => {
    setCarouselCards(carouselCards.map(c => 
      c.id === cardId ? { ...c, buttons: c.buttons.filter(b => b.id !== btnId) } : c
    ))
  }

  const handleSend = async () => {
    if (!message && messageType !== 'carousel') {
      setResultData({ success: false, message: 'Please enter a message' })
      setShowResultModal(true)
      return
    }
    if (contacts.length === 0) {
      setResultData({ success: false, message: 'Please add at least one contact' })
      setShowResultModal(true)
      return
    }
    
    const phoneCount = contacts.length
    const costPerPhone = 1
    const totalCost = phoneCount * costPerPhone
    
    if (user.Wallet < totalCost) {
      setResultData({ 
        success: false, 
        message: `Insufficient credits! Required: ₹${totalCost}, Available: ₹${user.Wallet}. Please recharge your wallet.` 
      })
      setShowResultModal(true)
      return
    }
    
    setSending(true)
    
    console.log('Selected Message Type:', messageType)
    
    let payload = {
      phoneNumbers: contacts.map(c => c.number),
      type: messageType,
      userId: user._id
    }
    
    if (messageType === 'carousel') {
      if (carouselCards.length < 2) {
        setSending(false)
        return alert('Carousel requires minimum 2 cards')
      }
      
      const validCards = carouselCards.filter(card => card.title && card.description && card.imageUrl)
      
      if (validCards.length < 2) {
        setSending(false)
        return alert('At least 2 cards must have title, description and image')
      }
      
      payload.content = {
        richCardDetails: {
          carousel: {
            cardWidth: "MEDIUM_WIDTH",
            contents: validCards.map((card, idx) => ({
              cardTitle: card.title,
              cardDescription: card.description,
              cardMedia: {
                contentInfo: {
                  fileUrl: card.imageUrl
                },
                mediaHeight: "MEDIUM"
              },
              suggestions: card.buttons
                .filter(btn => btn.title && btn.value)
                .map(btn => ({
                  action: {
                    plainText: btn.title,
                    postBack: {
                      data: `SA${idx + 1}L1C${idx + 1}`
                    },
                    openUrl: {
                      url: btn.value
                    }
                  }
                }))
            }))
          }
        }
      }
    } else if (messageType === 'rcs') {
      if (!mediaUrl || !mediaUrl.startsWith('http')) return alert('Please enter valid media URL starting with http/https')
      if (buttons.length === 0) return alert('Please add at least one button for RCS message')
      
      const validButtons = buttons.filter(btn => {
        if (!btn.title || !btn.value) return false
        if (btn.type === 'URL Button') return btn.value.startsWith('http')
        if (btn.type === 'Call Button') return btn.value.startsWith('+')
        return true
      })
      
      if (validButtons.length === 0) return alert('Please add at least one valid button (URL or Call)')
      
      payload.content = {
        richCardDetails: {
          standalone: {
            cardOrientation: 'VERTICAL',
            content: {
              cardTitle: message,
              cardMedia: {
                mediaHeight: 'TALL',
                contentInfo: {
                  fileUrl: mediaUrl
                }
              },
              suggestions: validButtons.map(btn => {
                if (btn.type === 'Call Button') {
                  return {
                    action: {
                      plainText: btn.title,
                      postBack: { data: 'call_action' },
                      dialerAction: { phoneNumber: btn.value }
                    }
                  }
                }
                return {
                  action: {
                    plainText: btn.title,
                    postBack: { data: btn.value },
                    openUrl: { url: btn.value }
                  }
                }
              })
            }
          }
        }
      }
    } else if (messageType === 'text-with-action') {
      if (buttons.length === 0) return alert('Please add at least one button for text with action')
      
      const validButtons = buttons.filter(btn => btn.title && btn.value)
      
      if (validButtons.length === 0) return alert('Please add at least one valid button')
      
      payload.content = {
        plainText: message,
        suggestions: validButtons.map(btn => {
          if (btn.type === 'Call Button') {
            return {
              action: {
                plainText: btn.title,
                postBack: { data: 'call_action' },
                dialerAction: {
                  phoneNumber: btn.value
                }
              }
            }
          }
          if (btn.type === 'URL Button') {
            return {
              action: {
                plainText: btn.title,
                postBack: { data: btn.value },
                openUrl: { url: btn.value }
              }
            }
          }
          return {
            reply: {
              plainText: btn.title,
              postBack: { data: btn.value }
            }
          }
        })
      }
    } else if (messageType === 'webview') {
      if (buttons.length === 0) return alert('Please add at least one button for webview message')
      
      const validButtons = buttons.filter(btn => {
        if (!btn.title) return false
        if (btn.type === 'URL Button') return btn.value && btn.value.startsWith('http')
        return btn.value
      })
      
      if (validButtons.length === 0) return alert('Please add at least one valid button')
      
      payload.content = {
        plainText: message,
        suggestions: validButtons.map(btn => ({
          action: {
            plainText: btn.title,
            postBack: { data: btn.value || 'SA1L1C1' },
            openUrl: {
              url: btn.value,
              application: 'WEBVIEW',
              webviewViewMode: 'TALL',
              description: btn.description || 'Click to open'
            }
          }
        }))
      }
    } else if (messageType === 'dialer-action') {
      if (buttons.length === 0) return alert('Please add at least one dialer button')
      
      const validButtons = buttons.filter(btn => btn.title && btn.value && btn.value.startsWith('+'))
      if (validButtons.length === 0) return alert('Please add at least one button with valid phone number starting with +')
      
      payload.content = {
        plainText: message,
        suggestions: validButtons.map(btn => ({
          action: {
            plainText: btn.title,
            postBack: { data: 'SA1L1C1' },
            dialerAction: {
              phoneNumber: btn.value
            }
          }
        }))
      }
    } else if (messageType === 'text') {
      payload.content = {
        plainText: message
      }
    }
    
    try {
      const response = await api.sendMessage(payload)
      if (response.data.success) {
        setResultData({ 
          success: true, 
          message: `Messages sent successfully! ₹${response.data.walletDeducted} credits deducted.`,
          details: `Message sent to ${phoneCount} phone numbers`
        })
        await refreshUser()
      }
      setShowResultModal(true)
    } catch (error) {
      console.error('Error sending message:', error)
      if (error.response?.data?.message === 'Insufficient balance') {
        setResultData({ 
          success: false, 
          message: `Insufficient credits! Required: ₹${error.response.data.required}, Available: ₹${error.response.data.available}` 
        })
      } else {
        setResultData({ success: false, message: error.message || 'Failed to send message' })
      }
      setShowResultModal(true)
    } finally {
      setSending(false)
    }
  }

  const renderMessageEditor = () => {
    if (messageType === 'carousel') {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Carousel Cards</h3>
            <button onClick={addCarouselCard} className="px-2 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 md:gap-2 text-sm md:text-base">
              <FiPlus /> Add Card
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {carouselCards.map((card, idx) => (
              <div key={card.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-sm">Card {idx + 1}</span>
                  <button onClick={() => deleteCarouselCard(card.id)} className="text-red-500 hover:text-red-700">
                    <FiTrash2 />
                  </button>
                </div>
                
                <input
                  type="text"
                  placeholder="Card Title"
                  value={card.title}
                  onChange={(e) => updateCarouselCard(card.id, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500"
                />
                
                <textarea
                  placeholder="Card Description"
                  value={card.description}
                  onChange={(e) => updateCarouselCard(card.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-purple-500"
                  rows={2}
                />
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const uploadedUrl = await uploadFile(file)
                      if (uploadedUrl) {
                        updateCarouselCard(card.id, 'imageUrl', uploadedUrl)
                      }
                    }
                  }}
                  className="w-full text-sm mb-3"
                />
                
                <div className="space-y-2">
                  {card.buttons.map(btn => (
                    <div key={btn.id} className="flex gap-2">
                      <select value={btn.type} onChange={(e) => updateCardButton(card.id, btn.id, 'type', e.target.value)} className="px-2 py-1 border rounded text-sm">
                        <option value="URL Button">URL Button</option>
                        <option value="Quick Reply Button">Quick Reply</option>
                      </select>
                      <input type="text" placeholder="Title" value={btn.title} onChange={(e) => updateCardButton(card.id, btn.id, 'title', e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm" />
                      <input type="text" placeholder="https://example.com" value={btn.value || ''} onChange={(e) => updateCardButton(card.id, btn.id, 'value', e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm" />
                      <button onClick={() => deleteCardButton(card.id, btn.id)} className="text-red-500"><FiX /></button>
                    </div>
                  ))}
                  <button onClick={() => addCardButton(card.id)} className="text-sm text-purple-600 hover:text-purple-700">+ Add Button</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (messageType === 'rcs') {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Media URL</label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Or Upload Media</label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={async (e) => {
                  const file = e.target.files[0]
                  if (file) {
                    const uploadedUrl = await uploadFile(file)
                    if (uploadedUrl) {
                      setMediaUrl(uploadedUrl)
                      setMediaFile(null)
                    }
                  }
                }}
                className="w-full text-sm"
              />
            </div>
          </div>
          
          <input
            type="text"
            value={footer}
            onChange={(e) => setFooter(e.target.value)}
            placeholder="Footer text (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Action Buttons</label>
              <button onClick={addButton} className="text-sm text-blue-600 hover:text-blue-700">+ Add Button</button>
            </div>
            {buttons.map(btn => (
              <div key={btn.id} className="flex gap-2 mb-2">
                <select value={btn.type} onChange={(e) => updateButton(btn.id, 'type', e.target.value)} className="px-3 py-2 border rounded-lg">
                  {BUTTON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="text" placeholder="Button Title" value={btn.title} onChange={(e) => updateButton(btn.id, 'title', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                <input type="text" placeholder={btn.type === 'Call Button' ? '+919876543210' : 'https://example.com'} value={btn.value || ''} onChange={(e) => updateButton(btn.id, 'value', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                <button onClick={() => deleteButton(btn.id)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (messageType === 'text-with-action') {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Action Buttons</label>
              <button onClick={addButton} className="text-sm text-blue-600 hover:text-blue-700">+ Add Button</button>
            </div>
            {buttons.map(btn => (
              <div key={btn.id} className="flex gap-2 mb-2">
                <select value={btn.type} onChange={(e) => updateButton(btn.id, 'type', e.target.value)} className="px-3 py-2 border rounded-lg">
                  {BUTTON_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="text" placeholder="Button Title" value={btn.title} onChange={(e) => updateButton(btn.id, 'title', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                <input type="text" placeholder="URL/Phone" value={btn.value} onChange={(e) => updateButton(btn.id, 'value', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                <button onClick={() => deleteButton(btn.id)} className="text-red-500 hover:text-red-700"><FiTrash2 /></button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (messageType === 'webview') {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Visit this URL to find more about Jiosphere"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Webview Buttons</label>
              <button onClick={addButton} className="text-sm text-blue-600 hover:text-blue-700">+ Add Button</button>
            </div>
            {buttons.map(btn => (
              <div key={btn.id} className="space-y-2 mb-4 p-3 border rounded-lg bg-blue-50">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Button Title" value={btn.title} onChange={(e) => updateButton(btn.id, 'title', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <button onClick={() => deleteButton(btn.id)} className="text-red-500 hover:text-red-700 self-start sm:self-center"><FiTrash2 /></button>
                </div>
                <input type="text" placeholder="https://example.com" value={btn.value || ''} onChange={(e) => updateButton(btn.id, 'value', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                <input type="text" placeholder="Description (optional)" value={btn.description || ''} onChange={(e) => updateButton(btn.id, 'description', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (messageType === 'dialer-action') {
      return (
        <div className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Call this Number to Know More about Jio Assistants"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Dialer Action Button</label>
              <button onClick={addButton} className="text-sm text-blue-600 hover:text-blue-700">+ Add Button</button>
            </div>
            {buttons.map(btn => (
              <div key={btn.id} className="space-y-2 mb-4 p-3 border rounded-lg bg-green-50">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Button Title (e.g., Dial Now)" value={btn.title} onChange={(e) => updateButton(btn.id, 'title', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg" />
                  <button onClick={() => deleteButton(btn.id)} className="text-red-500 hover:text-red-700 self-start sm:self-center"><FiTrash2 /></button>
                </div>
                <input type="text" placeholder="+916367992981" value={btn.value || ''} onChange={(e) => updateButton(btn.id, 'value', e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message"
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        rows={6}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Message</h1>
              <p className="text-gray-600">Create and send RCS messages to your contacts</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-sm md:text-base">
                <span className="text-gray-600">Balance: ₹{user?.Wallet || 0}</span>
                <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                  Add Money
                </button>
                <button className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600">
                  Refresh
                </button>
              </div>
              <button onClick={() => setShowPreview(!showPreview)} className="px-2 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                <FiEye /> {showPreview ? 'Hide' : 'Show'} Preview
              </button>
              <button 
                onClick={handleSend} 
                disabled={sending}
                className="px-3 md:px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 flex items-center gap-1 md:gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend /> Send Message
                  </>
                )}
              </button>
            </div>
          </div>

          {showPreview && (
            <ModernTemplatePreview
              selectedTemplate={{ name: MESSAGE_TYPES[messageType] }}
              message={message}
              messageType={MESSAGE_TYPES[messageType]}
              templateMedia={mediaUrl ? { type: 'url', url: mediaUrl } : mediaFile ? { type: 'file', name: mediaFile.name } : null}
              templateButtons={buttons}
              templateFooter={footer}
              carouselCards={carouselCards}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <select 
                value={template} 
                onChange={(e) => handleTemplateSelect(e.target.value)} 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="new">New Message</option>
                {templates.map(tmpl => (
                  <option key={tmpl._id} value={tmpl._id}>
                    {tmpl.name} ({MESSAGE_TYPES[tmpl.messageType] || tmpl.messageType})
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedTemplate.name} - {MESSAGE_TYPES[selectedTemplate.messageType]}
                  </p>
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2"><span className="text-red-500">*</span> Message Type</label>
              <select value={messageType} onChange={(e) => setMessageType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {Object.entries(MESSAGE_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <FiCheck className="absolute right-10 top-11 text-green-500" size={20} />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm font-medium text-gray-700"><span className="text-red-500">*</span> Contacts ({contacts.length})</label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={excludeUnsub} onChange={(e) => setExcludeUnsub(e.target.checked)} className="w-4 h-4" />
                  <span className="text-sm text-gray-700">Exclude Unsubscribes</span>
                </label>
                <button onClick={clearAllContacts} className="px-2 md:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  <FiTrash2 /> Clear All
                </button>
                <label className={`px-2 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-1 md:gap-2 text-sm md:text-base ${checkingCapability ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {checkingCapability ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Checking...
                    </>
                  ) : (
                    <>
                      <FiUpload /> Import Excel
                    </>
                  )}
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" disabled={checkingCapability} />
                </label>
                <button onClick={addContact} className={`px-2 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 md:gap-2 text-sm md:text-base ${checkingCapability ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={checkingCapability}>
                  <FiPlus /> Add Contact
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">SN</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Phone Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, idx) => (
                      <tr key={contact.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm border-b">{idx + 1}</td>
                        <td className="px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={contact.number} 
                              onChange={(e) => updateContact(contact.id, e.target.value)} 
                              placeholder="+91xxxxxxxxxx" 
                              className={`w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 ${
                                contact.capable === true ? 'border-green-500 bg-green-50' : 
                                contact.capable === false ? 'border-red-500 bg-red-50' : ''
                              }`} 
                            />
                            {contact.checking && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                            {contact.capable === true && <span className="text-green-600 text-sm">✓</span>}
                            {contact.capable === false && <span className="text-red-600 text-sm">✗</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2 border-b">
                          <button onClick={() => deleteContact(contact.id)} className="text-red-600 hover:text-red-800">
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div>
            {checkingCapability && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Checking RCS capability...</span>
              </div>
            )}
            
            <label className="block text-sm font-medium text-gray-700 mb-3"><span className="text-red-500">*</span> Message Content</label>
            {renderMessageEditor()}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                resultData?.success ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {resultData?.success ? (
                  <FiCheck className="text-3xl text-green-600" />
                ) : (
                  <FiX className="text-3xl text-red-600" />
                )}
              </div>
              
              <h3 className={`text-lg font-semibold mb-2 ${
                resultData?.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {resultData?.success ? 'Success!' : 'Error!'}
              </h3>
              
              <p className="text-gray-600 mb-4">{resultData?.message}</p>
              
              {resultData?.details && (
                <p className="text-sm text-gray-500 mb-4">{resultData.details}</p>
              )}
              
              <button
                onClick={() => setShowResultModal(false)}
                className={`px-6 py-2 rounded-lg text-white font-medium ${
                  resultData?.success 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
