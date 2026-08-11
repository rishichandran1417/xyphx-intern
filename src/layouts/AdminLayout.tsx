import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppLink as Link } from '@/components/AppLink'
import { useAuth } from '../contexts/AuthContext'
import { 
  LayoutDashboard, Users, CheckSquare, FileText, 
  FileBadge, Settings, LogOut 
} from 'lucide-react'

export default function AdminLayout() {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-white">Loading...</div>
  
  if (!session || profile?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Interns', href: '/admin/interns', icon: Users },
    { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
    { name: 'Progress Updates', href: '/admin/updates', icon: FileText },
    { name: 'Documents', href: '/admin/documents', icon: FileText },
    { name: 'Certificates', href: '/admin/certificates', icon: FileBadge },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden w-64 flex-col border-r bg-slate-900 md:flex">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="h-8 w-8 rounded bg-white flex items-center justify-center mr-3">
            <span className="text-slate-900 font-bold text-sm">X</span>
          </div>
          <span className="font-semibold text-white">Admin Portal</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group relative flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {item.name}
                  {!isActive && (
                    <span className="absolute -bottom-1 left-3 right-3 h-[1.5px] bg-white origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="border-t border-slate-800 p-4 space-y-1">
          <Link
            to="/admin/settings"
            className="group relative flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:text-white"
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
            Settings
            <span className="absolute -bottom-1 left-3 right-3 h-[1.5px] bg-white origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>
          <button
            onClick={signOut}
            className="group relative flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" />
            Logout
            <span className="absolute -bottom-1 left-3 right-3 h-[1.5px] bg-white origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="h-16 border-b bg-white flex items-center justify-between px-8 md:hidden">
            <span className="font-semibold text-slate-900">Admin Portal</span>
        </div>
        <div className="flex-1 p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
