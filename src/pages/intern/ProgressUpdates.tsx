import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent, XyphxCardHeader, XyphxCardTitle } from '@/components/xyphx/XyphxCard'
import { XyphxButton } from '@/components/xyphx/XyphxButton'
import { Label } from '@/components/ui/label'

export default function ProgressUpdates() {
  const { user } = useAuth()
  const location = useLocation()
  const [updates, setUpdates] = useState<any[]>([])
  
  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    if (location.state?.selectedTitle) {
      setTitle(location.state.selectedTitle)
    }
  }, [location.state])

  useEffect(() => {
    if (user?.id) {
      fetchUpdates()
      // Fetch tasks and projects for the title dropdown
      supabase.from('intern_tasks').select('title').eq('intern_id', user.id).then(({ data }) => setTasks(data || []))
      supabase.from('intern_projects').select('name').eq('intern_id', user.id).then(({ data }) => setProjects(data || []))
    }
  }, [user])

  const fetchUpdates = async () => {
    const { data } = await supabase.from('intern_progress_updates').select('*').eq('intern_id', user!.id)
    if (data) setUpdates(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    
    const finalContent = `[${title}] [${new Date().toISOString()}]\n\n${content}`

    await supabase.from('intern_progress_updates').insert([{
      intern_id: user.id,
      content: finalContent
    }])
    
    setTitle('')
    setContent('')
    setSubmitting(false)
    fetchUpdates()
  }

  // Combine tasks and projects for dropdown options
  const titleOptions = [
    ...tasks.map(t => `Task: ${t.title}`),
    ...projects.map(p => `Project: ${p.name}`)
  ]

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Progress
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Progress Updates
        </h1>
        <p className="text-base text-xyphx-muted mt-2">Submit regular updates to your mentor.</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-semibold text-xyphx-text xyphx-heading">New Update</h2>
          <XyphxCard>
            <XyphxCardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xyphx-text font-medium ml-1">Related Task or Project</Label>
                  <select
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-xyphx-border bg-white/75 px-4 py-2 text-sm text-xyphx-text transition-colors placeholder:text-xyphx-muted focus-visible:outline-none focus-visible:border-xyphx-purple focus-visible:ring-4 focus-visible:ring-xyphx-purple/10"
                    required
                  >
                    <option value="" disabled>Select a related item...</option>
                    <option value="General Update">General Update</option>
                    {titleOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-xyphx-text font-medium ml-1">Update Details</Label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Describe your progress, any blockers you are facing, and your planned next steps..."
                    className="flex min-h-[160px] w-full rounded-xl border border-xyphx-border bg-white/75 px-4 py-2 text-sm text-xyphx-text transition-colors placeholder:text-xyphx-muted focus-visible:outline-none focus-visible:border-xyphx-purple focus-visible:ring-4 focus-visible:ring-xyphx-purple/10 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  />
                </div>
                <div className="pt-2">
                  <XyphxButton type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Submitting...' : 'Submit Progress'}
                  </XyphxButton>
                </div>
              </form>
            </XyphxCardContent>
          </XyphxCard>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-xl font-semibold text-xyphx-text xyphx-heading">Previous Updates</h2>
          <div className="space-y-4">
            {updates.length === 0 ? (
              <XyphxCard className="bg-transparent border-dashed">
                <XyphxCardContent className="pt-6 pb-6 text-center text-sm text-xyphx-muted">
                  No previous updates.
                </XyphxCardContent>
              </XyphxCard>
            ) : (
              updates.map(update => {
                const match = update.content?.match(/^\[(.*?)\](?: \[(.*?)\])?\n\n([\s\S]*)$/)
                const parsedTitle = match?.[1] || update.title || 'General Update'
                const parsedDateStr = match?.[2]
                const parsedContent = match?.[3] || update.content?.replace(/^\[.*?\]\n\n/, '') || update.description || ''
                const displayDate = parsedDateStr 
                  ? new Date(parsedDateStr).toLocaleDateString()
                  : (update.created_at || update.timestamp ? new Date(update.created_at || update.timestamp).toLocaleDateString() : 'NO DATE')
                  
                return (
                  <XyphxCard key={update.id}>
                    <XyphxCardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <XyphxCardTitle className="text-lg">{parsedTitle}</XyphxCardTitle>
                        <span className="text-xs text-xyphx-muted xyphx-mono">
                          {displayDate}
                        </span>
                      </div>
                    </XyphxCardHeader>
                    <XyphxCardContent className="space-y-4 text-sm text-xyphx-text">
                      <div>
                        <p className="font-semibold text-xs xyphx-mono text-xyphx-muted uppercase mb-1">Details</p>
                        <p className="whitespace-pre-wrap">{parsedContent}</p>
                      </div>
                    </XyphxCardContent>
                  </XyphxCard>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
