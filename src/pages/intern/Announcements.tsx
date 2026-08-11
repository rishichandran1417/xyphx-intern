import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { XyphxCard, XyphxCardContent } from '@/components/xyphx/XyphxCard'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<any[]>([])

  useEffect(() => {
    supabase.from('intern_announcements').select('*')
      .then(({ data, error }) => {
        if (!error && data) setAnnouncements(data)
      })
  }, [])

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Announcements
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Announcements
        </h1>
        <p className="text-base text-xyphx-muted mt-2">Latest news and updates from your program administrators.</p>
      </div>

      <div className="grid gap-6">
        {announcements.length === 0 ? (
          <XyphxCard className="bg-transparent border-dashed">
            <XyphxCardContent className="pt-6 pb-6 text-center text-sm text-xyphx-muted">
              No announcements available.
            </XyphxCardContent>
          </XyphxCard>
        ) : (
          announcements.map(announcement => (
            <XyphxCard key={announcement.id} className="hover:-translate-y-1 transition-transform">
              <XyphxCardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-xl text-xyphx-text xyphx-heading">{announcement.title}</h3>
                  <div className="text-xs text-xyphx-muted xyphx-mono text-right">
                    <p>{new Date(announcement.created_at).toLocaleDateString()}</p>
                    <p className="text-xyphx-purple mt-1 uppercase">{announcement.author || 'ADMIN'}</p>
                  </div>
                </div>
                <div className="text-sm text-xyphx-text leading-relaxed whitespace-pre-wrap">
                  {announcement.content}
                </div>
              </XyphxCardContent>
            </XyphxCard>
          ))
        )}
      </div>
    </div>
  )
}
