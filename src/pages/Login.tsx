import { useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { supabase } from '@/lib/supabase'
import { XyphxButton } from '@/components/xyphx/XyphxButton'
import { XyphxInput } from '@/components/xyphx/XyphxInput'
import { XyphxCard, XyphxCardContent, XyphxCardHeader, XyphxCardDescription } from '@/components/xyphx/XyphxCard'
import { Label } from '@/components/ui/label'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useAppNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Trim and normalize input
    const cleanUsername = username.trim()
    const isEmailInput = cleanUsername.includes('@')
    
    const primaryEmail = isEmailInput
      ? cleanUsername.toLowerCase()
      : `${cleanUsername.toLowerCase()}@interns.xyphx.com`

    let { data, error } = await supabase.auth.signInWithPassword({
      email: primaryEmail,
      password,
    })

    // Fallback: If username only and primary domain failed, try @xyphx.com proxy domain
    if (error && !isEmailInput) {
      const fallbackEmail = `${cleanUsername.toLowerCase()}@xyphx.com`
      const fallbackRes = await supabase.auth.signInWithPassword({
        email: fallbackEmail,
        password,
      })
      if (!fallbackRes.error) {
        data = fallbackRes.data
        error = null
      }
    }

    if (error || !data?.user) {
      setError(error?.message || "Invalid username or password.")
      setLoading(false)
      return
    }

    // Verify role to prevent admin accounts from signing in via intern login
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileData?.role === 'admin') {
      await supabase.auth.signOut()
      setError("Admin accounts must use the Admin Login page.")
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center xyphx-canvas p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,62,244,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <div className="xyphx-reveal is-visible w-full max-w-[400px] relative z-10">
        <XyphxCard>
          <XyphxCardHeader className="space-y-3 text-center pb-8 pt-10">
            <div className="flex flex-col justify-center items-center gap-3 mb-2">
              <img src="https://xyphx.com/logo.png" alt="XyphX Logo" className="h-12 w-12 object-contain" />
              <span className="text-2xl font-bold tracking-tight text-xyphx-text xyphx-heading">Intern Login</span>
            </div>
            <XyphxCardDescription className="text-xyphx-muted text-base">
              Enter your credentials to access your workspace.
            </XyphxCardDescription>
          </XyphxCardHeader>
          <XyphxCardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xyphx-text font-medium ml-1">Username</Label>
                <XyphxInput 
                  id="username" 
                  placeholder="e.g. JS2026" 
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xyphx-text font-medium ml-1">Password</Label>
                <XyphxInput 
                  id="password" 
                  type="password"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 mt-4 border border-red-500/20 bg-red-500/10 rounded-xl">
                  <p className="text-sm text-red-600 xyphx-mono font-medium text-center">{error}</p>
                </div>
              )}
              
              <div className="pt-4">
                <XyphxButton className="w-full text-base" type="submit" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In"}
                </XyphxButton>
              </div>
            </form>
          </XyphxCardContent>
        </XyphxCard>
      </div>
    </div>
  )
}
