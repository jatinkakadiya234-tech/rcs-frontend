import { useState, useEffect } from 'react';
import { BiRefresh } from 'react-icons/bi';
import { FaTimes, FaEye, FaEdit, FaWallet, FaKey, FaToggleOn, FaToggleOff, FaHistory, FaTrash } from 'react-icons/fa';
import apiService from '../../services/api';
import CustomModal from '../../components/CustomModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionSummary, setTransactionSummary] = useState(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({});
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [walletAmount, setWalletAmount] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async (userId, userName, page = 1) => {
    setLoadingOrders(true);
    setSelectedUser({ id: userId, name: userName });
    setShowModal(true);
    
    try {
      const data = await apiService.getUserOrders(userId, page, 20);
      if (data.success) {
        setOrders(data.orderHistory.orders);
        setOrderPagination(data.orderHistory.pagination);
      }
    } catch (error) {
      console.error('Error fetching user orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setOrders([]);
    setOrderPage(1);
  };

  const fetchUserTransactions = async (userId, userName) => {
    setLoadingTransactions(true);
    setSelectedUser({ id: userId, name: userName });
    setShowTransactionModal(true);
    
    try {
      const data = await apiService.getUserTransactionSummary(userId);
      if (data.success) {
        setTransactionSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedUser(null);
    setTransactionSummary(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      jioId: user.jioId || '',
      jioSecret: user.jioSecret || '',
      status: user.status || 'active'
    });
    setShowEditModal(true);
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.editUser(selectedUser._id, editFormData);
      if (response.success) {
        setModal({ show: true, type: 'success', title: 'Success', message: 'User updated successfully!' });
        fetchUsers();
        setShowEditModal(false);
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error updating user' });
    }
  };

  const openWalletModal = (user) => {
    setSelectedUser(user);
    setWalletAmount('');
    setShowWalletModal(true);
  };

  const handleAddWallet = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.addWalletBalance(selectedUser._id, Number(walletAmount));
      if (response.success) {
        setModal({ show: true, type: 'success', title: 'Success', message: 'Wallet balance added successfully!' });
        fetchUsers();
        setShowWalletModal(false);
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error adding wallet balance' });
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await apiService.resetPassword(selectedUser._id, newPassword);
      if (response.success) {
        setModal({ show: true, type: 'success', title: 'Success', message: 'Password reset successfully!' });
        setShowPasswordModal(false);
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error resetting password' });
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await apiService.updateUserStatus(userId, newStatus);
      if (response.success) {
        setModal({ show: true, type: 'success', title: 'Success', message: `User status updated to ${newStatus}` });
        fetchUsers();
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error updating user status' });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          setModal({ show: true, type: 'success', title: 'Success', message: 'User deleted successfully!' });
          fetchUsers();
        }
      } catch (error) {
        setModal({ show: true, type: 'error', title: 'Error', message: 'Error deleting user' });
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">All Users</h1>
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <BiRefresh className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ">              Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-semibold">₹{user.Wallet || 0}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => fetchUserOrders(user._id, user.name, 1)} className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium">
                      <FaEye /> 
                    </button>
                    <button onClick={() => openEditModal(user)} className="flex items-center gap-1 px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium">
                      <FaEdit /> 
                    </button>
                    <button onClick={() => openWalletModal(user)} className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium">
                      <FaWallet /> 
                    </button>
                    <button onClick={() => openPasswordModal(user)} className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
                      <FaKey /> 
                    </button>
                    <button onClick={() => handleToggleStatus(user._id, user.status)} className="flex items-center gap-1 px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium">
                      {user.status === 'active' ? <><FaToggleOn /> </> : <><FaToggleOff /> </>}
                    </button>
                    <button onClick={() => fetchUserTransactions(user._id, user.name)} className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 text-sm font-medium">
                      <FaHistory /> 
                    </button>
                    <button onClick={() => handleDeleteUser(user._id, user.name)} className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium">
                      <FaTrash /> 
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="number"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jio ID</label>
                <input
                  type="text"
                  value={editFormData.jioId}
                  onChange={(e) => setEditFormData({...editFormData, jioId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jio Secret</label>
                <input
                  type="text"
                  value={editFormData.jioSecret}
                  onChange={(e) => setEditFormData({...editFormData, jioSecret: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Update User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reset Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <input type="text" value={selectedUser?.name} disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Enter new password" minLength="6" required />
              </div>
              <button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700">Reset Password</button>
            </form>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Wallet Balance</h2>
              <button onClick={() => setShowWalletModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleAddWallet} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User</label>
                <input
                  type="text"
                  value={selectedUser?.name}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Balance</label>
                <input
                  type="text"
                  value={`₹${selectedUser?.Wallet || 0}`}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount to Add</label>
                <input
                  type="number"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                Add Balance
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Transaction History - {selectedUser?.name}</h2>
              <button onClick={closeTransactionModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            {loadingTransactions ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : transactionSummary ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-blue-800">Current Balance</h3>
                    <p className="text-2xl font-bold text-blue-600">₹{transactionSummary.currentBalance}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-800">Total Credit</h3>
                    <p className="text-2xl font-bold text-green-600">₹{transactionSummary.totalCredit}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-red-800">Total Debit</h3>
                    <p className="text-2xl font-bold text-red-600">₹{transactionSummary.totalDebit}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold text-purple-800">Net Amount</h3>
                    <p className="text-2xl font-bold text-purple-600">₹{transactionSummary.netAmount}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-700">Type</th>
                          <th className="text-left p-3 font-medium text-gray-700">Amount</th>
                          <th className="text-left p-3 font-medium text-gray-700">Description</th>
                          <th className="text-left p-3 font-medium text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionSummary.recentTransactions?.map((txn, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs ${txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {txn.type}
                              </span>
                            </td>
                            <td className="p-3 font-semibold">
                              <span className={txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                              </span>
                            </td>
                            <td className="p-3">{txn.description}</td>
                            <td className="p-3">{new Date(txn.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No transactions found</div>
            )}
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order History - {selectedUser?.name}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>

            {loadingOrders ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orders.length > 0 ? (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-700">Campaign</th>
                          <th className="text-left p-3 font-medium text-gray-700">Type</th>
                          <th className="text-left p-3 font-medium text-gray-700">Numbers</th>
                          <th className="text-left p-3 font-medium text-gray-700">Success</th>
                          <th className="text-left p-3 font-medium text-gray-700">Failed</th>
                          <th className="text-left p-3 font-medium text-gray-700">Cost</th>
                          <th className="text-left p-3 font-medium text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order._id} className="border-t hover:bg-gray-50">
                            <td className="p-3">{order.CampaignName}</td>
                            <td className="p-3 capitalize">{order.type}</td>
                            <td className="p-3">{order.totalNumbers}</td>
                            <td className="p-3 text-green-600">{order.successCount}</td>
                            <td className="p-3 text-red-600">{order.failedCount}</td>
                            <td className="p-3 font-semibold">₹{order.cost}</td>
                            <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-center gap-2 mt-4">
                    <button
                      onClick={() => {
                        const newPage = orderPage - 1;
                        setOrderPage(newPage);
                        fetchUserOrders(selectedUser.id, newPage);
                      }}
                      disabled={orderPage === 1}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2">Page {orderPagination.page} of {orderPagination.pages}</span>
                    <button
                      onClick={() => {
                        const newPage = orderPage + 1;
                        setOrderPage(newPage);
                        fetchUserOrders(selectedUser.id, newPage);
                      }}
                      disabled={orderPage === orderPagination.pages}
                      className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">No orders found</div>
              )
            }
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

export default Users;