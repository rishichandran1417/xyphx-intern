import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    pendingUpdates: 0,
    certificatesIssued: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: totalInterns }, { count: activeInterns }, { count: certs }] = await Promise.all([
        supabase.from('interns').select('*', { count: 'exact', head: true }),
        supabase.from('interns').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('certificates').select('*', { count: 'exact', head: true }).eq('status', 'Issued'),
      ])
      
      setStats({
        totalInterns: totalInterns || 0,
        activeInterns: activeInterns || 0,
        pendingUpdates: 0, // Placeholder
        certificatesIssued: certs || 0
      })
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-2">Overview of all internship programs.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterns}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInterns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingUpdates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesIssued}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Intern Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-slate-500">Activity logs will populate here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
