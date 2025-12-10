import { useState, useEffect } from 'react';
import { BiRefresh } from 'react-icons/bi';
import { FaEye, FaTimes } from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReports, setUserReports] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/api/v1/user/admin/users');
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

  const fetchUserReports = async (userId, userName) => {
    setLoadingReports(true);
    setSelectedUser({ id: userId, name: userName });
    setShowModal(true);
    
    try {
      const response = await fetch(`/api/api/v1/user/admin/user-reports/${userId}`);
      const data = await response.json();
      if (data.success) {
        setUserReports(data.stats);
      }
    } catch (error) {
      console.error('Error fetching user reports:', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setUserReports(null);
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <button
                    onClick={() => fetchUserReports(user._id, user.name)}
                    className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    <FaEye /> View Reports
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reports Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reports for {selectedUser?.name}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <FaTimes size={20} />
              </button>
            </div>
            
            {loadingReports ? (
              <div className="text-center py-8">Loading reports...</div>
            ) : userReports ? (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800">Total Messages</h3>
                    <p className="text-2xl font-bold text-blue-600">{userReports.totalMessages || 0}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800">Successful</h3>
                    <p className="text-2xl font-bold text-green-600">{userReports.successfulMessages || 0}</p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800">Failed</h3>
                    <p className="text-2xl font-bold text-red-600">{userReports.failedMessages || 0}</p>
                  </div>
                </div>

                {/* Message Types */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Messages by Type</h3>
                  <div className="space-y-2">
                    {userReports.messagesByType?.map((type, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize">{type._id}</span>
                        <span className="font-semibold">{type.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Messages */}
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
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
                        {userReports.recentMessages?.map((msg, index) => (
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
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No reports found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;