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
        const data = await apiService.getUserMessages(user._id);
        if (data.success) {
          const messages = data.messages;
          const totalMessages = messages.reduce((sum, msg) => sum + (msg.phoneNumbers?.length || 0), 0);
          const totalSpent = messages.reduce((sum, msg) => sum + (msg.cost || 0), 0);
          setUserStats({ messagesSent: totalMessages, totalSpent });
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
          <button className="ml-auto p-2 text-gray-500 hover:text-purple-600">
            <FiEdit2 />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-semibold">{user?.phone || '+91xxxxxxxxxx'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Wallet Card */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
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
      </div>

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

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Messages Sent</h4>
          <p className="text-2xl font-bold text-blue-600">{userStats.messagesSent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibold text-gray-700 mb-2">Templates Created</h4>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-semibent text-gray-700 mb-2">Total Spent</h4>
          <p className="text-2xl font-bold text-purple-600">₹{userStats.totalSpent}</p>
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