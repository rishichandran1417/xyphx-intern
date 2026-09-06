import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent, XyphxCardHeader, XyphxCardTitle } from '@/components/xyphx/XyphxCard'

export default function Profile() {
  const { user, profile: authProfile } = useAuth()
  const [internProfile, setInternProfile] = useState<any>(null)
  const [internDetails, setInternDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setLoading(true)

      Promise.all([
        // 1. Fetch first_name, last_name, username strictly from intern_profiles (fallback profiles)
        supabase.from('intern_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) return data
            return supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(r => r.data)
          }),

        // 2. Fetch internship details from intern_records (fallback interns)
        supabase.from('intern_records')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) return data
            return supabase.from('interns').select('*').eq('profile_id', user.id).maybeSingle().then(r => r.data)
          })
      ]).then(([pData, rData]) => {
        setInternProfile(pData)
        setInternDetails(rData)
        setLoading(false)
      })
    }
  }, [user])

  const profile = internProfile || authProfile

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-4xl mx-auto">
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Profile
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Profile
        </h1>
        <p className="text-base text-xyphx-muted mt-2">View your account information and assigned internship details.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xyphx-muted xyphx-mono text-sm">Loading profile information...</div>
      ) : (
        <div className="grid gap-6">
          <XyphxCard>
            <XyphxCardHeader className="border-b border-xyphx-border bg-white/30 rounded-t-[20px] pb-4">
              <XyphxCardTitle className="text-lg">Personal Information</XyphxCardTitle>
            </XyphxCardHeader>
            <XyphxCardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Full Name</p>
                  <p className="text-sm font-medium text-xyphx-text">
                    {profile?.first_name || profile?.last_name ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Username</p>
                  <p className="text-sm font-medium text-xyphx-text">
                    {profile?.username || user?.email || '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Account Status</p>
                  <p className="text-sm font-medium text-green-600 bg-green-500/10 inline-flex px-2 py-0.5 rounded capitalize">
                    {internDetails?.status || 'Active'}
                  </p>
                </div>
              </div>
            </XyphxCardContent>
          </XyphxCard>

          <XyphxCard>
            <XyphxCardHeader className="border-b border-xyphx-border bg-white/30 rounded-t-[20px] pb-4">
              <XyphxCardTitle className="text-lg">Internship Details</XyphxCardTitle>
            </XyphxCardHeader>
            <XyphxCardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Role Title</p>
                  <p className="text-sm font-medium text-xyphx-text">{internDetails?.role_title || '--'}</p>
                </div>
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Department</p>
                  <p className="text-sm font-medium text-xyphx-text">{internDetails?.department || '--'}</p>
                </div>
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Mentor</p>
                  <p className="text-sm font-medium text-xyphx-text">{internDetails?.mentor || '--'}</p>
                </div>
                <div>
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Duration / Timeline</p>
                  <p className="text-sm font-medium text-xyphx-text">
                    {internDetails?.start_date && internDetails?.end_date ? (
                      `${new Date(internDetails.start_date).toLocaleDateString()} to ${new Date(internDetails.end_date).toLocaleDateString()}`
                    ) : (
                      '--'
                    )}
                  </p>
                </div>
              </div>
            </XyphxCardContent>
          </XyphxCard>
        </div>
      )}
    </div>
  )
}
