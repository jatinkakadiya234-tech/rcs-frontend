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
  const [refreshing, setRefreshing] = useState(false)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [showManualImport, setShowManualImport] = useState(false)
  const [manualNumbers, setManualNumbers] = useState('')
  const [parsedNumbers, setParsedNumbers] = useState([])
  const [showCountryCode, setShowCountryCode] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('')

  const countryCodes = [
    { code: '+1', name: 'United States of America', short: 'US' },
    { code: '+7', name: 'Russia', short: 'RU' },
    { code: '+20', name: 'Egypt', short: 'EG' },
    { code: '+27', name: 'South Africa', short: 'ZA' },
    { code: '+30', name: 'Greece', short: 'GR' },
    { code: '+31', name: 'Netherlands', short: 'NL' },
    { code: '+32', name: 'Belgium', short: 'BE' },
    { code: '+33', name: 'France', short: 'FR' },
    { code: '+34', name: 'Spain', short: 'ES' },
    { code: '+36', name: 'Hungary', short: 'HU' },
    { code: '+39', name: 'Italy', short: 'IT' },
    { code: '+40', name: 'Romania', short: 'RO' },
    { code: '+41', name: 'Switzerland', short: 'CH' },
    { code: '+43', name: 'Austria', short: 'AT' },
    { code: '+44', name: 'United Kingdom', short: 'GB' },
    { code: '+45', name: 'Denmark', short: 'DK' },
    { code: '+46', name: 'Sweden', short: 'SE' },
    { code: '+47', name: 'Norway', short: 'NO' },
    { code: '+48', name: 'Poland', short: 'PL' },
    { code: '+49', name: 'Germany', short: 'DE' },
    { code: '+51', name: 'Peru', short: 'PE' },
    { code: '+52', name: 'Mexico', short: 'MX' },
    { code: '+53', name: 'Cuba', short: 'CU' },
    { code: '+54', name: 'Argentina', short: 'AR' },
    { code: '+55', name: 'Brazil', short: 'BR' },
    { code: '+56', name: 'Chile', short: 'CL' },
    { code: '+57', name: 'Colombia', short: 'CO' },
    { code: '+58', name: 'Venezuela', short: 'VE' },
    { code: '+60', name: 'Malaysia', short: 'MY' },
    { code: '+61', name: 'Australia', short: 'AU' },
    { code: '+62', name: 'Indonesia', short: 'ID' },
    { code: '+63', name: 'Philippines', short: 'PH' },
    { code: '+64', name: 'New Zealand', short: 'NZ' },
    { code: '+65', name: 'Singapore', short: 'SG' },
    { code: '+66', name: 'Thailand', short: 'TH' },
    { code: '+81', name: 'Japan', short: 'JP' },
    { code: '+82', name: 'South Korea', short: 'KR' },
    { code: '+84', name: 'Vietnam', short: 'VN' },
    { code: '+86', name: 'China', short: 'CN' },
    { code: '+90', name: 'Turkey', short: 'TR' },
    { code: '+91', name: 'India', short: 'IN' },
    { code: '+92', name: 'Pakistan', short: 'PK' },
    { code: '+93', name: 'Afghanistan', short: 'AF' },
    { code: '+94', name: 'Sri Lanka', short: 'LK' },
    { code: '+95', name: 'Myanmar', short: 'MM' },
    { code: '+98', name: 'Iran', short: 'IR' },
    { code: '+212', name: 'Morocco', short: 'MA' },
    { code: '+213', name: 'Algeria', short: 'DZ' },
    { code: '+216', name: 'Tunisia', short: 'TN' },
    { code: '+218', name: 'Libya', short: 'LY' },
    { code: '+220', name: 'Gambia', short: 'GM' },
    { code: '+221', name: 'Senegal', short: 'SN' },
    { code: '+222', name: 'Mauritania', short: 'MR' },
    { code: '+223', name: 'Mali', short: 'ML' },
    { code: '+224', name: 'Guinea', short: 'GN' },
    { code: '+225', name: 'Ivory Coast', short: 'CI' },
    { code: '+226', name: 'Burkina Faso', short: 'BF' },
    { code: '+227', name: 'Niger', short: 'NE' },
    { code: '+228', name: 'Togo', short: 'TG' },
    { code: '+229', name: 'Benin', short: 'BJ' },
    { code: '+230', name: 'Mauritius', short: 'MU' },
    { code: '+231', name: 'Liberia', short: 'LR' },
    { code: '+232', name: 'Sierra Leone', short: 'SL' },
    { code: '+233', name: 'Ghana', short: 'GH' },
    { code: '+234', name: 'Nigeria', short: 'NG' },
    { code: '+235', name: 'Chad', short: 'TD' },
    { code: '+236', name: 'Central African Republic', short: 'CF' },
    { code: '+237', name: 'Cameroon', short: 'CM' },
    { code: '+238', name: 'Cape Verde', short: 'CV' },
    { code: '+239', name: 'Sao Tome and Principe', short: 'ST' },
    { code: '+240', name: 'Equatorial Guinea', short: 'GQ' },
    { code: '+241', name: 'Gabon', short: 'GA' },
    { code: '+242', name: 'Republic of the Congo', short: 'CG' },
    { code: '+243', name: 'Democratic Republic of the Congo', short: 'CD' },
    { code: '+244', name: 'Angola', short: 'AO' },
    { code: '+245', name: 'Guinea-Bissau', short: 'GW' },
    { code: '+246', name: 'British Indian Ocean Territory', short: 'IO' },
    { code: '+248', name: 'Seychelles', short: 'SC' },
    { code: '+249', name: 'Sudan', short: 'SD' },
    { code: '+250', name: 'Rwanda', short: 'RW' },
    { code: '+251', name: 'Ethiopia', short: 'ET' },
    { code: '+252', name: 'Somalia', short: 'SO' },
    { code: '+253', name: 'Djibouti', short: 'DJ' },
    { code: '+254', name: 'Kenya', short: 'KE' },
    { code: '+255', name: 'Tanzania', short: 'TZ' },
    { code: '+256', name: 'Uganda', short: 'UG' },
    { code: '+257', name: 'Burundi', short: 'BI' },
    { code: '+258', name: 'Mozambique', short: 'MZ' },
    { code: '+260', name: 'Zambia', short: 'ZM' },
    { code: '+261', name: 'Madagascar', short: 'MG' },
    { code: '+262', name: 'Reunion', short: 'RE' },
    { code: '+263', name: 'Zimbabwe', short: 'ZW' },
    { code: '+264', name: 'Namibia', short: 'NA' },
    { code: '+265', name: 'Malawi', short: 'MW' },
    { code: '+266', name: 'Lesotho', short: 'LS' },
    { code: '+267', name: 'Botswana', short: 'BW' },
    { code: '+268', name: 'Swaziland', short: 'SZ' },
    { code: '+269', name: 'Comoros', short: 'KM' },
    { code: '+290', name: 'Saint Helena', short: 'SH' },
    { code: '+291', name: 'Eritrea', short: 'ER' },
    { code: '+297', name: 'Aruba', short: 'AW' },
    { code: '+298', name: 'Faroe Islands', short: 'FO' },
    { code: '+299', name: 'Greenland', short: 'GL' },
    { code: '+350', name: 'Gibraltar', short: 'GI' },
    { code: '+351', name: 'Portugal', short: 'PT' },
    { code: '+352', name: 'Luxembourg', short: 'LU' },
    { code: '+353', name: 'Ireland', short: 'IE' },
    { code: '+354', name: 'Iceland', short: 'IS' },
    { code: '+355', name: 'Albania', short: 'AL' },
    { code: '+356', name: 'Malta', short: 'MT' },
    { code: '+357', name: 'Cyprus', short: 'CY' },
    { code: '+358', name: 'Finland', short: 'FI' },
    { code: '+359', name: 'Bulgaria', short: 'BG' },
    { code: '+370', name: 'Lithuania', short: 'LT' },
    { code: '+371', name: 'Latvia', short: 'LV' },
    { code: '+372', name: 'Estonia', short: 'EE' },
    { code: '+373', name: 'Moldova', short: 'MD' },
    { code: '+374', name: 'Armenia', short: 'AM' },
    { code: '+375', name: 'Belarus', short: 'BY' },
    { code: '+376', name: 'Andorra', short: 'AD' },
    { code: '+377', name: 'Monaco', short: 'MC' },
    { code: '+378', name: 'San Marino', short: 'SM' },
    { code: '+380', name: 'Ukraine', short: 'UA' },
    { code: '+381', name: 'Serbia', short: 'RS' },
    { code: '+382', name: 'Montenegro', short: 'ME' },
    { code: '+383', name: 'Kosovo', short: 'XK' },
    { code: '+385', name: 'Croatia', short: 'HR' },
    { code: '+386', name: 'Slovenia', short: 'SI' },
    { code: '+387', name: 'Bosnia and Herzegovina', short: 'BA' },
    { code: '+389', name: 'North Macedonia', short: 'MK' },
    { code: '+420', name: 'Czech Republic', short: 'CZ' },
    { code: '+421', name: 'Slovakia', short: 'SK' },
    { code: '+423', name: 'Liechtenstein', short: 'LI' },
    { code: '+500', name: 'Falkland Islands', short: 'FK' },
    { code: '+501', name: 'Belize', short: 'BZ' },
    { code: '+502', name: 'Guatemala', short: 'GT' },
    { code: '+503', name: 'El Salvador', short: 'SV' },
    { code: '+504', name: 'Honduras', short: 'HN' },
    { code: '+505', name: 'Nicaragua', short: 'NI' },
    { code: '+506', name: 'Costa Rica', short: 'CR' },
    { code: '+507', name: 'Panama', short: 'PA' },
    { code: '+508', name: 'Saint Pierre and Miquelon', short: 'PM' },
    { code: '+509', name: 'Haiti', short: 'HT' },
    { code: '+590', name: 'Guadeloupe', short: 'GP' },
    { code: '+591', name: 'Bolivia', short: 'BO' },
    { code: '+592', name: 'Guyana', short: 'GY' },
    { code: '+593', name: 'Ecuador', short: 'EC' },
    { code: '+594', name: 'French Guiana', short: 'GF' },
    { code: '+595', name: 'Paraguay', short: 'PY' },
    { code: '+596', name: 'Martinique', short: 'MQ' },
    { code: '+597', name: 'Suriname', short: 'SR' },
    { code: '+598', name: 'Uruguay', short: 'UY' },
    { code: '+599', name: 'Netherlands Antilles', short: 'AN' },
    { code: '+670', name: 'East Timor', short: 'TL' },
    { code: '+672', name: 'Antarctica', short: 'AQ' },
    { code: '+673', name: 'Brunei', short: 'BN' },
    { code: '+674', name: 'Nauru', short: 'NR' },
    { code: '+675', name: 'Papua New Guinea', short: 'PG' },
    { code: '+676', name: 'Tonga', short: 'TO' },
    { code: '+677', name: 'Solomon Islands', short: 'SB' },
    { code: '+678', name: 'Vanuatu', short: 'VU' },
    { code: '+679', name: 'Fiji', short: 'FJ' },
    { code: '+680', name: 'Palau', short: 'PW' },
    { code: '+681', name: 'Wallis and Futuna', short: 'WF' },
    { code: '+682', name: 'Cook Islands', short: 'CK' },
    { code: '+683', name: 'Niue', short: 'NU' },
    { code: '+685', name: 'Samoa', short: 'WS' },
    { code: '+686', name: 'Kiribati', short: 'KI' },
    { code: '+687', name: 'New Caledonia', short: 'NC' },
    { code: '+688', name: 'Tuvalu', short: 'TV' },
    { code: '+689', name: 'French Polynesia', short: 'PF' },
    { code: '+690', name: 'Tokelau', short: 'TK' },
    { code: '+691', name: 'Micronesia', short: 'FM' },
    { code: '+692', name: 'Marshall Islands', short: 'MH' },
    { code: '+850', name: 'North Korea', short: 'KP' },
    { code: '+852', name: 'Hong Kong', short: 'HK' },
    { code: '+853', name: 'Macau', short: 'MO' },
    { code: '+855', name: 'Cambodia', short: 'KH' },
    { code: '+856', name: 'Laos', short: 'LA' },
    { code: '+880', name: 'Bangladesh', short: 'BD' },
    { code: '+886', name: 'Taiwan', short: 'TW' },
    { code: '+960', name: 'Maldives', short: 'MV' },
    { code: '+961', name: 'Lebanon', short: 'LB' },
    { code: '+962', name: 'Jordan', short: 'JO' },
    { code: '+963', name: 'Syria', short: 'SY' },
    { code: '+964', name: 'Iraq', short: 'IQ' },
    { code: '+965', name: 'Kuwait', short: 'KW' },
    { code: '+966', name: 'Saudi Arabia', short: 'SA' },
    { code: '+967', name: 'Yemen', short: 'YE' },
    { code: '+968', name: 'Oman', short: 'OM' },
    { code: '+970', name: 'Palestinian Territory', short: 'PS' },
    { code: '+971', name: 'United Arab Emirates', short: 'AE' },
    { code: '+972', name: 'Israel', short: 'IL' },
    { code: '+973', name: 'Bahrain', short: 'BH' },
    { code: '+974', name: 'Qatar', short: 'QA' },
    { code: '+975', name: 'Bhutan', short: 'BT' },
    { code: '+976', name: 'Mongolia', short: 'MN' },
    { code: '+977', name: 'Nepal', short: 'NP' },
    { code: '+992', name: 'Tajikistan', short: 'TJ' },
    { code: '+993', name: 'Turkmenistan', short: 'TM' },
    { code: '+994', name: 'Azerbaijan', short: 'AZ' },
    { code: '+995', name: 'Georgia', short: 'GE' },
    { code: '+996', name: 'Kyrgyzstan', short: 'KG' },
    { code: '+998', name: 'Uzbekistan', short: 'UZ' },
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.getTemplates()
      setTemplates(response.data || [])
    } catch (error) {
      setResultData({ success: false, message: 'Error loading templates: ' + error.message })
      setShowResultModal(true)
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
      setResultData({ success: false, message: 'Failed to load template: ' + error.message })
      setShowResultModal(true)
    }
  }

  const uploadFile = async (file) => {
    try {
      const result = await api.uploadFile(file)
      return result.url
    } catch (error) {
      setResultData({ success: false, message: 'File upload failed: ' + error.message })
      setShowResultModal(true)
      return null
    }
  }

  const parseManualNumbers = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    const parsed = []
    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.includes(',')) {
        const [name, num] = trimmed.split(',').map(s => s.trim())
        let number = num || ''
        if (!number.startsWith('+') && /^\d{10}$/.test(number)) {
          number = '+91' + number
        }
        if (number && /^\+\d{1,4}\d{7,15}$/.test(number)) {
          parsed.push({ id: Date.now() + idx + Math.random(), name: name || '', number })
        }
      } else {
        let number = trimmed
        if (!number.startsWith('+') && /^\d{10}$/.test(number)) {
          number = '+91' + number
        }
        if (number && /^\+\d{1,4}\d{7,15}$/.test(number)) {
          parsed.push({ id: Date.now() + idx + Math.random(), name: '', number })
        }
      }
    })
    setParsedNumbers(parsed)
  }

  const importManualNumbers = async () => {
    if (parsedNumbers.length === 0) return
    
    setCheckingCapability(true)
    const capableNumbers = []
    
    for (const item of parsedNumbers) {
      try {
        const capabilityResult = await checkRcsCapability([item.number])
        const rcsMessaging = capabilityResult?.data?.rcsMessaging || capabilityResult?.rcsMessaging
        const rcsData = rcsMessaging?.[item.number]
        
        if (rcsData?.features && rcsData.features.length > 0) {
          capableNumbers.push({ id: Date.now() + Math.random(), number: item.number, vars: {}, capable: true })
        }
      } catch (error) {
        // Silent error
      }
    }
    
    setContacts([...contacts, ...capableNumbers])
    setCheckingCapability(false)
    setShowManualImport(false)
    setManualNumbers('')
    setParsedNumbers([])
    
    if (capableNumbers.length > 0) {
      setResultData({ 
        success: true, 
        message: `${capableNumbers.length} RCS capable numbers added out of ${parsedNumbers.length} total` 
      })
    } else {
      setResultData({ 
        success: false, 
        message: 'No RCS capable numbers found' 
      })
    }
    setShowResultModal(true)
  }

  const applyCountryCode = () => {
    if (!selectedCountryCode) return
    
    const updatedContacts = contacts.map(contact => {
      let num = contact.number
      // Remove existing country code if present
      if (num.startsWith('+')) {
        // Find where country code ends (after +, take 1-4 digits)
        const match = num.match(/^\+(\d{1,4})(\d+)$/)
        if (match) {
          num = match[2] // Keep only the phone number part
        }
      }
      // Remove any leading zeros or spaces
      num = num.replace(/^[\s0]+/, '')
      // Add new country code
      return { ...contact, number: selectedCountryCode + num }
    })
    setContacts(updatedContacts)
    setShowCountryCode(false)
    setCountrySearch('')
  }

  const filteredCountries = countryCodes.filter(country => 
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.short.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  )


  const checkRcsCapability = async (numbers) => {
    try {
      const phoneNumbers  = numbers
      const response = await api.chackcapebalNumber(phoneNumbers)
      return response.data

    } catch (error) {
      setResultData({ success: false, message: 'Error checking RCS capability: ' + error.message })
      setShowResultModal(true)
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
            // Silent error for individual number checks
          }
        }
        
        if (capableNumbers.length > 0) {
          setContacts([...contacts, ...capableNumbers])
          setResultData({ 
            success: true, 
            message: `${capableNumbers.length} RCS capable numbers added out of ${imported.length} total` 
          })
          setShowResultModal(true)
        } else {
          setResultData({ 
            success: false, 
            message: 'No RCS capable numbers found in the imported file' 
          })
          setShowResultModal(true)
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

  const removeDuplicates = () => {
    const uniqueNumbers = new Map()
    contacts.forEach(contact => {
      if (contact.number && contact.number.length >= 13) {
        uniqueNumbers.set(contact.number, contact)
      }
    })
    const uniqueContacts = Array.from(uniqueNumbers.values())
    const removedCount = contacts.length - uniqueContacts.length
    setContacts(uniqueContacts)
    if (removedCount > 0) {
      setResultData({ 
        success: true, 
        message: `${removedCount} duplicate number(s) removed successfully!` 
      })
      setShowResultModal(true)
    } else {
      setResultData({ 
        success: false, 
        message: 'No duplicate numbers found' 
      })
      setShowResultModal(true)
    }
  }

  const downloadDemoExcel = () => {
    const demoData = [
      ['Index', 'Number'],
      ['1', '7201000140']
    ]
    const ws = XLSX.utils.aoa_to_sheet(demoData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
    XLSX.writeFile(wb, 'demo_contacts.xlsx')
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
    if (!campaignName.trim()) {
      setResultData({ success: false, message: 'Please enter campaign name' })
      setShowResultModal(true)
      return
    }
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
        setResultData({ success: false, message: 'Carousel requires minimum 2 cards' })
        setShowResultModal(true)
        return
      }
      
      const validCards = carouselCards.filter(card => card.title && card.description && card.imageUrl)
      
      if (validCards.length < 2) {
        setSending(false)
        setResultData({ success: false, message: 'At least 2 cards must have title, description and image' })
        setShowResultModal(true)
        return
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
      if (!mediaUrl || !mediaUrl.startsWith('http')) {
        setSending(false)
        setResultData({ success: false, message: 'Please upload a valid media file' })
        setShowResultModal(true)
        return
      }
      if (buttons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one button for RCS message' })
        setShowResultModal(true)
        return
      }
      
      const validButtons = buttons.filter(btn => {
        if (!btn.title || !btn.value) return false
        if (btn.type === 'URL Button') return btn.value.startsWith('http')
        if (btn.type === 'Call Button') return btn.value.startsWith('+')
        return true
      })
      
      if (validButtons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one valid button (URL or Call)' })
        setShowResultModal(true)
        return
      }
      
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
      if (buttons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one button for text with action' })
        setShowResultModal(true)
        return
      }
      
      const validButtons = buttons.filter(btn => btn.title && btn.value)
      
      if (validButtons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one valid button' })
        setShowResultModal(true)
        return
      }
      
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
      if (buttons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one button for webview message' })
        setShowResultModal(true)
        return
      }
      
      const validButtons = buttons.filter(btn => {
        if (!btn.title) return false
        if (btn.type === 'URL Button') return btn.value && btn.value.startsWith('http')
        return btn.value
      })
      
      if (validButtons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one valid button' })
        setShowResultModal(true)
        return
      }
      
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
      if (buttons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one dialer button' })
        setShowResultModal(true)
        return
      }
      
      const validButtons = buttons.filter(btn => btn.title && btn.value && btn.value.startsWith('+'))
      if (validButtons.length === 0) {
        setSending(false)
        setResultData({ success: false, message: 'Please add at least one button with valid phone number starting with +' })
        setShowResultModal(true)
        return
      }
      
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
          
          <div className="border-2 border-dashed border-purple-600 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50 hover:border-blue-400 transition-colors">
            <label className="cursor-pointer">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <FiUpload className="text-3xl text-purple-600" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">Upload Media File</p>
                <p className="text-xs text-gray-500 mb-3">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-400">Supports: Images & Videos</p>
              </div>
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
                className="hidden"
              />
            </label>
            {mediaUrl && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <FiCheck className="text-green-600" />
                <span className="text-sm text-green-700 font-medium">Media uploaded successfully!</span>
              </div>
            )}
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
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm md:text-base">Balance: ₹{user?.Wallet?.toFixed(2) || '0.00'}</span>
                <button 
                  onClick={() => setShowAddMoney(true)}
                  className="px-2 md:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm md:text-base"
                >
                  Add Money
                </button>
                <button 
                  onClick={async () => {
                    setRefreshing(true)
                    await refreshUser()
                    setRefreshing(false)
                  }}
                  disabled={refreshing}
                  className="px-2 md:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-1 text-sm md:text-base"
                >
                  {refreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden md:inline">Refreshing</span>
                    </>
                  ) : 'Refresh'}
                </button>
                <button 
                  onClick={downloadDemoExcel}
                  className="px-2 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1 text-sm md:text-base"
                >
                  <FiUpload /> Demo
                </button>
              </div>
              <button onClick={() => setShowPreview(!showPreview)} className="px-2 md:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                <FiEye /> {showPreview ? 'Hide' : 'Show'} Preview
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
                
                <button onClick={removeDuplicates} className="px-2 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  <FiX /> Remove Duplicates
                </button>
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
                <button onClick={() => setShowManualImport(true)} className={`px-2 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 md:gap-2 text-sm md:text-base ${checkingCapability ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={checkingCapability}>
                  <FiPlus /> Manual Import
                </button>
                <button onClick={() => setShowCountryCode(true)} className="px-2 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 md:gap-2 text-sm md:text-base">
                  Insert Country Code
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

          {/* Campaign Name and Send Button */}
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="w-full md:w-96">
              <label className="block text-sm font-medium text-gray-700 mb-2"><span className="text-red-500">*</span> Campaign Name</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={handleSend} 
              disabled={sending}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 flex items-center gap-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-lg mt-7"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      </div>

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Money to Wallet</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setAddAmount(amount.toString())}
                    className="px-3 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50"
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddMoney(false)
                    setAddAmount('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (addAmount && parseFloat(addAmount) > 0) {
                      try {
                        const data = await api.addWalletRequest({
                          amount: parseFloat(addAmount),
                          userId: user._id
                        })
                        
                        if (data.success) {
                          setResultData({ 
                            success: true, 
                            message: `Wallet recharge request of ₹${addAmount} submitted for admin approval!` 
                          })
                          setAddAmount('')
                          setShowAddMoney(false)
                          await refreshUser()
                        } else {
                          setResultData({ success: false, message: 'Failed to submit request: ' + data.message })
                        }
                        setShowResultModal(true)
                      } catch (error) {
                        setResultData({ success: false, message: 'Error submitting request: ' + error.message })
                        setShowResultModal(true)
                      }
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Money
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Country Code Modal */}
      {showCountryCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Insert Country Code</h3>
              <button onClick={() => {
                setShowCountryCode(false)
                setCountrySearch('')
              }} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => setSelectedCountryCode(country.code)}
                    className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${
                      selectedCountryCode === country.code ? 'bg-blue-100' : ''
                    }`}
                  >
                    <span className="text-sm">[{country.short}] {country.name} ({country.code})</span>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowCountryCode(false)
                    setCountrySearch('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCountryCode}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showManualImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Manual Import</h3>
              <button onClick={() => {
                setShowManualImport(false)
                setManualNumbers('')
                setParsedNumbers([])
              }} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter Phone Numbers</label>
                <textarea
                  value={manualNumbers}
                  onChange={(e) => {
                    setManualNumbers(e.target.value)
                    parseManualNumbers(e.target.value)
                  }}
                  placeholder="Enter numbers (one per line)&#10;Format: 9876543210 or name,9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                />
                <p className="text-xs text-gray-500 mt-1">Line per number, you can name by enter name comma then mobile (name,number)</p>
              </div>
              
              {parsedNumbers.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-64">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">SN</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedNumbers.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm border-b">{idx + 1}</td>
                            <td className="px-4 py-2 text-sm border-b">{item.name || '-'}</td>
                            <td className="px-4 py-2 text-sm border-b">{item.number}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowManualImport(false)
                    setManualNumbers('')
                    setParsedNumbers([])
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={importManualNumbers}
                  disabled={parsedNumbers.length === 0 || checkingCapability}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkingCapability ? 'Checking...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
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
