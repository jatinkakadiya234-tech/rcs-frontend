import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { BiRefresh, BiSearch, BiFilter, BiDownload } from 'react-icons/bi';
import { FaEye, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [allMessages, searchTerm, statusFilter, typeFilter, dateRange]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getMessageReportsall();
      const messages = data.data || [];
      
      setAllMessages(messages);
      
      const stats = {
        totalMessages: messages.length,
        successfulMessages: messages.filter(m => m.results?.some(r => r.status === 200 || r.status === 201)).length,
        failedMessages: messages.filter(m => m.results?.some(r => r.error || r.status !== 201)).length,
        pendingMessages: messages.filter(m => !m.results || m.results.length === 0).length,
        messagesByType: messages.reduce((acc, msg) => {
          const existing = acc.find(item => item._id === msg.type);
          if (existing) existing.count++;
          else acc.push({ _id: msg.type, count: 1 });
          return acc;
        }, []),
        recentMessages: messages.slice(0, 10),
        totalRecipients: messages.reduce((sum, msg) => sum + (msg.phoneNumbers?.length || 0), 0),
        successRate: messages.length > 0 ? 
          ((messages.filter(m => m.results?.some(r => r.status === 201)).length / messages.length) * 100).toFixed(1) : 0
      };
      setReportData(stats);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...allMessages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.phoneNumbers?.some(phone => phone.includes(searchTerm))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => {
        if (statusFilter === 'success') {
          return msg.results?.some(r => r.status === 201);
        } else if (statusFilter === 'failed') {
          return msg.results?.some(r => r.error || r.status !== 201);
        } else if (statusFilter === 'pending') {
          return !msg.results || msg.results.length === 0;
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.type === typeFilter);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter(msg => 
        new Date(msg.createdAt) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(msg => 
        new Date(msg.createdAt) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    setFilteredMessages(filtered);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const exportData = filteredMessages.map((msg, idx) => ({
      'ID': idx + 1,
      'Message Type': msg.type || 'N/A',
      'Recipients': msg.phoneNumbers?.length || 0,
      'Successful': msg.results?.filter(r => r.status === 201).length || 0,
      'Failed': msg.results?.filter(r => r.error || r.status !== 201).length || 0,
      'Status': msg.results?.some(r => r.status === 201) ? 'Success' : 
                msg.results?.some(r => r.error) ? 'Failed' : 'Pending',
      'Created Date': new Date(msg.createdAt).toLocaleDateString(),
      'Created Time': new Date(msg.createdAt).toLocaleTimeString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Message Reports');
    XLSX.writeFile(wb, `message-reports-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const viewMessageDetails = (message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const getStatusBadge = (message) => {
    if (!message.results || message.results.length === 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>;
    }
    
    const hasSuccess = message.results.some(r => r.status === 201);
    const hasFailure = message.results.some(r => r.error || r.status !== 201);
    
    if (hasSuccess && !hasFailure) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Success</span>;
    } else if (hasFailure && !hasSuccess) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>;
    } else if (hasSuccess && hasFailure) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Partial</span>;
    }
    
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Unknown</span>;
  };

  const getUniqueTypes = () => {
    return [...new Set(allMessages.map(msg => msg.type).filter(Boolean))];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Message Reports</h1>
            <p className="text-gray-600 text-sm mt-1">Track and analyze your message campaigns</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <BiDownload />
              Export
            </button>
            <button 
              onClick={fetchReports}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BiRefresh className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Total Campaigns</h3>
                <p className="text-2xl font-bold">{reportData?.totalMessages || 0}</p>
              </div>
              <FaChartBar className="text-2xl opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Successful</h3>
                <p className="text-2xl font-bold">{reportData?.successfulMessages || 0}</p>
              </div>
              <div className="text-2xl opacity-80">✓</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Failed</h3>
                <p className="text-2xl font-bold">{reportData?.failedMessages || 0}</p>
              </div>
              <div className="text-2xl opacity-80">✕</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium opacity-90">Success Rate</h3>
                <p className="text-2xl font-bold">{reportData?.successRate || 0}%</p>
              </div>
              <div className="text-2xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
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
        </div>

        {/* Message Types Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FaChartBar className="text-purple-600" />
                Campaign Types Distribution
              </h3>
              <div className="space-y-3">
                {reportData?.messagesByType?.map((type, index) => {
                  const percentage = ((type.count / reportData.totalMessages) * 100).toFixed(1);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-purple-500 rounded" style={{backgroundColor: `hsl(${index * 60}, 70%, 50%)`}}></div>
                        <span className="capitalize font-medium">{type._id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{width: `${percentage}%`, backgroundColor: `hsl(${index * 60}, 70%, 50%)`}}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold min-w-[3rem] text-right">{type.count}</span>
                        <span className="text-xs text-gray-500 min-w-[3rem] text-right">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Recipients</span>
                <span className="font-bold">{reportData?.totalRecipients || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-bold text-yellow-600">{reportData?.pendingMessages || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg. Recipients/Campaign</span>
                <span className="font-bold">
                  {reportData?.totalMessages > 0 ? 
                    Math.round((reportData?.totalRecipients || 0) / reportData.totalMessages) : 0
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FaCalendarAlt className="text-purple-600" />
              All Campaigns ({filteredMessages.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">ID</th>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Recipients</th>
                  <th className="text-left p-3 font-medium text-gray-700">Success/Failed</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMessages.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      No campaigns found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredMessages
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((msg, index) => {
                      const successCount = msg.results?.filter(r => r.status === 201).length || 0;
                      const failedCount = msg.results?.filter(r => r.error || r.status !== 201).length || 0;
                      
                      return (
                        <tr key={msg._id || index} className="border-t hover:bg-gray-50">
                          <td className="p-3 font-mono text-xs">#{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize font-medium">
                              {msg.type || 'N/A'}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{msg.phoneNumbers?.length || 0}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">{successCount}</span>
                              <span className="text-gray-400">/</span>
                              <span className="text-red-600 font-semibold">{failedCount}</span>
                            </div>
                          </td>
                          <td className="p-3">{getStatusBadge(msg)}</td>
                          <td className="p-3">
                            <div className="text-xs">
                              <div>{new Date(msg.createdAt).toLocaleDateString()}</div>
                              <div className="text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <button 
                              onClick={() => viewMessageDetails(msg)}
                              className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                              title="View Details"
                            >
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
          
          {filteredMessages.length > itemsPerPage && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredMessages.length)} of {filteredMessages.length} campaigns
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
                  Page {currentPage} of {Math.ceil(filteredMessages.length / itemsPerPage)}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredMessages.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredMessages.length / itemsPerPage)}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Details Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Campaign Details - {selectedMessage.type}</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Campaign Type</label>
                  <p className="text-lg font-semibold">{selectedMessage.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Created Date</label>
                  <p className="text-lg">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">Phone Numbers ({selectedMessage.phoneNumbers?.length || 0})</label>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {selectedMessage.phoneNumbers?.map((phone, idx) => (
                      <span key={idx} className="px-2 py-1 bg-white border rounded text-sm">
                        {phone}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {selectedMessage.results && selectedMessage.results.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Results</label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Phone</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMessage.results.map((result, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2 font-mono">{result.phone}</td>
                            <td className="p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                result.status === 201 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {result.status === 201 ? 'Success' : 'Failed'}
                              </span>
                            </td>
                            <td className="p-2 text-xs">
                              {result.error ? result.error : result.status === 201 ? 'Sent successfully' : 'Failed to send'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 p-6 border-t">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
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

export default Reports;