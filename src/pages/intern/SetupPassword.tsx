import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { XyphxButton } from '@/components/xyphx/XyphxButton'
import { XyphxInput } from '@/components/xyphx/XyphxInput'
import { XyphxCard, XyphxCardContent, XyphxCardDescription, XyphxCardHeader, XyphxCardTitle } from '@/components/xyphx/XyphxCard'
import { Label } from '@/components/ui/label'

export default function SetupPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  // Prevent accessing if no forced change needed
  if (profile && !profile.force_password_change) {
    navigate('/dashboard')
    return null
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      setLoading(false)
      return
    }

    // 1. Update Auth user password
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // 2. Mark force_password_change as false in intern_profiles
    if (user) {
      const { error: profileError } = await supabase
        .from('intern_profiles')
        .update({ force_password_change: false })
        .eq('id', user.id)

      if (profileError) {
        setError("Failed to update profile flags.")
        setLoading(false)
        return
      }
      
      // Force reload page to refresh context state and trigger layout redirect
      window.location.href = '/intern/dashboard'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center xyphx-canvas p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(108,62,244,0.05)_0%,transparent_50%)] pointer-events-none" />

      <div className="xyphx-reveal is-visible w-full max-w-[400px] relative z-10">
        <XyphxCard>
          <XyphxCardHeader className="space-y-3 text-center pb-8 pt-10">
            <div className="flex justify-center mb-2">
              <img src="https://xyphx.com/logo.png" alt="XyphX" className="h-14 w-14 object-contain" />
            </div>
            <XyphxCardTitle className="text-3xl tracking-tight text-xyphx-text">Set Permanent Password</XyphxCardTitle>
            <XyphxCardDescription className="text-xyphx-muted text-base">
              You must change your temporary password before accessing your dashboard.
            </XyphxCardDescription>
          </XyphxCardHeader>
          <XyphxCardContent>
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xyphx-text font-medium ml-1">New Password</Label>
                <XyphxInput 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xyphx-text font-medium ml-1">Confirm Password</Label>
                <XyphxInput 
                  id="confirmPassword" 
                  type="password"
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
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
                  {loading ? "Updating..." : "Save and Continue"}
                </XyphxButton>
              </div>
            </form>
          </XyphxCardContent>
        </XyphxCard>
      </div>
    </div>
  )
}
