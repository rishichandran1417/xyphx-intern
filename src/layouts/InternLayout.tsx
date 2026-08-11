import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppLink as Link } from '@/components/AppLink'
import { useAuth } from '../contexts/AuthContext'
import { Menu, X, User } from 'lucide-react'
import { XyphxPageTransition } from '@/components/xyphx/XyphxPageTransition'
import { AnimatePresence } from 'framer-motion'

export default function InternLayout() {
  const { session, profile, loading, signOut } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (loading) return <div className="flex h-screen items-center justify-center xyphx-canvas">Loading...</div>
  
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Intercept forced password change
  if (profile?.force_password_change) {
    return <Navigate to="/setup-password" replace />
  }

  // If user is admin, they shouldn't be in the intern layout
  if (profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Progress updates', href: '/updates' },
    { name: 'Documents', href: '/documents' },
    { name: 'Certificates', href: '/certificate' },
  ]

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="flex h-screen overflow-hidden xyphx-canvas">
      
      {/* Desktop Navbar */}
      <div className="fixed top-0 inset-x-0 h-[76px] border-b border-xyphx-border bg-white/80 backdrop-blur-md z-40 flex items-center px-6 lg:px-12 justify-between">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center shrink-0">
            <img src="https://xyphx.com/logo.png" alt="XyphX Logo" className="h-8 w-8 object-contain" />
          </Link>
          
          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium transition-colors duration-200 relative group px-3 py-1.5 ${
                    isActive 
                      ? 'text-xyphx-purple bg-xyphx-purple/5 rounded-full' 
                      : 'text-xyphx-muted hover:text-xyphx-text'
                  }`}
                >
                  {item.name}
                  {!isActive && (
                    <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-xyphx-text origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Desktop Right Controls */}
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/profile" className="p-2 rounded-full hover:bg-xyphx-purple/5 text-xyphx-muted hover:text-xyphx-purple transition-colors">
            <User className="h-5 w-5" />
          </Link>
          <button 
            onClick={signOut}
            className="text-sm font-medium text-xyphx-muted hover:text-xyphx-text flex items-center gap-2 transition-colors px-3 py-1.5 relative group"
          >
            Sign Out
            <span className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-xyphx-text origin-left scale-x-0 transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-2 text-xyphx-text"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-xyphx-text/20 backdrop-blur-sm" onClick={closeMenu} />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-xyphx-bg border-l border-xyphx-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between h-[76px] px-6 border-b border-xyphx-border">
              <span className="font-semibold xyphx-heading">Menu</span>
              <button onClick={closeMenu} className="p-2 text-xyphx-muted hover:text-xyphx-text">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
              {navigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={closeMenu}
                    className={`block px-4 py-3 rounded-xl text-base font-medium ${
                      isActive ? 'bg-xyphx-purple/10 text-xyphx-purple' : 'text-xyphx-text hover:bg-white/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
              <div className="my-4 border-t border-xyphx-border" />
              <Link
                to="/profile"
                onClick={closeMenu}
                className="block px-4 py-3 rounded-xl text-base font-medium text-xyphx-text hover:bg-white/50"
              >
                Profile
              </Link>
              <button
                onClick={() => { closeMenu(); signOut(); }}
                className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-xyphx-text hover:bg-white/50 flex items-center gap-3"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto mt-[76px] relative">
        <div className="max-w-[1200px] mx-auto p-6 md:p-12 pb-24">
          <AnimatePresence mode="wait">
            <XyphxPageTransition>
              <Outlet />
            </XyphxPageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
