import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiX } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';
import apiService from '../../services/api';
import CustomModal from '../../components/CustomModal';

const WalletRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const { user } = useAuth();
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const data = await apiService.getWalletRequests();
      if (data.success) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const data = await apiService.approveWalletRequest(requestId, user._id, 'Approved by admin');
      if (data.success) {
        fetchRequests();
        setModal({ show: true, type: 'success', title: 'Success', message: 'Request approved successfully!' });
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error approving request' });
    }
  };


  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setModal({ show: true, type: 'warning', title: 'Warning', message: 'Please enter rejection reason' });
      return;
    }

    try {
      const data = await apiService.rejectWalletRequest(selectedRequestId, user._id, rejectReason);
      if (data.success) {
        fetchRequests();
        setModal({ show: true, type: 'success', title: 'Success', message: 'Request rejected successfully!' });
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedRequestId(null);
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error rejecting request' });
    }
  };

  const openRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setShowRejectModal(true);
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this wallet request?')) {
      try {
        const data = await apiService.deleteWalletRequest(requestId);
        if (data.success) {
          fetchRequests();
          setModal({ show: true, type: 'success', title: 'Success', message: 'Request deleted successfully!' });
        }
      } catch (error) {
        setModal({ show: true, type: 'error', title: 'Error', message: 'Error deleting request' });
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet Requests</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request._id}>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{request.userId?.name}</div>
                    <div className="text-sm text-gray-500">{request.userId?.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold">₹{request.amount}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(request.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(request._id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(request._id)}
                      className="p-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                      title="Delete Request"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reject Request</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedRequestId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRequestId(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomModal 
        show={modal.show} 
        onClose={() => setModal({ ...modal, show: false })} 
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
  );
};

export default WalletRequests;