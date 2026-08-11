import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'
import { XyphxButton } from '@/components/xyphx/XyphxButton'

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      supabase.from('intern_documents').select('*').eq('intern_id', user.id)
        .then(({ data, error }) => {
          if (!error && data) setDocuments(data)
        })
    }
  }, [user])

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Documents
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Documents
        </h1>
        <p className="text-base text-xyphx-muted mt-2">Access your internship materials and uploads.</p>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <XyphxCard className="bg-transparent border-dashed">
            <XyphxCardContent className="pt-6 pb-6 text-center text-sm text-xyphx-muted">
              No documents available.
            </XyphxCardContent>
          </XyphxCard>
        ) : (
          documents.map(doc => (
            <XyphxCard key={doc.id} className="hover:-translate-y-1 transition-transform">
              <XyphxCardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-lg text-xyphx-text">{doc.title}</h3>
                  <p className="text-sm text-xyphx-muted xyphx-mono">
                    UPLOADED: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 pt-2 md:pt-0">
                  <XyphxBadge variant="outline">{doc.type || 'DOCUMENT'}</XyphxBadge>
                  <XyphxBadge variant={doc.status === 'signed' ? 'success' : 'info'}>
                    {doc.status?.toUpperCase() || 'AVAILABLE'}
                  </XyphxBadge>
                  <XyphxButton variant="secondary" size="sm">
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
