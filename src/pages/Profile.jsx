import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCreditCard, FiPlus, FiEdit2, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import apiService from '../services/api';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [addAmount, setAddAmount] = useState('');
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [userStats, setUserStats] = useState({ messagesSent: 0, totalSpent: 0 });
  const [transactions, setTransactions] = useState([]);
  const [transactionSummary, setTransactionSummary] = useState({ totalCredit: 0, totalDebit: 0, currentBalance: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone: '', companyname: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [refreshUser]);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (user?._id) {
      try {
        const [messagesData, profileData] = await Promise.all([
          apiService.getUserMessages(user._id),
          apiService.getProfileWithTransactions(user._id, 10)
        ]);
        
        if (messagesData.success) {
          const messages = messagesData.messages;
          const totalMessages = messages.reduce((sum, msg) => sum + (msg.phoneNumbers?.length || 0), 0);
          const totalSpent = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
          setUserStats({ messagesSent: totalMessages, totalSpent });
        }
        
        if (profileData.success) {
          setTransactions(profileData.profile.recentTransactions || []);
          setTransactionSummary(profileData.profile.transactionSummary || { totalCredit: 0, totalDebit: 0, currentBalance: 0 });
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    }
  };

  const handleAddMoney = async () => {
    if (addAmount && parseFloat(addAmount) > 0) {
      try {
        const data = await apiService.addWalletRequest({
          amount: parseFloat(addAmount),
          userId: user._id
        });
        
        if (data.success) {
          setResultData({ 
            success: true, 
            message: `Wallet recharge request of ₹${addAmount} submitted for admin approval!` 
          });
          setAddAmount('');
          setShowAddMoney(false);
          refreshUser();
        } else {
          setResultData({ success: false, message: 'Failed to submit request: ' + data.message });
        }
        setShowResultModal(true);
      } catch (error) {
        setResultData({ success: false, message: 'Error submitting request: ' + error.message });
        setShowResultModal(true);
      }
    }
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    setEditData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      companyname: user.companyname || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const response = await apiService.updateProfile(user._id, editData);
      
      if (response.success) {
        setResultData({ success: true, message: 'Profile updated successfully!' });
        setIsEditing(false);
        await refreshUser();
      } else {
        setResultData({ success: false, message: response.message || 'Failed to update profile' });
      }
      setShowResultModal(true);
    } catch (error) {
      setResultData({ success: false, message: 'Error updating profile: ' + error.message });
      setShowResultModal(true);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Profile</h1>
      
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <FiUser className="text-2xl text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name || 'User Name'}</h2>
            <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
          </div>
          {!isEditing ? (
            <button 
              onClick={handleEditProfile}
              className="ml-auto p-2 text-gray-500 hover:text-purple-600"
            >
              <FiEdit2 />
            </button>
          ) : (
            <div className="ml-auto flex gap-2">
              <button 
                onClick={handleCancelEdit}
                className="p-2 text-gray-500 hover:text-red-600"
              >
                <FiX />
              </button>
              <button 
                onClick={handleUpdateProfile}
                disabled={updating}
                className="p-2 text-gray-500 hover:text-green-600 disabled:opacity-50"
              >
                <FiCheck className={updating ? 'animate-spin' : ''} />
              </button>
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={editData.companyname}
                  onChange={(e) => setEditData({...editData, companyname: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-semibold">{user?.phone || '+91xxxxxxxxxx'}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Company</p>
              <p className="font-semibold">{user?.companyname || 'Not set'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Card */}
      {/* <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FiCreditCard className="text-2xl" />
            <h3 className="text-xl font-semibold">Wallet Credits</h3>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={async () => {
                setRefreshing(true);
                await refreshUser();
                setRefreshing(false);
              }}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} /> 
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => setShowAddMoney(true)}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiPlus /> Add Money
            </button>
          </div>
        </div>
        
        <div className="text-3xl font-bold mb-2">₹{user?.Wallet?.toFixed(2) || '0.00'}</div>
        <p className="text-purple-100">Available Credits</p>
      </div> */}

      {/* Add Money Modal */}
      {showAddMoney && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
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
                  onClick={() => setShowAddMoney(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMoney}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Add Money
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Total Credit</h4>
          <p className="text-2xl font-bold text-green-600">₹{transactionSummary.totalCredit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Total Debit</h4>
          <p className="text-2xl font-bold text-red-600">₹{transactionSummary.totalDebit}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Messages Sent</h4>
          <p className="text-2xl font-bold text-blue-600">{userStats.messagesSent}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.length > 0 ? transactions.map((txn, index) => (
                <tr key={index}>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{txn.description}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(txn.createdAt).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
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
  );
};

export default Profile;








// import React, { useState, useEffect } from 'react'
// import { FaEdit, FaTrash, FaTimes, FaPlus, FaFileAlt, FaImage, FaLayerGroup, FaEye } from 'react-icons/fa'
// import ApiService from '../../services/api'
// import { getMessageTypeLabel } from '../../utils/messageTypes'
// import { useAuth } from '../../context/AuthContext'
// import toast from 'react-hot-toast'

// export default function TemplatePage() {
//   const { user } = useAuth()
//   const [templates, setTemplates] = useState([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')

//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [editingTemplate, setEditingTemplate] = useState(null)
//   const [formData, setFormData] = useState({
//     name: '',
//     text: '',
//     imageUrl: ''
//   })
//   const [mediaFile, setMediaFile] = useState(null)
//   const [messageType, setMessageType] = useState("text")
//   const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }])
//   const [richCard, setRichCard] = useState({ title: '', subtitle: '', imageUrl: '', actions: [] })
//   const [carouselItems, setCarouselItems] = useState([{ title: '', subtitle: '', imageUrl: '', actions: [] }])
//   const [carouselSuggestions, setCarouselSuggestions] = useState([])
//   const [previewOpen, setPreviewOpen] = useState(false)
//   const [previewData, setPreviewData] = useState(null)
//   const [importModalOpen, setImportModalOpen] = useState(false)
//   const [importJson, setImportJson] = useState('')
//   const [imageCropModalOpen, setImageCropModalOpen] = useState(false)
//   const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
//   const [tempImageFile, setTempImageFile] = useState(null)
//   const [cropCoords, setCropCoords] = useState({ x: 0, y: 0, width: 0, height: 0 })
//   const [cropTarget, setCropTarget] = useState({ type: 'richCard', index: null })

//   const uploadFile = async (file) => {
//     try {
//       const result = await ApiService.uploadFile(file)
//       toast.success('File uploaded successfully')
//       return result.url
//     } catch (error) {
//       toast.error('File upload failed: ' + error.message)
//       return null
//     }
//   }

//   const handleImageSelect = (file, target = 'richCard', index = null) => {
//     if (file) {
//       setCropTarget({ type: target, index })
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         const img = new Image()
//         img.onload = () => {
//           setImageDimensions({ width: img.width, height: img.height })
//           setCropCoords({ x: 0, y: 0, width: img.width, height: img.height })
//           setTempImageFile(file)
//           setImageCropModalOpen(true)
//         }
//         img.src = e.target.result
//       }
//       reader.readAsDataURL(file)
//     }
//   }

//   const cropImage = async () => {
//     return new Promise((resolve) => {
//       const reader = new FileReader()
//       reader.onload = (e) => {
//         const img = new Image()
//         img.onload = () => {
//           const canvas = document.createElement('canvas')
//           canvas.width = cropCoords.width
//           canvas.height = cropCoords.height
//           const ctx = canvas.getContext('2d')
//           ctx.drawImage(
//             img,
//             cropCoords.x,
//             cropCoords.y,
//             cropCoords.width,
//             cropCoords.height,
//             0,
//             0,
//             cropCoords.width,
//             cropCoords.height
//           )
//           canvas.toBlob((blob) => {
//             const croppedFile = new File([blob], tempImageFile.name, { type: 'image/jpeg' })
//             resolve(croppedFile)
//           }, 'image/jpeg', 0.95)
//         }
//         img.src = e.target.result
//       }
//       reader.readAsDataURL(tempImageFile)
//     })
//   }

//   const handleCropConfirm = async () => {
//     if (tempImageFile) {
//       const croppedFile = await cropImage()
//       const uploadedUrl = await uploadFile(croppedFile)
//       if (uploadedUrl) {
//         if (cropTarget.type === 'richCard') {
//           setRichCard({...richCard, imageUrl: uploadedUrl, imageFile: croppedFile})
//         } else if (cropTarget.type === 'carousel' && cropTarget.index !== null) {
//           const newItems = [...carouselItems]
//           newItems[cropTarget.index] = {
//             ...newItems[cropTarget.index],
//             imageUrl: uploadedUrl,
//             imageFile: croppedFile
//           }
//           setCarouselItems(newItems)
//         }
//         setImageCropModalOpen(false)
//         setTempImageFile(null)
//       }
//     }
//   }

//   const handleDeleteImage = (target = 'richCard', index = null) => {
//     if (target === 'richCard') {
//       setRichCard({...richCard, imageUrl: '', imageFile: null})
//     } else if (target === 'carousel' && index !== null) {
//       const newItems = [...carouselItems]
//       newItems[index] = { ...newItems[index], imageUrl: '', imageFile: null }
//       setCarouselItems(newItems)
//     }
//     setImageDimensions({ width: 0, height: 0 })
//     toast.success('Image deleted')
//   }

//   useEffect(() => {
//     if (user?._id) {
//       fetchTemplates()
//     }
//   }, [user])

//   const fetchTemplates = async () => {
//     try {
//       setLoading(true)
//       const response = await ApiService.getUserTemplates(user?._id)
//       setTemplates(response.data || [])
      
//       toast.success('Templates fetched successfully')
//     } catch (err) {
//       toast.error('Failed to fetch templates')
//       setError('Failed to fetch templates')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const addAction = (target = 'main') => {
//     const newAction = { type: 'reply', title: '', payload: '' }
//     if (target === 'main') {
//       setActions([...actions, newAction])
//     } else if (target === 'richCard') {
//       setRichCard({...richCard, actions: [...richCard.actions, newAction]})
//     }
//   }

//   const removeAction = (index, target = 'main') => {
//     if (target === 'main') {
//       setActions(actions.filter((_, i) => i !== index))
//     } else if (target === 'richCard') {
//       setRichCard({...richCard, actions: richCard.actions.filter((_, i) => i !== index)})
//     }
//   }

//   const addCarouselItem = () => {
//     setCarouselItems([...carouselItems, { title: '', subtitle: '', imageUrl: '', actions: [] }])
//   }

//   const removeCarouselItem = (index) => {
//     setCarouselItems(carouselItems.filter((_, i) => i !== index))
//   }



//   const handlePreview = (template) => {
//     setPreviewData(template)
//     setPreviewOpen(true)
//   }

//   const handleEdit = (template) => {
//     setEditingTemplate(template)
//     setFormData({
//       name: template.name,
//       text: template.text || '',
//       imageUrl: template.imageUrl || ''
//     })
//     setMessageType(template.messageType)
//     setActions(template.actions || [])
//     setRichCard(template.richCard || { title: '', subtitle: '', imageUrl: '', actions: [] })
//     setCarouselItems(template.carouselItems || [])
//     setCarouselSuggestions(template.carouselSuggestions || [])
//     setIsModalOpen(true)
//   }

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this template?')) {
//       try {
//         await ApiService.deleteTemplate(id)
//         toast.success('Template deleted successfully')
//         fetchTemplates()
//       } catch (err) {
//         toast.error('Failed to delete template')
//         setError('Failed to delete template')
//       }
//     }
//   }

//   const resetForm = () => {
//     setFormData({ name: '', text: '', imageUrl: '' })
//     setMessageType('text')
//     setActions([{ type: 'reply', title: '', payload: '' }])
//     setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [] })
//     setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [] }])
//     setCarouselSuggestions([])
//     setEditingTemplate(null)
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
    
//     if (!formData.name.trim()) {
//       toast.error('Template name is required')
//       setError('Template name is required')
//       return
//     }
    
//     // Text validation only for text and text-with-action types
//     if ((messageType === 'text' || messageType === 'text-with-action') && !formData.text.trim()) {
//       toast.error('Template text is required')
//       setError('Template text is required')
//       return
//     }
    
//     const templateData = {
//       name: formData.name.trim(),
//       messageType,
//       text: formData.text.trim(),
//       imageUrl: formData.imageUrl.trim(),
//       userId: user?._id
//     }

//     if (messageType === 'text-with-action') {
//       templateData.actions = actions.filter(a => a.title.trim())
//     } else if (messageType === 'rcs') {
//       templateData.richCard = {
//         ...richCard,
//         actions: richCard.actions.filter(a => a.title.trim())
//       }
//     } else if (messageType === 'carousel') {
//       const validItems = carouselItems.filter(item => {
//         if (!item.title.trim()) return false
//         const validActions = (item.actions || []).filter(a => 
//           a.title.trim() && a.payload.trim() && (a.type !== 'url' || a.payload.startsWith('http'))
//         )
//         return validActions.length > 0
//       }).map(item => ({
//         ...item,
//         actions: item.actions.filter(a => 
//           a.title.trim() && a.payload.trim() && (a.type !== 'url' || a.payload.startsWith('http'))
//         )
//       }))
      
//       if (validItems.length === 0) {
//         const msg = 'Each carousel item must have at least one valid action with title and payload'
//         toast.error(msg)
//         setError(msg)
//         return
//       }
      
//       templateData.carouselItems = validItems
//       templateData.carouselSuggestions = carouselSuggestions.filter(s => s.title.trim() && s.payload.trim())
//     }
    
//     try {
//       if (editingTemplate) {
//         await ApiService.updateTemplate(editingTemplate._id, templateData)
//         toast.success('Template updated successfully')
//       } else {
//         await ApiService.createTemplate(templateData)
//         toast.success('Template created successfully')
//       }
//       await fetchTemplates()
//       resetForm()
//       setIsModalOpen(false)
//       setError('')
//     } catch (err) {
//       console.error('Template save error:', err)
      
//       let errorMsg = 'Failed to save template'
//       const serverMsg = err.response?.data?.message || err.message || ''
      
//       // Check for duplicate key error
//       if (serverMsg.includes('E11000') && serverMsg.includes('name')) {
//         errorMsg = `Template name "${formData.name}" already exists. Please use a different name.`
//       } else {
//         errorMsg = serverMsg
//       }
      
//       toast.error(errorMsg)
//       setError(errorMsg)
//     }
//   }



//   return (
//     <div className="max-w-7xl mx-auto p-4 sm:p-6">
//        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div>
//             <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
//               Templates
//             </h1>
//             <p className="text-slate-500 mt-2">Manage your message templates</p>
//           </div>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1 transition-all duration-300"
//           >
//             <FaPlus className="text-lg group-hover:scale-110 transition-transform" />
//             Add New Template
//           </button>
//         </div>

//         {/* 🔥 MODERN TABLE UI 🔥 */}
//         <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
//           {/* Desktop Table */}
//           <div className="hidden lg:block overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                     &nbsp;  &nbsp;
//                     #
//                   </th>
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                   &nbsp;
//                     Name
//                   </th>
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                     &nbsp;  &nbsp;  &nbsp;  &nbsp;
//                     Type
//                   </th>
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                     &nbsp;  &nbsp;  &nbsp;  &nbsp;  &nbsp;
//                     Preview
//                   </th>
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                     Actions
//                   </th>
//                   <th className="px-8 py-6 text-left font-black text-white text-sm uppercase tracking-wider">
//                     &nbsp;  &nbsp;  &nbsp;  &nbsp;
//                     Status
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-blue-100">
//                 {loading ? (
//                   <tr>
//                     <td colSpan={6} className="py-20 text-center">
//                       <div className="flex flex-col items-center gap-4">
//                         <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                         <span className="text-xl font-semibold text-slate-600">Loading templates...</span>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : templates.length === 0 ? (
//                   <tr>
//                     <td colSpan={6} className="py-24 text-center">
//                       <div className="flex flex-col items-center gap-6">
//                         <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center">
//                           <FaFileAlt className="text-4xl text-slate-400" />
//                         </div>
//                         <div className="text-center">
//                           <h3 className="text-2xl font-bold text-slate-700 mb-2">No templates yet</h3>
//                           <p className="text-slate-500">Create your first template to get started</p>
//                         </div>
//                         <button
//                           onClick={() => setIsModalOpen(true)}
//                           className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1 transition-all duration-300"
//                         >
//                           Create First Template
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   templates.map((template, index) => (
//                     <tr
//                       key={template.id}
//                       className="group hover:bg-white/60 transition-all duration-300 border-b-4 border-blue-100 hover:border-indigo-200 hover:shadow-xl"
//                     >
//                       {/* SN */}
//                       <td className="px-8 py-6">
//                         <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-all duration-300">
//                           {index + 1}
//                         </div>
//                       </td>

//                       {/* Name */}
//                       <td className="px-8 py-6">
//                         <div className="flex items-center gap-4">
//                           <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-all duration-500">
//                             {template.messageType === 'rcs' ? (
//                               <FaImage className="text-white text-xl" />
//                             ) : template.messageType === 'carousel' ? (
//                               <FaLayerGroup className="text-white text-xl" />
//                             ) : (
//                               <FaFileAlt className="text-white text-xl" />
//                             )}
//                           </div>
//                           <div>
//                             <h4 className="font-black text-xl text-slate-800 group-hover:text-blue-600 transition-colors">
//                               {template.name}
//                             </h4>
                           
//                           </div>
//                         </div>
//                       </td>

//                       {/* Type */}
//                       <td className="px-8 py-6">
//                         <span className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 text-blue-800 rounded-2xl font-bold text-sm shadow-lg group-hover:shadow-xl transition-all duration-300">
//                           {getMessageTypeLabel(template.messageType)}
//                         </span>
//                       </td>

//                       {/* Preview */}
//                       <td className="px-8 py-6 max-w-md">
//                         <div className="space-y-2">
//                           {template.messageType === 'rcs' && template.imageUrl && (
//                             <img
//                               src={template.imageUrl}
//                               alt="Preview"
//                               className="w-24 h-20 object-cover rounded-2xl shadow-lg group-hover:scale-105 transition-transform duration-300"
//                             />
//                           )}
//                           <div className="bg-gradient-to-r from-slate-100 to-blue-50 p-4 rounded-2xl shadow-md group-hover:shadow-xl transition-all duration-300">
//                              <button
//                             onClick={() => handlePreview(template)}
//                             className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transform hover:-translate-y-1 transition-all duration-300 group-hover:scale-105"
//                           >
//                             <FaEye className="text-lg" />
//                             Preview
//                           </button>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Actions */}
//                       <td className="px-8 py-6">
//                         <div className="flex items-center gap-3">
                         
//                           <div className="flex gap-2">
//                             <button
//                               onClick={() => handleEdit(template)}
//                               className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-600 transform hover:-translate-y-1 transition-all duration-300"
//                               title="Edit"
//                             >
//                               <FaEdit className="text-lg" />
//                             </button>
//                             <button
//                               onClick={() => handleDelete(template.id)}
//                               className="p-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-rose-600 transform hover:-translate-y-1 transition-all duration-300"
//                               title="Delete"
//                             >
//                               <FaTrash className="text-lg" />
//                             </button>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Status */}
//                       <td className="px-8 py-6">
//                         {(() => {
//                           const createdDate = new Date(template.createdAt);
//                           const now = new Date();
//                           const secondsDiff = (now - createdDate) / 1000;
//                           if (secondsDiff < 3) {
//                             return (
//                               <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-2xl font-bold text-sm shadow-lg animate-pulse">
//                                 <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping"></div>
//                                 Pending
//                               </span>
//                             );
//                           } else {
//                             return (
//                               <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-2xl font-bold text-sm shadow-lg">
//                                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
//                                 Approved
//                               </span>
//                             );
//                           }
//                         })()}
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>

//           {/* Mobile Cards */}
//           <div className="lg:hidden space-y-4 p-6">
//             {loading ? (
//               <div className="text-center py-12">
//                 <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//                 <span className="text-lg font-semibold text-slate-600">Loading...</span>
//               </div>
//             ) : templates.length === 0 ? (
//               <div className="text-center py-16">
//                 <FaFileAlt className="text-6xl text-slate-300 mx-auto mb-6" />
//                 <h3 className="text-2xl font-bold text-slate-700 mb-2">No Templates</h3>
//                 <button
//                   onClick={() => setIsModalOpen(true)}
//                   className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
//                 >
//                   Create Template
//                 </button>
//               </div>
//             ) : (
//               templates.map((template, index) => (
//                 <div
//                   key={template.id}
//                   className="bg-white rounded-3xl shadow-2xl hover:shadow-3xl p-6 hover:-translate-y-2 transition-all duration-500 border border-blue-100 hover:border-indigo-200"
//                 >
//                   <div className="flex items-start gap-4">
//                     <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl">
//                       <span className="text-white font-black text-lg">{index + 1}</span>
//                     </div>
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-3">
//                         <h3 className="font-black text-xl text-slate-800">{template.name}</h3>
//                         <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl text-sm font-bold">
//                           {getMessageTypeLabel(template.messageType)}
//                         </span>
//                       </div>
//                       <p className="text-slate-600 mb-4 line-clamp-2">{template.text}</p>
//                       <div className="flex items-center gap-3">
//                         <button
//                           onClick={() => handlePreview(template)}
//                           className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
//                         >
//                           <FaEye />
//                           Preview
//                         </button>
//                         <button
//                           onClick={() => handleEdit(template)}
//                           className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
//                         >
//                           <FaEdit />
//                         </button>
//                         <button
//                           onClick={() => handleDelete(template.id)}
//                           className="p-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
//                         >
//                           <FaTrash />
//                         </button>
//                       </div>
//                     </div>
//                     <div className="flex-shrink-0 ml-auto">
//                       {(() => {
//                         const createdDate = new Date(template.createdAt);
//                         const now = new Date();
//                         const secondsDiff = (now - createdDate) / 1000;
//                         return secondsDiff < 3 ? (
//                           <span className="px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-xl font-bold text-sm shadow-lg animate-pulse">
//                             Pending
//                           </span>
//                         ) : (
//                           <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-xl font-bold text-sm shadow-lg">
//                             Approved
//                           </span>
//                         );
//                       })()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Pagination */}
//         <div className="flex items-center justify-center gap-3 mt-12">
//           <button className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-600 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:from-slate-300 hover:to-slate-400 transition-all duration-300">
//             ‹
//           </button>
//           <button className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300">
//             1
//           </button>
//           <button className="w-12 h-12 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-600 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:from-slate-300 hover:to-slate-400 transition-all duration-300">
//             ›
//           </button>
//         </div>
//       </div>


//       {/* Preview Modal */}
//  {previewOpen && (
//   <div className="fixed inset-0 bg-gradient-to-br from-black/80 via-blue-900/50 to-purple-900/50 backdrop-blur-xl flex items-center justify-center z-50 p-6">
//     <div className="group bg-white/90 backdrop-blur-2xl rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]">
      
//       {/* 3D Header */}
//       <div className="p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
//         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent -skew-x-12 transform -translate-x-1/4"></div>
//         <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-xl -translate-y-16 translate-x-16"></div>
        
//         <div className="flex items-center justify-between relative z-10">
//           <div className="flex items-center gap-4">
//             <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500 border border-white/50">
//               <span className="text-2xl font-black bg-gradient-to-br from-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">W</span>
//             </div>
//             <div>
//               <h2 className="text-2xl md:text-3xl font-black drop-shadow-lg">Template Preview</h2>
//               <p className="text-blue-100 font-medium">Live message preview</p>
//             </div>
//           </div>
//           <button 
//             onClick={() => setPreviewOpen(false)} 
//             className="group relative p-3 bg-white/20 backdrop-blur-sm hover:bg-white/40 rounded-2xl border border-white/30 hover:border-white/50 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 hover:-translate-y-1"
//           >
//             <FaTimes className="text-xl text-white drop-shadow-lg" />
//             <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//           </button>
//         </div>
//       </div>

//       {/* 3D Content Area */}
//       <div className="p-8 space-y-6 relative">
//         <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30 -skew-x-3 origin-top transform translate-x-4"></div>
        
//         {/* Message Preview Container */}
//         <div className="relative bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/40 hover:shadow-3xl hover:-translate-y-2 transition-all duration-500 group-hover:shadow-purple-500/25">
          
//           {/* Plain Text Message */}
//           {previewData?.messageType === 'text' && previewData?.text && (
//             <div className="bg-gradient-to-br from-gray-100/80 to-gray-200/60 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-gray-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 hover:-translate-y-1">
//               <p className="text-base text-gray-800 font-medium leading-relaxed whitespace-pre-wrap drop-shadow-sm">
//                 {previewData.text}
//               </p>
//               <div className="mt-4 pt-4 border-t-2 border-gray-200/50">
//                 <div className="flex items-center gap-2 text-xs text-gray-500">
//                   <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
//                   Plain Text Message
//                 </div>
//               </div>
//             </div>
//           )}
          
//           {/* Text with Actions */}
//           {previewData?.messageType === 'text-with-action' && (
//             <div className="max-w-xs mx-auto transform hover:scale-[1.01] transition-all duration-300">
//               {previewData?.text && (
//                 <div className="bg-gradient-to-br from-gray-100/80 to-gray-200/60 backdrop-blur-sm p-6 rounded-2xl mb-4 shadow-xl border border-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
//                   <p className="text-base text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">
//                     {previewData.text}
//                   </p>
//                 </div>
//               )}
//               {previewData?.actions?.length > 0 && (
//                 <div className="space-y-2">
//                   {previewData.actions.map((action, index) => (
//                     <button 
//                       key={index} 
//                       className="group w-full py-4 px-6 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl hover:from-blue-600 hover:to-indigo-700 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 border border-blue-300/50 transform relative overflow-hidden"
//                     >
//                       <div className="absolute inset-0 bg-white/20 blur opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
//                       <div className="relative flex items-center justify-center gap-3">
//                         {action.type === 'call' && <span className="text-xl">📞</span>}
//                         {action.type === 'url' && <span className="text-xl">🔗</span>}
//                         {action.type === 'reply' && <span className="text-xl">💬</span>}
//                         <span>{action.title}</span>
//                       </div>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
          
//           {/* RCS Rich Card */}
//           {previewData?.messageType === 'rcs' && (
//             <div className="max-w-sm mx-auto group/card hover:scale-[1.02] transition-all duration-500">
//               <div className="bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500">
//                 {(previewData?.imageUrl || previewData?.richCard?.imageUrl) && (
//                   <div className="relative overflow-hidden">
//                     <img 
//                       src={previewData?.imageUrl || previewData?.richCard?.imageUrl} 
//                       alt="RCS Card" 
//                       className="w-full h-40 object-cover group-hover/card:scale-110 transition-transform duration-700"
//                       onError={(e) => {
//                         e.target.src = 'https://via.placeholder.com/400x160/f8fafc/64748b?text=RCS+Rich+Card'
//                       }}
//                     />
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
//                   </div>
//                 )}
//                 <div className="p-6">
//                   {(previewData?.richCard?.title || previewData?.text) && (
//                     <h4 className="text-xl font-black text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-slate-800 bg-clip-text">
//                       {previewData?.richCard?.title || previewData?.text}
//                     </h4>
//                   )}
//                   {previewData?.richCard?.subtitle && (
//                     <p className="text-sm text-gray-600 mb-4 font-medium">{previewData.richCard.subtitle}</p>
//                   )}
//                   {(previewData?.richCard?.actions || previewData?.actions)?.length > 0 && (
//                     <div className="space-y-3">
//                       {(previewData?.richCard?.actions || previewData?.actions).map((action, index) => (
//                         <button 
//                           key={index} 
//                           className="group w-full py-3 px-5 bg-gradient-to-r from-emerald-500/90 to-teal-600/90 backdrop-blur-sm text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-teal-700 hover:-translate-y-1 transition-all duration-300 border border-emerald-400/50"
//                         >
//                           <div className="flex items-center justify-center gap-3">
//                             {action.type === 'call' && <span className="text-lg">📞</span>}
//                             {action.type === 'url' && <span className="text-lg">🔗</span>}
//                             {action.type === 'reply' && <span className="text-lg">💬</span>}
//                             <span>{action.title}</span>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}
          
//           {/* Carousel */}
//           {previewData?.messageType === 'carousel' && previewData?.carouselItems?.length > 0 && (
//             <div className="max-w-4xl mx-auto">
//               <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100">
//                 {previewData.carouselItems.map((item, index) => (
//                   <div 
//                     key={index} 
//                     className="flex-none snap-center group w-64 transform hover:scale-105 hover:-translate-y-3 transition-all duration-500"
//                   >
//                     <div className="bg-gradient-to-br from-white to-slate-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:border-indigo-300/50">
//                       {item.imageUrl && (
//                         <div className="relative h-48 overflow-hidden">
//                           <img 
//                             src={item.imageUrl} 
//                             alt={`Carousel ${index + 1}`} 
//                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
//                             onError={(e) => {
//                               e.target.src = `https://via.placeholder.com/256x192/f8fafc/64748b?text=Card+${index + 1}`
//                             }}
//                           />
//                           <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
//                         </div>
//                       )}
//                       <div className="p-6">
//                         {item.title && (
//                           <h5 className="font-black text-lg text-gray-900 mb-2 line-clamp-2">{item.title}</h5>
//                         )}
//                         {item.subtitle && (
//                           <p className="text-sm text-gray-600 mb-4 font-medium line-clamp-2">{item.subtitle}</p>
//                         )}
//                         {item.actions?.length > 0 && (
//                           <div className="space-y-2">
//                             {item.actions.map((action, actionIndex) => (
//                               <button 
//                                 key={actionIndex} 
//                                 className="group w-full py-2.5 px-4 bg-gradient-to-r from-purple-500/90 to-pink-600/90 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-700 hover:-translate-y-1 transition-all duration-300 border border-purple-400/50 text-sm"
//                               >
//                                 <div className="flex items-center justify-center gap-2">
//                                   {action.type === 'call' && <span>📞</span>}
//                                   {action.type === 'url' && <span>🔗</span>}
//                                   {action.type === 'reply' && <span>💬</span>}
//                                   <span>{action.title}</span>
//                                 </div>
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-center mt-4">
//                 <span className="px-4 py-2 bg-gradient-to-r from-blue-100/50 to-purple-100/50 backdrop-blur-sm text-blue-700 rounded-2xl text-sm font-semibold border border-blue-200/50">
//                   👆 Swipe to see more cards →
//                 </span>
//               </div>
//             </div>
//           )}

//           {/* Other message types with same 3D styling */}
//           {previewData?.messageType === 'image' && (
//             <div className="max-w-xs mx-auto transform hover:scale-105 transition-all duration-500">
//               <div className="bg-gradient-to-br from-gray-100/80 to-gray-200/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-gray-200/50 text-center hover:shadow-3xl hover:-translate-y-2">
//                 {previewData?.mediaUrl && (
//                   <img 
//                     src={previewData.mediaUrl} 
//                     alt="Preview" 
//                     className="w-full max-h-64 object-contain rounded-2xl shadow-2xl mx-auto mb-4 hover:scale-105 transition-transform duration-300"
//                     onError={(e) => e.target.src = 'https://via.placeholder.com/300x200/f8fafc/64748b?text=Image'}
//                   />
//                 )}
//                 {previewData?.caption && (
//                   <p className="text-lg text-gray-800 font-semibold">{previewData.caption}</p>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Default fallback */}
//           {!['text', 'text-with-action', 'image', 'rcs', 'carousel'].includes(previewData?.messageType) && (
//             <div className="bg-gradient-to-br from-gray-100/80 to-gray-200/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-200/50 text-center hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
//               <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
//                 <FaFileAlt className="text-2xl text-slate-500" />
//               </div>
//               <h3 className="text-xl font-black text-slate-700 mb-2">
//                 Preview Not Available
//               </h3>
//               <p className="text-slate-600 font-medium">
//                 {getMessageTypeLabel(previewData?.messageType)} preview coming soon...
//               </p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* 3D Footer */}
//       <div className="px-8 py-6 bg-gradient-to-r from-slate-50/80 to-blue-50/80 backdrop-blur-xl border-t border-white/50">
//         <div className="flex items-center justify-between">
//           <span className="text-sm text-slate-600 font-medium">Preview updated in real-time</span>
//           <div className="flex items-center gap-3">
//             <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 rounded-xl font-semibold text-sm shadow-md border border-emerald-200/50">
//               <div className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-2 animate-pulse"></div>
//               Live
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
// )}


//       {/* Import RCS Modal */}
     
//       {/* Create Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden flex">
//             {/* Left Side - Form */}
//             <div className="w-1/2 p-6 overflow-y-auto border-r">
//               {/* Modal Header */}
//               <div className="flex items-center justify-between mb-6">
//                 <h2 className="text-xl font-bold text-gray-900">
//                   {editingTemplate ? 'Edit Template' : 'Create Template'}
//                 </h2>
//                 <button 
//                   onClick={() => {
//                     setIsModalOpen(false)
//                     resetForm()
//                   }} 
//                   className="text-gray-400 hover:text-gray-600"
//                 >
//                   <FaTimes className="text-xl" />
//                 </button>
//               </div>

              
//               {/* Form */}
//               <form onSubmit={handleSubmit} className="space-y-6">
//                 {/* Template Name & Message Type */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       <span className="text-red-500">*</span> Template Name
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="Template Name"
//                       value={formData.name}
//                       onChange={(e) => setFormData({...formData, name: e.target.value})}
//                       required
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       <span className="text-red-500">*</span> Message Type
//                     </label>
//                     <select
//                       value={messageType}
//                       onChange={(e) => setMessageType(e.target.value)}
//                       className="w-full px-4 py-2 border border-purple-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50"
//                     >
//                       <option value="text">Plain Text</option>
//                       <option value="text-with-action">Text with Actions</option>
//                       <option value="rcs">RCS Rich Card</option>
//                       <option value="carousel">Carousel</option>
//                     </select>
//                   </div>
//                 </div>

//                 {/* Message Editor - Only for text and text-with-action */}
//                 {(messageType === 'text' || messageType === 'text-with-action') && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       <span className="text-red-500">*</span> Text
//                     </label>
//                     <textarea
//                       value={formData.text}
//                       onChange={(e) => setFormData({...formData, text: e.target.value})}
//                       placeholder="Enter your message text..."
//                       required
//                       rows={4}
//                       className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     />
//                   </div>
//                 )}

              

//                 {/* Actions for text-with-action */}
//                 {messageType === 'text-with-action' && (
//                   <div>
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
//                       <button
//                         type="button"
//                         onClick={() => addAction('main')}
//                         className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
//                       >
//                         <FaPlus className="text-xs" /> Add Action
//                       </button>
//                     </div>
//                     {actions.map((action, index) => (
//                       <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
//                         <div className="flex items-center justify-between mb-4">
//                           <h5 className="font-medium text-gray-900">Action {index + 1}</h5>
//                           <button
//                             type="button"
//                             onClick={() => removeAction(index, 'main')}
//                             className="text-red-600 hover:text-red-800 text-sm border border-red-300 px-3 py-1 rounded"
//                           >
//                             Remove
//                           </button>
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
//                             <select 
//                               value={action.type}
//                               onChange={(e) => {
//                                 const newActions = [...actions]
//                                 const val = e.target.value
//                                 newActions[index].type = val
//                                 // If switched to call and title empty, set default title
//                                 if (val === 'call' && !newActions[index].title) {
//                                   newActions[index].title = 'call now'
//                                 }
//                                 // If switched to url, clear title
//                                 if (val === 'url') {
//                                   newActions[index].title = ''
//                                 }
//                                 setActions(newActions)
//                               }}
//                               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                             >
//                               <option value="reply">Reply</option>
//                               <option value="url">URL</option>
//                               <option value="call">Call</option>
//                             </select>
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
//                             <input
//                               type="text"
//                               value={action.title}
//                               onChange={(e) => {
//                                 const newActions = [...actions]
//                                 newActions[index].title = e.target.value
//                                 setActions(newActions)
//                               }}
//                               placeholder="Action title"
//                               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                             />
//                           </div>
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                               {action.type === 'reply' ? 'Payload' : action.type === 'url' ? 'URL' : 'Phone'}
//                             </label>
//                             <input
//                               type={action.type === 'url' ? 'url' : action.type === 'call' ? 'tel' : 'text'}
//                               value={action.payload}
//                               onChange={(e) => {
//                                 const newActions = [...actions]
//                                 newActions[index].payload = e.target.value
//                                 setActions(newActions)
//                               }}
//                               placeholder={action.type === 'reply' ? 'Reply text' : action.type === 'url' ? 'https://...' : '+1234567890'}
//                               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* RCS Rich Card */}
//                 {messageType === 'rcs' && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Rich Card</h3>
//                     <div className="space-y-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
//                           <input
//                             type="text"
//                             value={richCard.title}
//                             onChange={(e) => setRichCard({...richCard, title: e.target.value})}
//                             placeholder="Card title"
//                             required
//                             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                           />
//                         </div>
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
//                           <input
//                             type="text"
//                             value={richCard.subtitle}
//                             onChange={(e) => setRichCard({...richCard, subtitle: e.target.value})}
//                             placeholder="Card subtitle"
//                             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                           />
//                         </div>
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={(e) => {
//                             const file = e.target.files[0]
//                             if (file) {
//                               handleImageSelect(file)
//                             }
//                           }}
//                           className="hidden"
//                           id="richcard-image-upload"
//                         />
//                         <label
//                           htmlFor="richcard-image-upload"
//                           className="flex flex-col items-center justify-center w-full h-48 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
//                         >
//                           <div className="flex flex-col items-center justify-center pt-5 pb-6">
//                             <svg className="w-12 h-12 mb-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
//                               <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
//                             </svg>
//                             <p className="mb-2 text-sm text-gray-700 font-medium">Browse Files to upload</p>
//                           </div>
//                         </label>
//                         <p className="mt-2 text-xs text-gray-500 text-right">{richCard.imageFile ? `📎 ${richCard.imageFile.name}` : 'No selected File'}</p>
//                         {richCard.imageFile && richCard.imageUrl && (
//                           <div className="mt-3">
//                             <div className="relative inline-block">
//                               <img 
//                                 src={richCard.imageUrl} 
//                                 alt="Preview" 
//                                 className="max-w-xs rounded-lg border-2 border-gray-300" 
//                                 onLoad={(e) => {
//                                   setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })
//                                 }} 
//                               />
//                               {imageDimensions.width > 0 && (
//                                 <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
//                                   {imageDimensions.width}×{imageDimensions.height}px
//                                 </div>
//                               )}
//                             </div>
//                             <div className="mt-3 flex gap-2">
//                               <button
//                                 type="button"
//                                 onClick={() => document.getElementById('richcard-image-upload').click()}
//                                 className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
//                               >
//                                 📷 Crop/Change
//                               </button>
//                               <button
//                                 type="button"
//                                 onClick={handleDeleteImage}
//                                 className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
//                               >
//                                 🗑️ Delete
//                               </button>
//                             </div>
//                           </div>
//                         )}
//                       </div>
                      
//                       {/* RCS Actions */}
//                       <div>
//                         <div className="flex items-center justify-between mb-4">
//                           <h4 className="text-md font-semibold text-gray-900">Actions</h4>
//                           <button
//                             type="button"
//                             onClick={() => addAction('richCard')}
//                             className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
//                           >
//                             <FaPlus className="text-xs inline mr-1" /> Add Action
//                           </button>
//                         </div>
//                         {richCard.actions.map((action, index) => (
//                           <div key={index} className="border border-gray-200 rounded-lg p-3 mb-3">
//                             <div className="flex items-center justify-between mb-3">
//                               <h6 className="font-medium text-gray-900 text-sm">Action {index + 1}</h6>
//                               <button
//                                 type="button"
//                                 onClick={() => removeAction(index, 'richCard')}
//                                 className="text-red-600 hover:text-red-800 text-xs border border-red-300 px-2 py-1 rounded"
//                               >
//                                 Remove
//                               </button>
//                             </div>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                               <div>
//                                 <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
//                                 <select 
//                                   value={action.type}
//                                   onChange={(e) => {
//                                     const newActions = [...richCard.actions]
//                                     const val = e.target.value
//                                     newActions[index].type = val
//                                     if (val === 'call' && !newActions[index].title) {
//                                       newActions[index].title = 'call now'
//                                     }
//                                     if (val === 'url') {
//                                       newActions[index].title = ''
//                                     }
//                                     setRichCard({...richCard, actions: newActions})
//                                   }}
//                                   className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
//                                 >
//                                   <option value="reply">Reply</option>
//                                   <option value="url">URL</option>
//                                   <option value="call">Call</option>
//                                 </select>
//                               </div>
//                               <div>
//                                 <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
//                                 <input
//                                   type="text"
//                                   value={action.title}
//                                   onChange={(e) => {
//                                     const newActions = [...richCard.actions]
//                                     newActions[index].title = e.target.value
//                                     setRichCard({...richCard, actions: newActions})
//                                   }}
//                                   placeholder="Action title"
//                                   className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
//                                 />
//                               </div>
//                               <div>
//                                 <label className="block text-xs font-medium text-gray-700 mb-1">
//                                   {action.type === 'reply' ? 'Payload' : action.type === 'url' ? 'URL' : 'Phone'}
//                                 </label>
//                                 <input
//                                   type={action.type === 'url' ? 'url' : action.type === 'call' ? 'tel' : 'text'}
//                                   value={action.payload}
//                                   onChange={(e) => {
//                                     const newActions = [...richCard.actions]
//                                     newActions[index].payload = e.target.value
//                                     setRichCard({...richCard, actions: newActions})
//                                   }}
//                                   placeholder={action.type === 'reply' ? 'Reply text' : action.type === 'url' ? 'https://...' : '+1234567890'}
//                                   className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
//                                 />
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Carousel Items */}
//                 {messageType === 'carousel' && (
//                   <div>
//                     <div className="flex items-center justify-between mb-4">
//                       <h3 className="text-lg font-semibold text-gray-900">Carousel Items</h3>
//                       <button
//                         type="button"
//                         onClick={addCarouselItem}
//                         className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
//                       >
//                         <FaPlus className="text-xs" /> Add Item
//                       </button>
//                     </div>
//                     {carouselItems.map((item, index) => (
//                       <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
//                         <div className="flex items-center justify-between mb-4">
//                           <h5 className="font-medium text-gray-900">Item {index + 1}</h5>
//                           <button
//                             type="button"
//                             onClick={() => removeCarouselItem(index)}
//                             className="text-red-600 hover:text-red-800 text-sm border border-red-300 px-3 py-1 rounded"
//                           >
//                             Remove
//                           </button>
//                         </div>
//                         <div className="space-y-4">
//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
//                             <input
//                               type="file"
//                               accept="image/*"
//                               onChange={async (e) => {
//                                 const file = e.target.files[0]
//                                 if (file) {
//                                   handleImageSelect(file, 'carousel', index)
//                                 }
//                               }}
//                               className="hidden"
//                               id={`carousel-image-${index}`}
//                             />
//                             <label
//                               htmlFor={`carousel-image-${index}`}
//                               className="flex flex-col items-center justify-center w-full h-30 border-2 border-purple-600 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors"
//                             >
//                               <div className="flex flex-col items-center justify-center">
//                                 <svg className="w-12 h-12 mb-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
//                                   <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
//                                 </svg>
//                                 <p className="text-sm text-gray-700 font-medium">Browse Files to upload</p>
//                               </div>
//                             </label>
//                             <p className="mt-2 text-xs text-gray-500 text-right">{item.imageFile ? `📎 ${item.imageFile.name}` : 'No selected File'}</p>
//                             {item.imageFile && item.imageUrl && (
//                               <div className="mt-3">
//                                 <div className="relative inline-block">
//                                   <img
//                                     src={item.imageUrl}
//                                     alt="Preview"
//                                     className="w-full rounded-lg border-2 h-30 border-gray-300"
//                                     onLoad={(e) => {
//                                       setImageDimensions({ width: e.target.naturalWidth, height: e.target.naturalHeight })
//                                     }}
//                                   />
//                                   {imageDimensions.width > 0 && (
//                                     <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold">
//                                       {imageDimensions.width}×{imageDimensions.height}px
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="mt-3 flex gap-2">
//                                   <button
//                                     type="button"
//                                     onClick={() => document.getElementById(`carousel-image-${index}`).click()}
//                                     className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium"
//                                   >
//                                     📷 Crop/Change
//                                   </button>
//                                   <button
//                                     type="button"
//                                     onClick={() => handleDeleteImage('carousel', index)}
//                                     className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 font-medium"
//                                   >
//                                     🗑️ Delete
//                                   </button>
//                                 </div>
//                               </div>
//                             )}
//                           </div>
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
//                               <input
//                                 type="text"
//                                 value={item.title}
//                                 onChange={(e) => {
//                                   const newItems = [...carouselItems]
//                                   newItems[index].title = e.target.value
//                                   setCarouselItems(newItems)
//                                 }}
//                                 placeholder="Item title"
//                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                               />
//                             </div>
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
//                               <input
//                                 type="text"
//                                 value={item.subtitle}
//                                 onChange={(e) => {
//                                   const newItems = [...carouselItems]
//                                   newItems[index].subtitle = e.target.value
//                                   setCarouselItems(newItems)
//                                 }}
//                                 placeholder="Item subtitle"
//                                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
//                               />
//                             </div>
//                           </div>
//                         </div>
                        
//                         {/* Carousel Item Actions */}
//                         <div className="mt-4">
//                           <div className="flex items-center justify-between mb-3">
//                             <h6 className="text-sm font-medium text-gray-700">Actions</h6>
//                             <button
//                               type="button"
//                               onClick={() => {
//                                 const newItems = [...carouselItems]
//                                 if (!newItems[index].actions) newItems[index].actions = []
//                                 newItems[index].actions.push({ type: 'url', title: '', payload: '' })
//                                 setCarouselItems(newItems)
//                               }}
//                               className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
//                             >
//                               <FaPlus className="text-xs inline mr-1" /> Add Action
//                             </button>
//                           </div>
//                           {item.actions?.map((action, actionIndex) => (
//                             <div key={actionIndex} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2 p-2 bg-gray-50 rounded">
//                               <select 
//                                 value={action.type}
//                                 onChange={(e) => {
//                                   const newItems = [...carouselItems]
//                                   const val = e.target.value
//                                   newItems[index].actions[actionIndex].type = val
//                                   if (val === 'call' && !newItems[index].actions[actionIndex].title) {
//                                     newItems[index].actions[actionIndex].title = 'call now'
//                                   }
//                                   if (val === 'url') {
//                                     newItems[index].actions[actionIndex].title = ''
//                                   }
//                                   setCarouselItems(newItems)
//                                 }}
//                                 className="px-2 py-1 border border-gray-300 rounded text-xs"
//                               >
//                                 <option value="reply">Reply</option>
//                                 <option value="url">URL</option>
//                                 <option value="call">Call</option>
//                               </select>
//                               <input
//                                 type="text"
//                                 value={action.title}
//                                 onChange={(e) => {
//                                   const newItems = [...carouselItems]
//                                   newItems[index].actions[actionIndex].title = e.target.value
//                                   setCarouselItems(newItems)
//                                 }}
//                                 placeholder="Title"
//                                 className="px-2 py-1 border border-gray-300 rounded text-xs"
//                               />
//                               <input
//                                 type="text"
//                                 value={action.payload}
//                                 onChange={(e) => {
//                                   const newItems = [...carouselItems]
//                                   newItems[index].actions[actionIndex].payload = e.target.value
//                                   setCarouselItems(newItems)
//                                 }}
//                                 placeholder="URL"
//                                 className="px-2 py-1 border border-gray-300 rounded text-xs"
//                               />
//                               <button
//                                 type="button"
//                                 onClick={() => {
//                                   const newItems = [...carouselItems]
//                                   newItems[index].actions.splice(actionIndex, 1)
//                                   setCarouselItems(newItems)
//                                 }}
//                                 className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
//                               >
//                                 Remove
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     ))}
                    
//                     <div className="mt-6 border-t pt-4">
//                       <div className="flex items-center justify-between mb-3">
//                         <h4 className="text-md font-semibold text-gray-900">Global Suggestions</h4>
//                         <button
//                           type="button"
//                           onClick={() => setCarouselSuggestions([...carouselSuggestions, { title: '', payload: '' }])}
//                           className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
//                         >
//                           <FaPlus className="text-xs inline mr-1" /> Add Suggestion
//                         </button>
//                       </div>
//                       {carouselSuggestions.map((suggestion, index) => (
//                         <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2 p-3 bg-indigo-50 rounded-lg">
//                           <input
//                             type="text"
//                             value={suggestion.title}
//                             onChange={(e) => {
//                               const newSuggestions = [...carouselSuggestions]
//                               newSuggestions[index].title = e.target.value
//                               setCarouselSuggestions(newSuggestions)
//                             }}
//                             placeholder="Reply text"
//                             className="px-3 py-2 border border-gray-300 rounded text-sm"
//                           />
//                           <input
//                             type="text"
//                             value={suggestion.payload}
//                             onChange={(e) => {
//                               const newSuggestions = [...carouselSuggestions]
//                               newSuggestions[index].payload = e.target.value
//                               setCarouselSuggestions(newSuggestions)
//                             }}
//                             placeholder="Postback data"
//                             className="px-3 py-2 border border-gray-300 rounded text-sm"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => setCarouselSuggestions(carouselSuggestions.filter((_, i) => i !== index))}
//                             className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
//                           >
//                             Remove
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Modal Footer */}
//                 <div className="flex justify-end gap-3 pt-4 border-t">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsModalOpen(false)
//                       resetForm()
//                     }}
//                     className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                   >
//                     Cancel
//                   </button>
//                   <button 
//                     type="submit"
//                     className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//                   >
//                     {editingTemplate ? 'Update' : 'Create'}
//                   </button>
//                 </div>
//               </form>
//             </div>

//             {/* Right Side - Live Preview */}
//             <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
        
              
//               <div className="bg-white rounded-lg shadow-lg p-4">
//                  <div className="bg-purple-600 text-white p-3 rounded-t-lg">
//                   <div className="flex items-center gap-2">
//                     <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
//                       <span className="text-purple-500 font-bold text-sm">W</span>
//                     </div>
//                     <span className="font-medium"> Template Preview</span>
//                   </div>
//                 </div>
                
//                 <div className="p-4 min-h-600px]">
//                   {/* Plain Text Preview */}
//                   {messageType === 'text' && formData.text && (
//                     <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
//                       <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
//                     </div>
//                   )}
                  
//                   {/* Text with Actions Preview */}
//                   {messageType === 'text-with-action' && (
//                     <div className="max-w-xs">
//                       {formData.text && (
//                         <div className="bg-gray-100 p-3 rounded-lg mb-2">
//                           <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
//                         </div>
//                       )}
//                       {actions.filter(a => a.title.trim()).length > 0 && (
//                         <div className="space-y-1">
//                           {actions.filter(a => a.title.trim()).map((action, index) => (
//                             <button key={index} className="w-full py-2 border border-blue-500 text-blue-500 rounded text-sm font-medium">
//                               {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}
                  
//                   {/* RCS Rich Card Preview */}
//                   {messageType === 'rcs' && (
//                     <div className="border border-gray-200 rounded-lg max-w-sm overflow-hidden">
//                       {richCard.imageUrl && (
//                         <img 
//                           src={richCard.imageUrl} 
//                           alt="RCS Card" 
//                           className="w-full h-32 object-cover"
//                           onError={(e) => {
//                             e.target.src = 'https://via.placeholder.com/300x128/f5f5f5/666666?text=RCS+Card'
//                           }}
//                         />
//                       )}
//                       <div className="p-3">
//                         {richCard.title && (
//                           <h4 className="font-semibold text-gray-900 mb-1">{richCard.title}</h4>
//                         )}
//                         {richCard.subtitle && (
//                           <p className="text-xs text-gray-600 mb-2">{richCard.subtitle}</p>
//                         )}
//                         {formData.text && (
//                           <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{formData.text}</p>
//                         )}
//                         {richCard.actions?.filter(a => a.title.trim()).length > 0 && (
//                           <div className="space-y-2">
//                             {richCard.actions.filter(a => a.title.trim()).map((action, index) => (
//                               <button key={index} className="w-full py-2 bg-blue-500 text-white rounded text-sm font-medium">
//                                 {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
//                               </button>
//                             ))}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}
                  
//                   {/* Carousel Preview */}
//                   {messageType === 'carousel' && carouselItems.filter(item => item.title.trim()).length > 0 && (
//                     <div className="max-w-sm">
//                       {formData.text && (
//                         <div className="bg-gray-100 p-3 rounded-lg mb-3 max-w-xs">
//                           <p className="text-sm text-gray-800 whitespace-pre-wrap">{formData.text}</p>
//                         </div>
//                       )}
//                       <div className="flex gap-2 overflow-x-auto pb-2">
//                         {carouselItems.filter(item => item.title.trim()).map((item, index) => (
//                           <div key={index} className="border border-gray-200 rounded-lg min-w-[200px] overflow-hidden">
//                             {item.imageUrl && (
//                               <img 
//                                 src={item.imageUrl} 
//                                 alt={`Carousel ${index + 1}`} 
//                                 className="w-full h-24 object-cover"
//                                 onError={(e) => {
//                                   e.target.src = 'https://via.placeholder.com/200x96/f5f5f5/666666?text=Item+' + (index + 1)
//                                 }}
//                               />
//                             )}
//                             <div className="p-2">
//                               <h5 className="font-medium text-xs text-gray-900">{item.title}</h5>
//                               {item.subtitle && (
//                                 <p className="text-xs text-gray-600 mt-1">{item.subtitle}</p>
//                               )}
//                               {item.actions?.filter(a => a.title.trim()).length > 0 && (
//                                 <div className="space-y-1 mt-2">
//                                   {item.actions.filter(a => a.title.trim()).map((action, actionIndex) => (
//                                     <button key={actionIndex} className="w-full py-1 bg-blue-500 text-white rounded text-xs font-medium">
//                                       {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
//                                     </button>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                       {carouselSuggestions.filter(s => s.title.trim()).length > 0 && (
//                         <div className="mt-3 flex flex-wrap gap-2">
//                           {carouselSuggestions.filter(s => s.title.trim()).map((suggestion, index) => (
//                             <button key={index} className="px-3 py-2 border border-purple-500 text-purple-600 rounded text-sm font-medium">
//                               💬 {suggestion.title}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                       <div className="text-xs text-gray-500 text-center mt-2">
//                         Swipe to see more items →
//                       </div>
//                     </div>
//                   )}
                  
//                   {/* Empty State */}
//                   {!formData.text && messageType === 'text' && (
//                     <div className="bg-gray-100 p-3 rounded-lg max-w-xs">
//                       <p className="text-sm text-gray-500 italic">Type your message here...</p>
//                     </div>
//                   )}
//                   {!formData.text && messageType !== 'text' && (
//                     <div className="flex items-center justify-center h-full text-gray-400">
//                       <div className="text-center">
//                         <p className="text-sm">Start typing to see preview</p>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Image Crop Modal */}
//       {imageCropModalOpen && tempImageFile && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold">Crop Image</h3>
//               <button
//                 onClick={() => {
//                   setImageCropModalOpen(false)
//                   setTempImageFile(null)
//                 }}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <FaTimes size={24} />
//               </button>
//             </div>

//             <div className="space-y-4">
//               {/* Image Preview with Crop Area */}
//               <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-x-auto">
//                 <div className="relative inline-block">
//                   <img
//                     id="cropImage"
//                     src={URL.createObjectURL(tempImageFile)}
//                     alt="Crop Preview"
//                     className="max-w-full rounded-lg"
//                     onLoad={(e) => {
//                       setImageDimensions({
//                         width: e.target.naturalWidth,
//                         height: e.target.naturalHeight
//                       })
//                       if (cropCoords.width === 0) {
//                         setCropCoords({
//                           x: 0,
//                           y: 0,
//                           width: e.target.naturalWidth,
//                           height: e.target.naturalHeight
//                         })
//                       }
//                     }}
//                   />
//                   {/* Crop Area Overlay */}
//                   <svg
//                     className="absolute top-0 left-0 pointer-events-none"
//                     id="cropOverlay"
//                     style={{
//                       width: imageDimensions.width,
//                       height: imageDimensions.height
//                     }}
//                   >
//                     <defs>
//                       <mask id="cropMask">
//                         <rect width={imageDimensions.width} height={imageDimensions.height} fill="white" />
//                         <rect
//                           x={cropCoords.x}
//                           y={cropCoords.y}
//                           width={cropCoords.width}
//                           height={cropCoords.height}
//                           fill="black"
//                         />
//                       </mask>
//                     </defs>
//                     <rect
//                       width={imageDimensions.width}
//                       height={imageDimensions.height}
//                       fill="black"
//                       opacity="0.5"
//                       mask="url(#cropMask)"
//                     />
//                     <rect
//                       x={cropCoords.x}
//                       y={cropCoords.y}
//                       width={cropCoords.width}
//                       height={cropCoords.height}
//                       fill="none"
//                       stroke="#3b82f6"
//                       strokeWidth="2"
//                     />
//                   </svg>
//                 </div>
//               </div>

//               {/* Crop Controls */}
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">X Position</label>
//                   <input
//                     type="range"
//                     min="0"
//                     max={Math.max(0, imageDimensions.width - cropCoords.width)}
//                     value={cropCoords.x}
//                     onChange={(e) => setCropCoords({...cropCoords, x: parseInt(e.target.value)})}
//                     className="w-full mt-1"
//                   />
//                   <p className="text-xs text-gray-600 mt-1">{cropCoords.x}px</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">Y Position</label>
//                   <input
//                     type="range"
//                     min="0"
//                     max={Math.max(0, imageDimensions.height - cropCoords.height)}
//                     value={cropCoords.y}
//                     onChange={(e) => setCropCoords({...cropCoords, y: parseInt(e.target.value)})}
//                     className="w-full mt-1"
//                   />
//                   <p className="text-xs text-gray-600 mt-1">{cropCoords.y}px</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">Width</label>
//                   <input
//                     type="range"
//                     min="50"
//                     max={imageDimensions.width}
//                     value={cropCoords.width}
//                     onChange={(e) => setCropCoords({...cropCoords, width: parseInt(e.target.value)})}
//                     className="w-full mt-1"
//                   />
//                   <p className="text-xs text-gray-600 mt-1">{cropCoords.width}px</p>
//                 </div>
//                 <div>
//                   <label className="text-sm font-medium text-gray-700">Height</label>
//                   <input
//                     type="range"
//                     min="50"
//                     max={imageDimensions.height}
//                     value={cropCoords.height}
//                     onChange={(e) => setCropCoords({...cropCoords, height: parseInt(e.target.value)})}
//                     className="w-full mt-1"
//                   />
//                   <p className="text-xs text-gray-600 mt-1">{cropCoords.height}px</p>
//                 </div>
//               </div>

//               {/* Crop Info */}
//               <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//                 <h4 className="font-semibold text-blue-900 mb-2">Image Information</h4>
//                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//                   <div>
//                     <p className="text-blue-700">Original Size</p>
//                     <p className="text-lg font-bold text-blue-900">{imageDimensions.width}×{imageDimensions.height}px</p>
//                   </div>
//                   <div>
//                     <p className="text-blue-700">Crop Size</p>
//                     <p className="text-lg font-bold text-blue-900">{cropCoords.width}×{cropCoords.height}px</p>
//                   </div>
//                   <div>
//                     <p className="text-blue-700">Aspect Ratio</p>
//                     <p className="text-lg font-bold text-blue-900">{(cropCoords.width / cropCoords.height).toFixed(2)}</p>
//                   </div>
//                   <div>
//                     <p className="text-blue-700">Coverage</p>
//                     <p className="text-lg font-bold text-blue-900">{Math.round((cropCoords.width * cropCoords.height) / (imageDimensions.width * imageDimensions.height) * 100)}%</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Buttons */}
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setImageCropModalOpen(false)
//                     setTempImageFile(null)
//                   }}
//                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={() => {
//                     setCropCoords({
//                       x: 0,
//                       y: 0,
//                       width: imageDimensions.width,
//                       height: imageDimensions.height
//                     })
//                   }}
//                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
//                 >
//                   Reset
//                 </button>
//                 <button
//                   onClick={handleCropConfirm}
//                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
//                 >
//                   ✓ Crop & Upload
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }



// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Row,
//   Col,
//   Table,
//   Button,
//   Input,
//   Select,
//   Form,
//   Upload,
//   Modal,
//   Tag,
//   Space,
//   Empty,
//   Divider,
//   Tooltip,
//   Breadcrumb,
//   Grid,
//   Statistic,
// } from 'antd';
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   EditOutlined,
//   EyeOutlined,
//   CloudUploadOutlined,
//   HomeOutlined,
//   FileTextOutlined,
//   FormOutlined,
//   CopyOutlined,
//   CheckCircleOutlined,
//   CloseOutlined,
//   ReloadOutlined,
// } from '@ant-design/icons';
// import { THEME_CONSTANTS } from '../../theme';
// import ApiService from '../../services/api';
// import { getMessageTypeLabel } from '../../utils/messageTypes';
// import { useAuth } from '../../context/AuthContext';
// import toast from 'react-hot-toast';

// const { useBreakpoint } = Grid;

// export default function TemplatePage() {
//   const { user } = useAuth();
//   const screens = useBreakpoint();
//   const [form] = Form.useForm();
//   const [templates, setTemplates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingTemplate, setEditingTemplate] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '',
//     text: '',
//     imageUrl: '',
//   });
//   const [mediaFile, setMediaFile] = useState(null);
//   const [messageType, setMessageType] = useState('text');
//   const [actions, setActions] = useState([{ type: 'reply', title: '', payload: '' }]);
//   const [richCard, setRichCard] = useState({ title: '', subtitle: '', imageUrl: '', actions: [] });
//   const [carouselItems, setCarouselItems] = useState([{ title: '', subtitle: '', imageUrl: '', actions: [] }]);
//   const [carouselSuggestions, setCarouselSuggestions] = useState([]);
//   const [previewOpen, setPreviewOpen] = useState(false);
//   const [previewData, setPreviewData] = useState(null);

//   useEffect(() => {
//     if (user?._id) {
//       fetchTemplates();
//     }
//   }, [user]);

//   const fetchTemplates = async () => {
//     try {
//       setLoading(true);
//       const response = await ApiService.getUserTemplates(user?._id);
//       setTemplates(response.data || []);
//       toast.success('Templates fetched successfully');
//     } catch (err) {
//       toast.error('Failed to fetch templates');
//       setError('Failed to fetch templates');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const uploadFile = async (file) => {
//     try {
//       const result = await ApiService.uploadFile(file);
//       toast.success('File uploaded successfully');
//       return result.url;
//     } catch (error) {
//       toast.error('File upload failed: ' + error.message);
//       return null;
//     }
//   };

//   const handleImageSelect = async (file) => {
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setMediaFile(file);
//         setFormData({ ...formData, imageUrl: e.target.result });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleDeleteImage = () => {
//     setMediaFile(null);
//     setFormData({ ...formData, imageUrl: '' });
//     toast.success('Image deleted');
//   };

//   const addAction = (target = 'main') => {
//     const newAction = { type: 'reply', title: '', payload: '' };
//     if (target === 'main') {
//       setActions([...actions, newAction]);
//     } else if (target === 'richCard') {
//       setRichCard({ ...richCard, actions: [...richCard.actions, newAction] });
//     }
//   };

//   const removeAction = (index, target = 'main') => {
//     if (target === 'main') {
//       setActions(actions.filter((_, i) => i !== index));
//     } else if (target === 'richCard') {
//       setRichCard({
//         ...richCard,
//         actions: richCard.actions.filter((_, i) => i !== index),
//       });
//     }
//   };

//   const addCarouselItem = () => {
//     setCarouselItems([...carouselItems, { title: '', subtitle: '', imageUrl: '', actions: [] }]);
//   };

//   const removeCarouselItem = (index) => {
//     setCarouselItems(carouselItems.filter((_, i) => i !== index));
//   };

//   const handlePreview = (template) => {
//     setPreviewData(template);
//     setPreviewOpen(true);
//   };

//   const handleEdit = (template) => {
//     setEditingTemplate(template);
//     setFormData({
//       name: template.name,
//       text: template.text || '',
//       imageUrl: template.imageUrl || '',
//     });
//     setMessageType(template.messageType);
//     setActions(template.actions || []);
//     setRichCard(template.richCard || { title: '', subtitle: '', imageUrl: '', actions: [] });
//     setCarouselItems(template.carouselItems || []);
//     setCarouselSuggestions(template.carouselSuggestions || []);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id) => {
//     Modal.confirm({
//       title: 'Delete Template',
//       content: 'Are you sure you want to delete this template?',
//       okText: 'Delete',
//       okType: 'danger',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           await ApiService.deleteTemplate(id);
//           toast.success('Template deleted successfully');
//           fetchTemplates();
//         } catch (err) {
//           toast.error('Failed to delete template');
//         }
//       },
//     });
//   };

//   const resetForm = () => {
//     setFormData({ name: '', text: '', imageUrl: '' });
//     setMessageType('text');
//     setActions([{ type: 'reply', title: '', payload: '' }]);
//     setRichCard({ title: '', subtitle: '', imageUrl: '', actions: [] });
//     setCarouselItems([{ title: '', subtitle: '', imageUrl: '', actions: [] }]);
//     setCarouselSuggestions([]);
//     setEditingTemplate(null);
//     setMediaFile(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!formData.name.trim()) {
//       toast.error('Template name is required');
//       setError('Template name is required');
//       return;
//     }

//     if ((messageType === 'text' || messageType === 'text-with-action') && !formData.text.trim()) {
//       toast.error('Template text is required');
//       setError('Template text is required');
//       return;
//     }

//     const templateData = {
//       name: formData.name.trim(),
//       messageType,
//       text: formData.text.trim(),
//       imageUrl: formData.imageUrl.trim(),
//       userId: user?._id,
//     };

//     if (messageType === 'text-with-action') {
//       templateData.actions = actions.filter((a) => a.title.trim());
//     } else if (messageType === 'rcs') {
//       templateData.richCard = {
//         ...richCard,
//         actions: richCard.actions.filter((a) => a.title.trim()),
//       };
//     } else if (messageType === 'carousel') {
//       const validItems = carouselItems
//         .filter((item) => {
//           if (!item.title.trim()) return false;
//           const validActions = (item.actions || []).filter(
//             (a) => a.title.trim() && a.payload.trim()
//           );
//           return validActions.length > 0;
//         })
//         .map((item) => ({
//           ...item,
//           actions: item.actions.filter((a) => a.title.trim() && a.payload.trim()),
//         }));

//       if (validItems.length === 0) {
//         const msg = 'Each carousel item must have at least one valid action';
//         toast.error(msg);
//         setError(msg);
//         return;
//       }

//       templateData.carouselItems = validItems;
//       templateData.carouselSuggestions = carouselSuggestions.filter(
//         (s) => s.title.trim() && s.payload.trim()
//       );
//     }

//     try {
//       if (editingTemplate) {
//         await ApiService.updateTemplate(editingTemplate._id, templateData);
//         toast.success('Template updated successfully');
//       } else {
//         await ApiService.createTemplate(templateData);
//         toast.success('Template created successfully');
//       }
//       await fetchTemplates();
//       resetForm();
//       setIsModalOpen(false);
//       setError('');
//     } catch (err) {
//       console.error('Template save error:', err);
//       let errorMsg = 'Failed to save template';
//       const serverMsg = err.response?.data?.message || err.message || '';

//       if (serverMsg.includes('E11000') && serverMsg.includes('name')) {
//         errorMsg = `Template name "${formData.name}" already exists.`;
//       } else {
//         errorMsg = serverMsg;
//       }

//       toast.error(errorMsg);
//       setError(errorMsg);
//     }
//   };

//   const columns = [
//     {
//       title: 'Template Name',
//       dataIndex: 'name',
//       key: 'name',
//       render: (text, record) => (
//         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//           <div
//             style={{
//               width: '44px',
//               height: '44px',
//               background: `${THEME_CONSTANTS.colors.primary}20`,
//               borderRadius: THEME_CONSTANTS.radius.md,
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <FileTextOutlined style={{ fontSize: '20px', color: THEME_CONSTANTS.colors.primary }} />
//           </div>
//           <div>
//             <div style={{ fontWeight: 600, color: THEME_CONSTANTS.colors.textPrimary }}>
//               {text}
//             </div>
//             <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginTop: '4px' }}>
//               ID: {record._id?.slice(-8)}
//             </div>
//           </div>
//         </div>
//       ),
//       width: '35%',
//     },
//     {
//       title: 'Type',
//       dataIndex: 'messageType',
//       key: 'type',
//       render: (type) => (
//         <Tag
//           style={{
//             background: `${THEME_CONSTANTS.colors.primary}15`,
//             color: THEME_CONSTANTS.colors.primary,
//             border: `1px solid ${THEME_CONSTANTS.colors.primary}`,
//             fontWeight: 600,
//             padding: '6px 12px',
//             borderRadius: THEME_CONSTANTS.radius.sm,
//           }}
//         >
//           {getMessageTypeLabel(type)}
//         </Tag>
//       ),
//       width: '20%',
//     },
//     {
//       title: 'Preview',
//       key: 'preview',
//       render: (text, record) => (
//         <Button
//           type="text"
//           icon={<EyeOutlined />}
//           onClick={() => handlePreview(record)}
//           style={{ color: THEME_CONSTANTS.colors.primary }}
//         >
//           View
//         </Button>
//       ),
//       width: '15%',
//     },
//     {
//       title: 'Status',
//       key: 'status',
//       render: (text, record) => {
//         const createdDate = new Date(record.createdAt);
//         const now = new Date();
//         const secondsDiff = (now - createdDate) / 1000;

//         return secondsDiff < 3 ? (
//           <Tag color="processing" style={{ fontWeight: 600 }}>
//             Pending
//           </Tag>
//         ) : (
//           <Tag color="success" style={{ fontWeight: 600 }}>
//             Approved
//           </Tag>
//         );
//       },
//       width: '15%',
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (text, record) => (
//         <Space>
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             onClick={() => handleEdit(record)}
//             style={{ color: THEME_CONSTANTS.colors.primary }}
//             title="Edit"
//           />
//           <Button
//             type="text"
//             icon={<DeleteOutlined />}
//             onClick={() => handleDelete(record._id)}
//             style={{ color: '#ff4d4f' }}
//             title="Delete"
//           />
//         </Space>
//       ),
//       width: '15%',
//     },
//   ];

//   return (
//     <>
//       <div
//         style={{
//           padding: screens.md ? '24px' : '16px',
//           background: THEME_CONSTANTS.colors.background,
//           minHeight: '100vh',
//         }}
//       >
//         {/* Breadcrumb */}
//         <Breadcrumb
//           style={{
//             marginBottom: '24px',
//             fontSize: '13px',
//           }}
//         >
//           <Breadcrumb.Item>
//             <HomeOutlined style={{ marginRight: '6px' }} />
//             <span style={{ color: THEME_CONSTANTS.colors.textSecondary }}>Home</span>
//           </Breadcrumb.Item>
//           <Breadcrumb.Item>
//             <span style={{ color: THEME_CONSTANTS.colors.primary, fontWeight: 600 }}>
//               Templates
//             </span>
//           </Breadcrumb.Item>
//         </Breadcrumb>

//         {/* Header Section */}
//         <div style={{ marginBottom: '32px' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
//             <div>
//               <div
//                 style={{
//                   fontSize: '28px',
//                   fontWeight: 700,
//                   color: THEME_CONSTANTS.colors.textPrimary,
//                   marginBottom: '8px',
//                 }}
//               >
//                 Templates
//               </div>
//               <div
//                 style={{
//                   fontSize: '14px',
//                   color: THEME_CONSTANTS.colors.textSecondary,
//                 }}
//               >
//                 Manage your message templates and reusable message formats.
//               </div>
//             </div>
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => setIsModalOpen(true)}
//               style={{
//                 background: THEME_CONSTANTS.colors.primary,
//                 borderColor: THEME_CONSTANTS.colors.primary,
//               }}
//               size="large"
//             >
//               Create Template
//             </Button>
//           </div>
//         </div>

//         {/* Templates Table */}
//         <Card
//           style={{
//             borderRadius: THEME_CONSTANTS.radius.lg,
//             border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
//             boxShadow: THEME_CONSTANTS.shadow.md,
//           }}
//           bodyStyle={{ padding: 0 }}
//         >
//           <div
//             style={{
//               padding: '24px',
//               borderBottom: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
//               background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.background}, ${THEME_CONSTANTS.colors.background}dd)`,
//             }}
//           >
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//               <div>
//                 <h2 style={{ fontSize: '20px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary, margin: '0 0 4px 0' }}>
//                   Your Templates
//                 </h2>
//                 <p style={{ fontSize: '13px', color: THEME_CONSTANTS.colors.textSecondary, margin: 0 }}>
//                   View and manage all your saved message templates
//                 </p>
//               </div>
//               <Button
//                 icon={<ReloadOutlined />}
//                 onClick={fetchTemplates}
//                 loading={loading}
//               >
//                 Refresh
//               </Button>
//             </div>
//           </div>

//           {loading ? (
//             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
//               <div
//                 style={{
//                   width: '50px',
//                   height: '50px',
//                   borderRadius: '50%',
//                   borderTop: `4px solid ${THEME_CONSTANTS.colors.primary}`,
//                   borderRight: `4px solid transparent`,
//                   animation: 'spin 1s linear infinite',
//                 }}
//               />
//               <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: THEME_CONSTANTS.colors.textSecondary }}>
//                 Loading templates...
//               </p>
//             </div>
//           ) : templates.length === 0 ? (
//             <Empty
//               description="No templates found"
//               style={{ padding: '60px 20px' }}
//             />
//           ) : (
//             <Table
//               columns={columns}
//               dataSource={templates}
//               rowKey="_id"
//               pagination={false}
//               style={{ borderCollapse: 'collapse' }}
//               scroll={{ x: 800 }}
//             />
//           )}
//         </Card>
//       </div>

//       {/* Preview Modal */}
//       {previewOpen && previewData && (
//         <Modal
//           title={
//             <div>
//               <div style={{ fontSize: '18px', fontWeight: 700, color: THEME_CONSTANTS.colors.textPrimary }}>
//                 Template Preview
//               </div>
//               <div
//                 style={{
//                   fontSize: '13px',
//                   color: THEME_CONSTANTS.colors.textSecondary,
//                   marginTop: '4px',
//                 }}
//               >
//                 {getMessageTypeLabel(previewData.messageType)}
//               </div>
//             </div>
//           }
//           open={previewOpen}
//           onCancel={() => setPreviewOpen(false)}
//           width={600}
//           footer={null}
//           bodyStyle={{ padding: '24px' }}
//         >
//           <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
//             {previewData.messageType === 'text' && (
//               <div
//                 style={{
//                   background: `${THEME_CONSTANTS.colors.primary}10`,
//                   padding: '16px',
//                   borderRadius: THEME_CONSTANTS.radius.md,
//                   borderLeft: `4px solid ${THEME_CONSTANTS.colors.primary}`,
//                 }}
//               >
//                 <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: THEME_CONSTANTS.colors.textPrimary }}>
//                   {previewData.text}
//                 </p>
//               </div>
//             )}

//             {previewData.messageType === 'text-with-action' && (
//               <div style={{ maxWidth: '400px' }}>
//                 {previewData.text && (
//                   <div
//                     style={{
//                       background: `${THEME_CONSTANTS.colors.primary}10`,
//                       padding: '16px',
//                       borderRadius: THEME_CONSTANTS.radius.md,
//                       marginBottom: '16px',
//                       borderLeft: `4px solid ${THEME_CONSTANTS.colors.primary}`,
//                     }}
//                   >
//                     <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
//                       {previewData.text}
//                     </p>
//                   </div>
//                 )}
//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                   {previewData.actions?.map((action, index) => (
//                     <Button
//                       key={index}
//                       block
//                       type="primary"
//                       style={{ background: THEME_CONSTANTS.colors.primary }}
//                     >
//                       {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
//                     </Button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {previewData.messageType === 'rcs' && (
//               <Card
//                 style={{
//                   borderRadius: THEME_CONSTANTS.radius.md,
//                   border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
//                 }}
//               >
//                 {previewData.richCard?.imageUrl && (
//                   <img
//                     src={previewData.richCard.imageUrl}
//                     alt="RCS Card"
//                     style={{ width: '100%', height: '200px', objectFit: 'cover', marginBottom: '16px', borderRadius: THEME_CONSTANTS.radius.sm }}
//                   />
//                 )}
//                 {previewData.richCard?.title && (
//                   <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: THEME_CONSTANTS.colors.textPrimary }}>
//                     {previewData.richCard.title}
//                   </div>
//                 )}
//                 {previewData.richCard?.subtitle && (
//                   <div style={{ fontSize: '14px', color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '16px' }}>
//                     {previewData.richCard.subtitle}
//                   </div>
//                 )}
//                 {previewData.richCard?.actions?.length > 0 && (
//                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                     {previewData.richCard.actions.map((action, index) => (
//                       <Button
//                         key={index}
//                         block
//                         type="primary"
//                         style={{ background: THEME_CONSTANTS.colors.primary }}
//                       >
//                         {action.type === 'call' ? '📞' : action.type === 'url' ? '🔗' : '💬'} {action.title}
//                       </Button>
//                     ))}
//                   </div>
//                 )}
//               </Card>
//             )}

//             {previewData.messageType === 'carousel' && (
//               <div>
//                 {previewData.carouselItems?.length > 0 && (
//                   <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
//                     {previewData.carouselItems.map((item, index) => (
//                       <Card
//                         key={index}
//                         style={{
//                           borderRadius: THEME_CONSTANTS.radius.md,
//                           border: `1px solid ${THEME_CONSTANTS.colors.borderLight}`,
//                           minWidth: '280px',
//                           flex: '0 0 280px',
//                         }}
//                       >
//                         {item.imageUrl && (
//                           <img
//                             src={item.imageUrl}
//                             alt={`Carousel ${index + 1}`}
//                             style={{ width: '100%', height: '150px', objectFit: 'cover', marginBottom: '12px', borderRadius: THEME_CONSTANTS.radius.sm }}
//                           />
//                         )}
//                         <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
//                           {item.title}
//                         </div>
//                         {item.subtitle && (
//                           <div style={{ fontSize: '12px', color: THEME_CONSTANTS.colors.textSecondary, marginBottom: '12px' }}>
//                             {item.subtitle}
//                           </div>
//                         )}
//                         {item.actions?.length > 0 && (
//                           <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
//                             {item.actions.map((action, actionIndex) => (
//                               <Button
//                                 key={actionIndex}
//                                 size="small"
//                                 block
//                                 type="primary"
//                                 style={{ background: THEME_CONSTANTS.colors.primary }}
//                               >
//                                 {action.title}
//                               </Button>
//                             ))}
//                           </div>
//                         )}
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </Modal>
//       )}

//       {/* Create/Edit Modal */}
//       {isModalOpen && (
//         <Modal
//           title={editingTemplate ? 'Edit Template' : 'Create New Template'}
//           open={isModalOpen}
//           onCancel={() => {
//             setIsModalOpen(false);
//             resetForm();
//           }}
//           width={900}
//           footer={null}
//           bodyStyle={{ padding: '24px' }}
//         >
//           <Form layout="vertical" onFinish={handleSubmit}>
//             {/* Template Name & Type */}
//             <Row gutter={[16, 16]}>
//               <Col xs={24} sm={12}>
//                 <Form.Item label="Template Name" required>
//                   <Input
//                     placeholder="Enter template name"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} sm={12}>
//                 <Form.Item label="Message Type" required>
//                   <Select
//                     value={messageType}
//                     onChange={setMessageType}
//                     options={[
//                       { label: 'Plain Text', value: 'text' },
//                       { label: 'Text with Actions', value: 'text-with-action' },
//                       { label: 'RCS Rich Card', value: 'rcs' },
//                       { label: 'Carousel', value: 'carousel' },
//                     ]}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             {/* Message Text */}
//             {(messageType === 'text' || messageType === 'text-with-action') && (
//               <Form.Item label="Message Text" required>
//                 <Input.TextArea
//                   rows={4}
//                   placeholder="Enter your message text"
//                   value={formData.text}
//                   onChange={(e) => setFormData({ ...formData, text: e.target.value })}
//                 />
//               </Form.Item>
//             )}

//             {/* Text-with-Action Actions */}
//             {messageType === 'text-with-action' && (
//               <div style={{ marginBottom: '24px' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//                   <span style={{ fontWeight: 600 }}>Actions</span>
//                   <Button type="dashed" icon={<PlusOutlined />} onClick={() => addAction('main')} size="small">
//                     Add Action
//                   </Button>
//                 </div>
//                 {actions.map((action, index) => (
//                   <Card key={index} style={{ marginBottom: '12px' }}>
//                     <Row gutter={[12, 12]}>
//                       <Col xs={24} sm={8}>
//                         <Select
//                           value={action.type}
//                           onChange={(value) => {
//                             const newActions = [...actions];
//                             newActions[index].type = value;
//                             setActions(newActions);
//                           }}
//                           options={[
//                             { label: 'Reply', value: 'reply' },
//                             { label: 'URL', value: 'url' },
//                             { label: 'Call', value: 'call' },
//                           ]}
//                         />
//                       </Col>
//                       <Col xs={24} sm={8}>
//                         <Input
//                           placeholder="Title"
//                           value={action.title}
//                           onChange={(e) => {
//                             const newActions = [...actions];
//                             newActions[index].title = e.target.value;
//                             setActions(newActions);
//                           }}
//                         />
//                       </Col>
//                       <Col xs={24} sm={8}>
//                         <Input
//                           placeholder={action.type === 'url' ? 'https://...' : action.type === 'call' ? '+1234567890' : 'Payload'}
//                           value={action.payload}
//                           onChange={(e) => {
//                             const newActions = [...actions];
//                             newActions[index].payload = e.target.value;
//                             setActions(newActions);
//                           }}
//                         />
//                       </Col>
//                       <Col xs={24} style={{ textAlign: 'right' }}>
//                         <Button type="text" danger onClick={() => removeAction(index, 'main')} size="small">
//                           Remove
//                         </Button>
//                       </Col>
//                     </Row>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {/* RCS Rich Card */}
//             {messageType === 'rcs' && (
//               <div style={{ marginBottom: '24px' }}>
//                 <Divider>Rich Card Details</Divider>
//                 <Row gutter={[16, 16]}>
//                   <Col xs={24} sm={12}>
//                     <Form.Item label="Title" required>
//                       <Input
//                         placeholder="Card title"
//                         value={richCard.title}
//                         onChange={(e) => setRichCard({ ...richCard, title: e.target.value })}
//                       />
//                     </Form.Item>
//                   </Col>
//                   <Col xs={24} sm={12}>
//                     <Form.Item label="Subtitle">
//                       <Input
//                         placeholder="Card subtitle"
//                         value={richCard.subtitle}
//                         onChange={(e) => setRichCard({ ...richCard, subtitle: e.target.value })}
//                       />
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 <Form.Item label="Image">
//                   <Upload
//                     accept="image/*"
//                     maxCount={1}
//                     onChange={(info) => {
//                       if (info.fileList.length > 0) {
//                         const file = info.fileList[0].originFileObj;
//                         handleImageSelect(file);
//                       }
//                     }}
//                     onRemove={() => handleDeleteImage()}
//                   >
//                     <Button icon={<CloudUploadOutlined />}>Upload Image</Button>
//                   </Upload>
//                   {formData.imageUrl && (
//                     <img src={formData.imageUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginTop: '12px', borderRadius: THEME_CONSTANTS.radius.md }} />
//                   )}
//                 </Form.Item>

//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//                   <span style={{ fontWeight: 600 }}>Actions</span>
//                   <Button type="dashed" icon={<PlusOutlined />} onClick={() => addAction('richCard')} size="small">
//                     Add Action
//                   </Button>
//                 </div>
//                 {richCard.actions.map((action, index) => (
//                   <Card key={index} style={{ marginBottom: '12px' }}>
//                     <Row gutter={[12, 12]}>
//                       <Col xs={24} sm={8}>
//                         <Select
//                           value={action.type}
//                           onChange={(value) => {
//                             const newActions = [...richCard.actions];
//                             newActions[index].type = value;
//                             setRichCard({ ...richCard, actions: newActions });
//                           }}
//                           options={[
//                             { label: 'Reply', value: 'reply' },
//                             { label: 'URL', value: 'url' },
//                             { label: 'Call', value: 'call' },
//                           ]}
//                         />
//                       </Col>
//                       <Col xs={24} sm={8}>
//                         <Input
//                           placeholder="Title"
//                           value={action.title}
//                           onChange={(e) => {
//                             const newActions = [...richCard.actions];
//                             newActions[index].title = e.target.value;
//                             setRichCard({ ...richCard, actions: newActions });
//                           }}
//                         />
//                       </Col>
//                       <Col xs={24} sm={8}>
//                         <Input
//                           placeholder="Payload"
//                           value={action.payload}
//                           onChange={(e) => {
//                             const newActions = [...richCard.actions];
//                             newActions[index].payload = e.target.value;
//                             setRichCard({ ...richCard, actions: newActions });
//                           }}
//                         />
//                       </Col>
//                       <Col xs={24} style={{ textAlign: 'right' }}>
//                         <Button type="text" danger onClick={() => removeAction(index, 'richCard')} size="small">
//                           Remove
//                         </Button>
//                       </Col>
//                     </Row>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {/* Carousel */}
//             {messageType === 'carousel' && (
//               <div style={{ marginBottom: '24px' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//                   <span style={{ fontWeight: 600 }}>Carousel Items</span>
//                   <Button type="dashed" icon={<PlusOutlined />} onClick={addCarouselItem} size="small">
//                     Add Item
//                   </Button>
//                 </div>
//                 {carouselItems.map((item, index) => (
//                   <Card key={index} style={{ marginBottom: '12px' }}>
//                     <Row gutter={[16, 16]}>
//                       <Col xs={24} sm={12}>
//                         <Form.Item label="Title" required>
//                           <Input
//                             placeholder="Item title"
//                             value={item.title}
//                             onChange={(e) => {
//                               const newItems = [...carouselItems];
//                               newItems[index].title = e.target.value;
//                               setCarouselItems(newItems);
//                             }}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col xs={24} sm={12}>
//                         <Form.Item label="Subtitle">
//                           <Input
//                             placeholder="Item subtitle"
//                             value={item.subtitle}
//                             onChange={(e) => {
//                               const newItems = [...carouselItems];
//                               newItems[index].subtitle = e.target.value;
//                               setCarouselItems(newItems);
//                             }}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>
//                     <Button
//                       type="text"
//                       danger
//                       onClick={() => removeCarouselItem(index)}
//                       style={{ marginTop: '12px' }}
//                     >
//                       Remove Item
//                     </Button>
//                   </Card>
//                 ))}
//               </div>
//             )}

//             {error && (
//               <div style={{ padding: '12px', background: '#ff4d4f20', color: '#ff4d4f', borderRadius: THEME_CONSTANTS.radius.sm, marginBottom: '16px' }}>
//                 {error}
//               </div>
//             )}

//             <Form.Item style={{ marginBottom: 0 }}>
//               <Space style={{ float: 'right' }}>
//                 <Button
//                   onClick={() => {
//                     setIsModalOpen(false);
//                     resetForm();
//                   }}
//                 >
//                   Cancel
//                 </Button>
//                 <Button type="primary" htmlType="submit" style={{ background: THEME_CONSTANTS.colors.primary }}>
//                   {editingTemplate ? 'Update' : 'Create'}
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         </Modal>
//       )}

//       <style>{`
//         @keyframes spin {
//           to {
//             transform: rotate(360deg);
//           }
//         }
//       `}</style>
//     </>
//   );
// }
