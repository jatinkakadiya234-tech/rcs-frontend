import { useState } from 'react';
import apiService from '../../services/api';
import CustomModal from '../../components/CustomModal';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    jioId: '',
    jioSecret: '',
    companyname:""
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ show: false, type: 'success', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await apiService.createUser(formData);
      if (data.success) {
        setModal({ show: true, type: 'success', title: 'Success', message: 'User created successfully!' });
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: 'user',
          jioId: '',
          jioSecret: '',
          companyname:""
        });
      } else {
        setModal({ show: true, type: 'error', title: 'Error', message: data.message });
      }
    } catch (error) {
      setModal({ show: true, type: 'error', title: 'Error', message: 'Error creating user' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="w-full flex justify-center py-10">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-8 border border-gray-100">

        <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">
          Create New User
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Input Field Wrapper */}
          {[
            { label: "Name", name: "name", type: "text" },
            { label: "Email", name: "email", type: "email" },
            { label: "Password", name: "password", type: "password" },
            { label: "Phone", name: "phone", type: "tel" },
            { label: "companyname", name: "companyname", type: "text" },
          ].map((field, index) => (
            <div key={index}>
              <label className="block mb-1.5 font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                required
                value={formData[field.name]}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
                           focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all"
              />
            </div>
          ))}

          {/* Role Dropdown */}
          <div>
            <label className="block mb-1.5 font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
                         focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Jio Fields */}
          <div>
            <label className="block mb-1.5 font-medium text-gray-700">Jio Client ID</label>
            <input
              type="text"
              name="jioId"
              value={formData.jioId}
              onChange={handleChange}
              placeholder="Enter Jio Client ID (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
                         focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-medium text-gray-700">Jio Client Secret</label>
            <input
              type="password"
              name="jioSecret"
              value={formData.jioSecret}
              onChange={handleChange}
              placeholder="Enter Jio Client Secret (optional)"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50
                         focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-lg font-semibold bg-purple-600 text-white rounded-lg
                       hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create User'}
          </button>
        </form>
      </div>

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

export default CreateUser;
