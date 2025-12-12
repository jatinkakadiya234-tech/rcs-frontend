import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

const AdminProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Profile</h1>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-full bg-purple-600 text-white flex items-center justify-center text-3xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.name}</h2>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FaEnvelope className="text-xl text-gray-600" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <FaPhone className="text-xl text-gray-600" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user?.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
