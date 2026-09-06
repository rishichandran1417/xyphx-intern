import { useEffect, useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { XyphxCard, XyphxCardContent, XyphxCardHeader, XyphxCardTitle } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useAppNavigate()
  const [internDetails, setInternDetails] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setLoading(true)

      // Fetch canonical intern record from intern_records (or fallback to interns)
      supabase
        .from('intern_records')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setInternDetails(data)
          } else {
            supabase
              .from('interns')
              .select('*')
              .eq('profile_id', user.id)
              .maybeSingle()
              .then(({ data: fallbackData }) => {
                setInternDetails(fallbackData || null)
              })
          }
        })

      // Fetch tasks assigned strictly to this authenticated intern
      supabase
        .from('intern_tasks')
        .select('*')
        .eq('intern_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Dashboard tasks fetch error:", error)
          }
          setTasks(data || [])
        })

      // Fetch projects assigned strictly to this authenticated intern
      supabase
        .from('intern_projects')
        .select('*')
        .eq('intern_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error("Dashboard projects fetch error:", error)
          }
          setProjects(data || [])
          setLoading(false)
        })
    }
  }, [user, profile])

  const handleTaskClick = (task: any) => {
    navigate('/updates', { state: { selectedTitle: `Task: ${task.title}` } })
  }

  const handleMarkCompleted = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const { error } = await supabase.from('intern_tasks').update({
      status: 'completed',
      progress: 100,
      updated_at: new Date().toISOString()
    }).eq('id', taskId)

    if (error) {
      console.error("Error marking task complete:", error)
      alert("Failed to mark task as completed: " + error.message)
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
    }
  }

  const isCompleted = (status?: string) => status?.trim().toLowerCase() === 'completed'

  const completedTasks = tasks.filter(t => isCompleted(t.status)).length
  const totalTasks = tasks.length
  const remainingTasks = totalTasks - completedTasks
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const calculateDaysRemaining = () => {
    if (!internDetails?.end_date) return null
    const end = new Date(internDetails.end_date)
    const today = new Date()
    end.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diffTime = end.getTime() - today.getTime()
    if (diffTime < 0) return 0
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusVariant = (status: string) => {
    switch (status?.trim().toLowerCase()) {
      case 'completed': return 'success'
      case 'overdue': return 'danger'
      case 'in_progress': return 'info'
      case 'review': return 'warning'
      case 'todo': return 'outline'
      default: return 'outline'
    }
  }

  const getCurrentProject = () => {
    if (!projects.length) return null
    for (const p of projects) {
      const pTasks = tasks.filter(t => t.project_id === p.id)
      const completed = pTasks.filter(t => isCompleted(t.status)).length
      if (pTasks.length === 0 || completed < pTasks.length) {
        return { project: p, tasks: pTasks, completed }
      }
    }
    const lastP = projects[projects.length - 1]
    const pTasks = tasks.filter(t => t.project_id === lastP.id)
    return { project: lastP, tasks: pTasks, completed: pTasks.filter(t => isCompleted(t.status)).length }
  }

  const currentProjectData = getCurrentProject()
  const daysLeft = calculateDaysRemaining()

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible">

      {/* Dashboard Hero */}
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Dashboard
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Good morning, {internDetails?.profiles?.first_name || profile?.first_name || 'Intern'}
        </h1>
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-xyphx-text bg-white/50 px-4 py-2 rounded-lg border border-xyphx-border">
            <span className="xyphx-mono text-xs text-xyphx-muted uppercase">Role</span>
            <span className="font-medium">{internDetails?.role_title || (loading ? 'Loading...' : 'Not assigned')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-xyphx-text bg-white/50 px-4 py-2 rounded-lg border border-xyphx-border">
            <span className="xyphx-mono text-xs text-xyphx-muted uppercase">Dept</span>
            <span className="font-medium">{internDetails?.department || (loading ? 'Loading...' : 'Not assigned')}</span>
          </div>


        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Overall Progress Card */}
        <XyphxCard className="lg:col-span-2 relative overflow-hidden">
          <XyphxCardHeader className="pb-4">
            <XyphxCardTitle className="text-sm font-semibold tracking-[0.08em] uppercase xyphx-mono text-xyphx-text">Overall Progress</XyphxCardTitle>
          </XyphxCardHeader>
          <XyphxCardContent className="pt-2">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="text-6xl font-bold text-xyphx-purple xyphx-heading">{progressPercent}%</div>
              <div className="flex-1 w-full pb-2">
                <div className="h-2 w-full bg-xyphx-purple/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-xyphx-purple rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs xyphx-mono text-xyphx-muted">
                  <span>{completedTasks} TASKS COMPLETED</span>
                  <span>{remainingTasks} REMAINING</span>
                </div>
              </div>
            </div>
          </XyphxCardContent>
        </XyphxCard>

        {/* Timeline Card */}
        <XyphxCard>
          <XyphxCardHeader className="pb-4">
            <XyphxCardTitle className="text-sm font-semibold tracking-[0.08em] uppercase xyphx-mono text-xyphx-text">Timeline</XyphxCardTitle>
          </XyphxCardHeader>
          <XyphxCardContent className="pt-2 space-y-3">
            <div className="text-5xl font-bold text-xyphx-text xyphx-heading">
              {daysLeft !== null ? daysLeft : (loading ? '...' : 'Not set')}
            </div>
            <p className="text-sm text-xyphx-muted">Days remaining in internship</p>
            {internDetails?.start_date && internDetails?.end_date && (
              <div className="pt-3 border-t border-xyphx-border text-xs xyphx-mono text-xyphx-muted flex justify-between">
                <span>{internDetails.start_date}</span>
                <span>TO</span>
                <span>{internDetails.end_date}</span>
              </div>
            )}
          </XyphxCardContent>
        </XyphxCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-xyphx-text xyphx-heading border-b border-xyphx-border pb-2">Upcoming Tasks</h2>

          {tasks.filter(t => !isCompleted(t.status)).length === 0 ? (
            <XyphxCard className="bg-transparent border-dashed">
              <XyphxCardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[160px]">
                <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">No Ongoing Tasks</p>
                <p className="text-sm text-xyphx-text font-medium">You're all caught up for now.</p>
              </XyphxCardContent>
            </XyphxCard>
          ) : (
            <div className="space-y-3">
              {tasks.filter(t => !isCompleted(t.status)).slice(0, 4).map(task => (
                <XyphxCard key={task.id} className="hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => handleTaskClick(task)}>
                  <XyphxCardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-xyphx-text line-clamp-1">{task.title}</p>
                      <XyphxBadge variant={getStatusVariant(task.status)}>
                        {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
                      </XyphxBadge>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs xyphx-mono text-xyphx-muted">
                        <span>DUE: {task.due_date || task.deadline ? new Date(task.due_date || task.deadline).toLocaleDateString() : 'NO DATE'}</span>
                      </div>
                      <button
                        onClick={(e) => handleMarkCompleted(e, task.id)}
                        className="text-xs font-semibold bg-xyphx-purple text-white px-3 py-1.5 rounded-lg hover:bg-xyphx-purple/90 transition-colors whitespace-nowrap"
                      >
                        Mark Complete
                      </button>
                    </div>
                  </XyphxCardContent>
                </XyphxCard>
              ))}
            </div>
          )}
        </div>

        {/* Current Project */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-xyphx-text xyphx-heading border-b border-xyphx-border pb-2">Current Project</h2>
          <XyphxCard>
            <XyphxCardContent className="pt-6">
              {!currentProjectData ? (
                <div className="flex flex-col items-center justify-center text-center min-h-[136px]">
                  <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">No Projects</p>
                  <p className="text-sm text-xyphx-text font-medium">Your assigned projects will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="xyphx-mono text-xs tracking-widest text-xyphx-muted uppercase mb-1 block">
                        Project
                      </span>
                      <h3 className="font-bold text-xl text-xyphx-text xyphx-heading">
                        {currentProjectData.project.name}
                      </h3>
                    </div>
                    <XyphxBadge variant={currentProjectData.completed === currentProjectData.tasks.length && currentProjectData.tasks.length > 0 ? 'success' : 'outline'}>
                      {currentProjectData.completed === currentProjectData.tasks.length && currentProjectData.tasks.length > 0 ? 'COMPLETED' : 'IN PROGRESS'}
                    </XyphxBadge>
                  </div>

                  <div className="w-full bg-xyphx-border rounded-full h-1.5 mb-2 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-xyphx-purple transition-all duration-1000 ease-out"
                      style={{ width: `${currentProjectData.tasks.length > 0 ? (currentProjectData.completed / currentProjectData.tasks.length) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs xyphx-mono text-xyphx-muted">
                    <span>{currentProjectData.completed} TASKS DONE</span>
                    <span>{currentProjectData.tasks.length} TOTAL</span>
                  </div>

                  {currentProjectData.tasks.filter(t => !isCompleted(t.status)).length > 0 && (
                    <div className="pt-4 mt-2 border-t border-xyphx-border">
                      <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">Next Task</p>
                      <p className="font-semibold text-sm text-xyphx-text">
                        {currentProjectData.tasks.filter(t => !isCompleted(t.status))[0].title}
                      </p>
                      {(currentProjectData.tasks.filter(t => !isCompleted(t.status))[0].due_date || currentProjectData.tasks.filter(t => !isCompleted(t.status))[0].deadline) && (
                        <p className="text-xs text-xyphx-muted mt-1">
                          Due: {new Date(currentProjectData.tasks.filter(t => !isCompleted(t.status))[0].due_date || currentProjectData.tasks.filter(t => !isCompleted(t.status))[0].deadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </XyphxCardContent>
          </XyphxCard>
        </div>
      </div>
    </div>
  )
}
