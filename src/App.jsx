import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layout/layout.jsx'
import AdminLayout from './layout/AdminLayout.jsx'
import Dashboard from './pages/user/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import TemplatePage from './pages/user/TemplatePage.jsx'
import Orders from './pages/user/Orders.jsx'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AuthChecker from './components/AuthChecker'
import SendMessage from './pages/user/SendMessage.jsx'
import Profile from './pages/Profile.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Users from './pages/admin/Users.jsx'
import WalletRequests from './pages/admin/WalletRequests.jsx'
import CreateUser from './pages/admin/CreateUser.jsx'
import AdminProfile from './pages/admin/AdminProfile.jsx'
import RoleBasedRoute from './components/RoleBasedRoute.jsx'
import { Toaster } from 'react-hot-toast'
import AdminReports from './pages/admin/AdminReports.jsx'

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AuthChecker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={
          <ProtectedRoute>
            <RoleBasedRoute allowedRoles={['user']}>
              <Layout />
            </RoleBasedRoute>
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="newCampaign" element={<SendMessage />} />
          <Route path="templates" element={<TemplatePage />} />
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
          {/* <Route path="create-user" element={<CreateUser />} />x */}
          <Route path="profile" element={<AdminProfile />} />
          <Route path="reports" element={<AdminReports />} />

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App



