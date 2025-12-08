import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { BiRefresh } from 'react-icons/bi';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/user/messages/${user._id}`);
      const data = await response.json();
      if (data.success) {
        const messages = data.messages;
        const stats = {
          totalMessages: messages.length,
          successfulMessages: messages.filter(m => m.results?.some(r => r.status === 200 || r.status === 201)).length,
          failedMessages: messages.filter(m => m.results?.some(r => r.error)).length,
          messagesByType: messages.reduce((acc, msg) => {
            const existing = acc.find(item => item._id === msg.type);
            if (existing) existing.count++;
            else acc.push({ _id: msg.type, count: 1 });
            return acc;
          }, []),
          recentMessages: messages.slice(0, 10)
        };
        setReportData(stats);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Message Reports</h1>
        <button 
          onClick={fetchReports}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BiRefresh className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Messages</h3>
          <p className="text-2xl font-bold text-blue-600">{reportData?.totalMessages || 0}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Successful</h3>
          <p className="text-2xl font-bold text-green-600">{reportData?.successfulMessages || 0}</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Failed</h3>
          <p className="text-2xl font-bold text-red-600">{reportData?.failedMessages || 0}</p>
        </div>
      </div>

      {/* Message Types */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Messages by Type</h3>
        <div className="space-y-2">
          {reportData?.messagesByType?.map((type, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span className="capitalize">{type._id}</span>
              <span className="font-semibold">{type.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Recipients</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {reportData?.recentMessages?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((msg, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3 capitalize">{msg.type}</td>
                    <td className="p-3">{msg.phoneNumbers?.length || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        msg.results?.some(r => r.status === 201) 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {msg.results?.some(r => r.status === 201) ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="p-3">{new Date(msg.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData?.recentMessages && reportData.recentMessages.length > itemsPerPage && (
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, reportData.recentMessages.length)} of {reportData.recentMessages.length} messages
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
                  Page {currentPage} of {Math.ceil(reportData.recentMessages.length / itemsPerPage)}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(reportData.recentMessages.length / itemsPerPage)))}
                  disabled={currentPage === Math.ceil(reportData.recentMessages.length / itemsPerPage)}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;