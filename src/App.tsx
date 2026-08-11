import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from './contexts/AuthContext'

import InternLayout from './layouts/InternLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/Login'
import AdminLogin from './pages/admin/Login'
import Dashboard from './pages/intern/Dashboard'
import Tasks from './pages/intern/Tasks'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminInterns from './pages/admin/Interns'
import SetupPassword from './pages/intern/SetupPassword'
import ProgressUpdates from './pages/intern/ProgressUpdates'
import Documents from './pages/intern/Documents'
import Certificates from './pages/intern/Certificates'
import Announcements from './pages/intern/Announcements'
import Profile from './pages/intern/Profile'
import { Cursor } from './components/Cursor'

// Placeholder for remaining pages
const Placeholder = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center h-[50vh] w-full">
    <h1 className="text-2xl font-bold text-slate-400">{name} - Coming Soon</h1>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <Cursor />
      <BrowserRouter basename="/intern">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/intern" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/setup-password" element={<SetupPassword />} />
          
          {/* Protected Intern Routes */}
          <Route element={<InternLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/updates" element={<ProgressUpdates />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/certificate" element={<Certificates />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Profile />} />
          </Route>

          {/* Protected Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/interns" element={<AdminInterns />} />
            <Route path="/admin/tasks" element={<Placeholder name="Admin Tasks" />} />
            <Route path="/admin/updates" element={<Placeholder name="Admin Updates" />} />
            <Route path="/admin/documents" element={<Placeholder name="Admin Documents" />} />
            <Route path="/admin/certificates" element={<Placeholder name="Admin Certificates" />} />
            <Route path="/admin/announcements" element={<Placeholder name="Admin Announcements" />} />
            <Route path="/admin/settings" element={<Placeholder name="Admin Settings" />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </AuthProvider>
  )
}
