import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/layout.jsx'
import AdminLayout from './layout/AdminLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Ragister from './pages/Ragister.jsx'
import Tapletepate from './pages/Tapletepate.jsx'
import Orders from './pages/Orders.jsx'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthChecker from './components/AuthChecker'
import SendMessage from './pages/SendMessageClean.jsx'
import Reports from './pages/Reports.jsx'
import Profile from './pages/Profile.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Users from './pages/admin/Users.jsx'
import WalletRequests from './pages/admin/WalletRequests.jsx'
import CreateUser from './pages/admin/CreateUser.jsx'
import RoleBasedRoute from './components/RoleBasedRoute.jsx'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AuthChecker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ragister" element={<Ragister />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['user']}>
              <Layout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }> 
          <Route index element={<Dashboard />} />
          <Route path="newCampaign" element={<SendMessage />} />
          <Route path="templates" element={<Tapletepate />} />
          <Route path="reports" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="wallet-requests" element={<WalletRequests />} />
          <Route path="create-user" element={<CreateUser />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App



