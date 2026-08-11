import { useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useAppNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Invalid admin credentials.")
      setLoading(false)
      return
    }

    // Verify role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    
    if (profile?.role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      await supabase.auth.signOut()
      setError("Unauthorized access. Admin privileges required.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded bg-slate-100 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-xl">X</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">Admin Portal</CardTitle>
          <CardDescription>Secure access for Xyphx Administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="admin@xyphx.com" 
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button className="w-full bg-slate-900 hover:bg-slate-800" type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Sign In to Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
