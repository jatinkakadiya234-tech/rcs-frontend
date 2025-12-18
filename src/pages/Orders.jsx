import { useState, useEffect } from 'react'
import { FaEye, FaDownload, FaTrash, FaSearch, FaFilter, FaCalendarAlt, FaChartLine } from 'react-icons/fa'
import { BiRefresh } from 'react-icons/bi'
import api from '../services/api'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Orders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalCurrentPage, setModalCurrentPage] = useState(1)
  const [modalItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [campaignFilter, setCampaignFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [sortOrder, setSortOrder] = useState('desc')
  const [stats, setStats] = useState(null)
  const [CampaignData, setCampaignData] = useState(null)

  useEffect(() => {
    if (user?._id) {
      fetchOrders()
    }
  }, [user,CampaignData])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, searchTerm, statusFilter, typeFilter, campaignFilter, dateRange, sortOrder])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getMessageReportsall(user._id)
      const ordersData = data.data || []
      

      setOrders(ordersData)
      toast.success('Orders fetched successfully')
      
      // Calculate stats
      const totalOrders = ordersData.length
      const successfulOrders = ordersData.filter(order => 
        order.results?.some(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ")
      ).length
      const failedOrders = ordersData.filter(order => 
        order.results?.some(r => r.error || r.messaestatus === "SEND_MESSAGE_FAILURE")
      ).length
      const pendingOrders = ordersData.filter(order => 
        !order.results || order.results.length === 0
      ).length
      const totalRecipients = ordersData.reduce((sum, order) => 
        sum + (order.phoneNumbers?.length || 0), 0
      )

      
      
      console.log(CampaignData,"ccccscscn=------------------");
      let totalorders = CampaignData ? CampaignData.map(order => order.cost).toString() :totalOrders;
      let totelSuccess = CampaignData ? CampaignData.map(order => order.successCount).toString() :successfulOrders;
      let fildedorders = CampaignData ? CampaignData.map(order => order.failedCount).toString() :failedOrders;
      console.log(totalorders,"totel order----------------");
      console.log(totelSuccess,"totel succses=-----------------");
      console.log(fildedorders,"fileefvdvd");
      
      setStats({
        totalOrders: totalorders, 
        successfulOrders: totelSuccess,
        failedOrders,
        pendingOrders,
        totalRecipients,
        successRate: totalOrders > 0 ? ((successfulOrders / totalOrders) * 100).toFixed(1) : 0
      })
    } catch (err) {
      setError('Failed to fetch orders')
      toast.error('Failed to fetch orders')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortOrders = () => {
    let filtered = [...orders]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.phoneNumbers?.some(phone => phone.includes(searchTerm)) ||
        order._id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (statusFilter === 'success') {
          return order.results?.some(r => r.status === 201)
        } else if (statusFilter === 'failed') {
          return order.results?.some(r => r.error || r.status !== 201)
        } else if (statusFilter === 'pending') {
          return !order.results || order.results.length === 0
        }
        return true
      })
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.type === typeFilter)
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) >= new Date(dateRange.start)
      )
    }
    if (dateRange.end) {
      filtered = filtered.filter(order => 
        new Date(order.createdAt) <= new Date(dateRange.end + 'T23:59:59')
      )
    }

    // Campaign filter
    if (campaignFilter !== 'all') {
      filtered = filtered.filter(order => order.CampaignName === campaignFilter)
    }

    // Sort by date
    filtered.sort((a, b) => {
      const aValue = new Date(a.createdAt)
      const bValue = new Date(b.createdAt)
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredOrders(filtered)
    
    // Update stats for filtered data
    const totalOrders = filtered.length
    const successfulOrders = filtered.filter(order => 
      order.results?.some(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ")
    ).length
    const failedOrders = filtered.filter(order => 
      order.results?.some(r => r.error || r.messaestatus === "SEND_MESSAGE_FAILURE")
    ).length
    const totalRecipients = filtered.reduce((sum, order) => 
      sum + (order.phoneNumbers?.length || 0), 0
    )
    
    setStats({
      totalOrders,
      successfulOrders,
      failedOrders,
      totalRecipients,
      successRate: totalOrders > 0 ? ((successfulOrders / totalOrders) * 100).toFixed(1) : 0
    })
    
    setCurrentPage(1)
  }

  const getUniqueTypes = () => {
    return [...new Set(orders.map(order => order.type).filter(Boolean))]
  }

  const getUniqueCampaigns = () => {
    return [...new Set(orders.map(order => order.CampaignName).filter(Boolean))]
  }

  const getStatusBadge = (order) => {
    if (!order.results || order.results.length === 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pending</span>
    }
    
    const hasSuccess = order.results.some(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ")
    const hasFailure = order.results.some(r => r.error || r.status !== 201)
    
    if (hasSuccess && !hasFailure) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Success</span>
    } else if (hasFailure && !hasSuccess) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">Failed</span>
    } 
    
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Success</span>
  }

  const viewOrderDetails = (order) => {
    setSelectedOrder(order)
    setModalCurrentPage(1)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOrder(null)
  }

  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this message report?')) {
      try {
        await api.deleteMessageReport(orderId)
        toast.success('Order deleted successfully')
        setOrders(orders.filter(order => order._id !== orderId))
      } catch (err) {
        console.error('Error deleting order:', err)
        toast.error('Failed to delete message report')
      }
    }
  }

  const exportToExcel = () => {
    try {
      const exportData = filteredOrders.map((order, idx) => ({
        'ID': `#${idx + 1}`,
        "CampaignName": order.campaignName || 'N/A',
        'Message Type': order.type || 'N/A',
        'Total Recipients': order.phoneNumbers?.length || 0,
        'Successful': order.results?.filter(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ").length || 0,
        'Failed': order.results?.filter(r => r.messaestatus === "MESSAGE_FAILED" || r.messaestatus === "SEND_MESSAGE_FAILED").length || 0,
        'Status': order.results?.some(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ") ? 
                  (order.results?.some(r => r.messaestatus === "MESSAGE_FAILED" || r.messaestatus === "SEND_MESSAGE_FAILED") ? 'Failed' : 'Success') : 
                  (order.results?.length > 0 ? 'Failed' : 'Pending'),
        'Created Date': new Date(order.createdAt).toLocaleDateString(),
        'Created Time': new Date(order.createdAt).toLocaleTimeString(),
        'Phone Numbers': order.phoneNumbers?.join(', ') || 'No numbers'
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Orders Report')
      XLSX.writeFile(wb, `orders-report-${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Report exported successfully')
    } catch (err) {
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Orders</h1>
            <p className="text-gray-600 text-sm mt-1">Manage and track all your message campaigns</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaDownload />
              Export
            </button>
            <button 
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BiRefresh className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
                <FaChartLine className="text-2xl opacity-80" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Successful</h3>
                  <p className="text-2xl font-bold">{stats.successfulOrders}</p>
                </div>
                <div className="text-2xl opacity-80">✓</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Failed</h3>
                  <p className="text-2xl font-bold">{stats.failedOrders}</p>
                </div>
                <div className="text-2xl opacity-80">✕</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium opacity-90">Success Rate</h3>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <div className="text-2xl opacity-80">📊</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {getUniqueTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Campaign Filter */}
            <select
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value)
                if (e.target.value !== 'all') {
                  const campaignData = orders.filter(order => order.CampaignName === e.target.value)
                  toast.success(`Showing campaign: ${e.target.value}`)
                  setCampaignData(campaignData)
                } else {
                  toast.success('Showing all campaigns')
                  console.log('Showing all campaigns')
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Campaigns</option>
              {getUniqueCampaigns().map(campaign => (
                <option key={campaign} value={campaign}>{campaign}</option>
              ))}
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              <FaFilter />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>
            
            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-semibold">{error}</p>
            </div>
            <button 
              onClick={fetchOrders}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Campaign Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Message Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Recipients</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Success/Failed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium">No orders found</p>
                          <p className="text-sm text-gray-400">Try adjusting your filters or create a new campaign</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, idx) => {
                      const successCount = order.results?.filter(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ").length || 0
                      const failedCount = order.results?.filter(r => r.messaestatus === "SEND_MESSAGE_FAILURE" ).length || 0
                      
                      return (
                        <tr key={order._id || idx} className="border-t hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-mono">#{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-purple-600 text-xs rounded capitalize font-medium">
                              {order.CampaignName || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize font-medium">
                              {order.type || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold">
                            {order.phoneNumbers?.length || 0}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">{successCount}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-red-600 font-semibold">{failedCount}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {getStatusBadge(order)}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="text-xs">
                              <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                              <div className="text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => viewOrderDetails(order)}
                                className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button 
                                onClick={() => deleteOrder(order._id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete Order"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {filteredOrders.length > itemsPerPage && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm bg-white border rounded">
                    Page {currentPage} of {Math.ceil(filteredOrders.length / itemsPerPage)}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredOrders.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Campaign Report - {selectedOrder.type}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex justify-center">
                <div className="grid grid-cols-7 gap-11  max-w-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-3">
                      <span className="text-blue-600 text-2xl">💬</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.phoneNumbers?.length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Total</div>
                  </div>
                 
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-3">
                      <span className="text-green-600 text-2xl">✓</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.messaestatus === "MESSAGE_DELIVERED" || r.messaestatus === "SEND_MESSAGE_SUCCESS" || r.messaestatus === "MESSAGE_READ").length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Sent</div>
                  </div>
                   <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3">
                      <span className="text-yellow-600 text-2xl">⏳</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.messaestatus === "MESSAGE_DELIVERED").length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-3">
                      <span className="text-red-600 text-2xl mb-2">👁️</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.messaestatus === "MESSAGE_READ").length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Read</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-3">
                      <span className="text-red-600 text-2xl v">⚠</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.messaestatus === "SEND_MESSAGE_FAILURE").length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-3">
                      <span className="text-red-600 text-2xl ">👆</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.entityType ==="USER_MESSAGE"  ? r.suggestionResponse?.length > 0 : false).length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Clickd</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center w-16 h-16 bg-blue-200 rounded-full mx-auto mb-3">
                      <span className="text-red-600 text-2xl mb-2">🔁</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{selectedOrder.results?.filter(r => r.entityType ==="USER_MESSAGE"  ? r.userReplay?.length > 0 : false).length || 0}</div>
                    <div className="text-sm text-gray-500 font-medium">Replyed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SN</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Number</th>
       
                  
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Message Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                   
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sent At</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700"> Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const processed = selectedOrder.phoneNumbers
                      ?.map((phone, idx) => {
                        const result = selectedOrder.results?.find(r => r.phone === phone)
                        return { phone, result, originalIdx: idx }
                      }) || []

                    processed.sort((a, b) => {
                      const getPriority = (status) => {
                        if (status === "MESSAGE_READ") return 1
                        if (status === "MESSAGE_DELIVERED") return 2
                        if (status === "SEND_MESSAGE_SUCCESS") return 3
                        if (status === "SEND_MESSAGE_FAILURE") return 4
                        return 5
                      }
                      return getPriority(a.result?.messaestatus) - getPriority(b.result?.messaestatus)
                    })

                    const start = (modalCurrentPage - 1) * modalItemsPerPage
                    const pageItems = processed.slice(start, start + modalItemsPerPage)

                    return pageItems.map(({ phone, result }, idx) => (
                      <tr key={start + idx} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{start + idx + 1}</td>
                        <td className="py-3 px-4 text-sm">{phone}</td>
                        
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {selectedOrder.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result?.messaestatus === "MESSAGE_DELIVERED" || result?.messaestatus === "SEND_MESSAGE_SUCCESS" || result?.messaestatus === "MESSAGE_READ" ? 'bg-green-100 text-green-800' : result?.messaestatus === "SEND_MESSAGE_FAILURE" ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result?.messaestatus === "MESSAGE_DELIVERED" ? "Delivered" :
                             result?.messaestatus === "SEND_MESSAGE_SUCCESS" ? "Sent" :
                             result?.messaestatus === "MESSAGE_READ" ? "Read" :
                             result?.messaestatus === "SEND_MESSAGE_FAILURE" ? "Failed" :
                             result?.messaestatus || 'Sent'}
                          </span>
                        </td>
           
                        <td className="py-3 px-4 text-sm">{result?.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}</td>
                        <td className="py-3 px-4 text-sm text-red-900">{result?.errorMessage || '-'}</td>
                      </tr>
                    ))
                  })()
                  }
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setModalCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={modalCurrentPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm bg-white border rounded">
                  Page {modalCurrentPage} of {Math.max(1, Math.ceil((selectedOrder.phoneNumbers?.length || 0) / modalItemsPerPage))}
                </span>
                <button
                  onClick={() => setModalCurrentPage(prev => Math.min(prev + 1, Math.max(1, Math.ceil((selectedOrder.phoneNumbers?.length || 0) / modalItemsPerPage))))}
                  disabled={modalCurrentPage === Math.max(1, Math.ceil((selectedOrder.phoneNumbers?.length || 0) / modalItemsPerPage))}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                </button>
              </div>

              <div className="flex gap-2">
                <button onClick={closeModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const exportData = selectedOrder.phoneNumbers?.map((phone, idx) => {
                      const result = selectedOrder.results?.find(r => r.phone === phone)
                      return {
                        'SN': idx + 1,
                        'Number': phone,
                        'Instance': '-',
                        'Instance Number': phone,
                        'Message Type': selectedOrder.type,
                        'Status': result?.status === 201 ? 'Sent' : 'Failed',
                        'Created At': new Date(selectedOrder.createdAt).toLocaleString(),
                        'Sent At': result?.timestamp ? new Date(result.timestamp).toLocaleString() : '-'
                      }
                    }) || []
                    
                    const ws = XLSX.utils.json_to_sheet(exportData)
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, 'Campaign Details')
                    XLSX.writeFile(wb, `campaign-${selectedOrder.type}-${new Date().toISOString().split('T')[0]}.xlsx`)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
