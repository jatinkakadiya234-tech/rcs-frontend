import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaExclamationTriangle } from 'react-icons/fa';

const AccountStatusChecker = () => {
  const { user, logout } = useAuth();
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    if (user && user.status === 'inactive') {
      setShowInactive(true);
    }
  }, [user]);

  if (!showInactive) return null;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaExclamationTriangle className="text-4xl text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Account Inactive</h2>
        <p className="text-gray-600 mb-6">
          Your account is currently inactive. Please contact the support team for assistance.
        </p>
        
        <button
          onClick={logout}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default AccountStatusChecker;
