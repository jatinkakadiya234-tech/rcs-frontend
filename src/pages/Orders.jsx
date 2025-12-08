import { useState, useEffect } from 'react'
import { FaEye, FaDownload, FaTrash } from 'react-icons/fa'
import api from '../services/api'
import * as XLSX from 'xlsx'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await api.getMessageReportsall()
      setOrders(data.data || [])
    } catch (err) {
      setError('Failed to fetch orders')
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Sent': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const viewOrderDetails = (order) => {
    setSelectedOrder(order)
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
        setOrders(orders.filter(order => order._id !== orderId))
      } catch (err) {
        console.error('Error deleting order:', err)
        alert('Failed to delete message report')
      }
    }
  }

  const exportToExcel = () => {
    const exportData = orders.map((order, idx) => ({
      'ID': `#${idx + 1}`,
      'Message Type': order.type || 'N/A',
      'Phone Numbers': order.phoneNumbers?.join(', ') || 'No numbers',
      'Status': order.status || 'Pending',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Success Count': order.results?.filter(r => r.status === 201).length || 0,
      'Failed Count': order.results?.filter(r => r.status !== 201).length || 0,
      'Total Numbers': order.phoneNumbers?.length || 0
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Message Reports')
    XLSX.writeFile(wb, `message-reports-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600 text-sm mt-1">View all campaign orders</p>
          </div>
          <button 
            onClick={exportToExcel}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <FaDownload className="inline mr-2" />
            Export
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchOrders}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Message Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone Numbers</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Success/Failed</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        No message reports found
                      </td>
                    </tr>
                  ) : (
                    orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order, idx) => (
                      <tr key={order._id || idx} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">#{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                        <td className="py-3 px-4 text-sm font-medium">{order.type || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">
                          {order.phoneNumbers?.length > 0 ? (
                            <div className="max-w-xs">
                              {order.phoneNumbers.length}
                            </div>
                          ) : 'No numbers'}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'Pending')}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm">
                          {order.results?.filter(r => !r.error).length || 0}/
                          {order.results?.filter(r => r.error).length || 0}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => viewOrderDetails(order)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <FaEye />
                            </button>
                            <button 
                              onClick={() => deleteOrder(order._id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {orders.length > itemsPerPage && (
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} orders
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {currentPage} of {Math.ceil(orders.length / itemsPerPage)}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(orders.length / itemsPerPage)))}
                    disabled={currentPage === Math.ceil(orders.length / itemsPerPage)}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
            <div className="p-6 border-b">
              <div className="grid grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <span className="text-blue-600 text-xl">💬</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedOrder.phoneNumbers?.length || 0}</div>
                  <div className="text-sm text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
                    <span className="text-yellow-600 text-xl">⏳</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Sending</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedOrder.results?.filter(r => r.status === 201).length || 0}</div>
                  <div className="text-sm text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <span className="text-blue-600 text-xl">⏸</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Paused</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                    <span className="text-red-600 text-xl">✕</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-500">Cancelled</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                    <span className="text-red-600 text-xl">⚠</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{selectedOrder.results?.filter(r => r.status !== 201).length || 0}</div>
                  <div className="text-sm text-gray-500">Failed</div>
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Instance</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Instance Number</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Message Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Created At</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.phoneNumbers?.map((phone, idx) => {
                    const result = selectedOrder.results?.find(r => r.phone === phone)
                    return (
                      <tr key={idx} className="border-t hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm">{phone}</td>
                        <td className="py-3 px-4 text-sm">-</td>
                        <td className="py-3 px-4 text-sm">{phone}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {selectedOrder.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            result?.status === 201 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result?.status === 201 ? 'Sent' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">{result?.timestamp ? new Date(result.timestamp).toLocaleString() : '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add to sender list
              </button>
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
