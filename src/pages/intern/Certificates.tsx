import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'
import { XyphxButton } from '@/components/xyphx/XyphxButton'

export default function Certificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      supabase.from('intern_certificates').select('*').eq('intern_id', user.id)
        .then(({ data, error }) => {
          if (!error && data) setCertificates(data)
        })
    }
  }, [user])

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Certificates
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Certificates
        </h1>
        <p className="text-base text-xyphx-muted mt-2">View and download your earned certificates.</p>
      </div>

      <div className="grid gap-4">
        {certificates.length === 0 ? (
          <XyphxCard className="bg-transparent border-dashed">
            <XyphxCardContent className="pt-6 pb-6 text-center text-sm text-xyphx-muted">
              No certificates available yet.
            </XyphxCardContent>
          </XyphxCard>
        ) : (
          certificates.map(cert => (
            <XyphxCard key={cert.id} className="hover:-translate-y-1 transition-transform">
              <XyphxCardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-lg text-xyphx-text">{cert.title}</h3>
                  <p className="text-sm text-xyphx-muted xyphx-mono">
                    ISSUED: {new Date(cert.issued_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 pt-2 md:pt-0">
                  <XyphxBadge variant="success">
                    {cert.status?.toUpperCase() || 'VALID'}
                  </XyphxBadge>
                  <XyphxButton variant="default" size="sm">
                    Download
                  </XyphxButton>
                </div>
              </XyphxCardContent>
            </XyphxCard>
          ))
        )}
      </div>
    </div>
  )
}
