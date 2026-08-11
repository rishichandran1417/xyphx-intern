import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { XyphxCard, XyphxCardContent, XyphxCardHeader, XyphxCardTitle } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [internDetails, setInternDetails] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      supabase.from('intern_profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setInternDetails(data)
        })
      
      supabase.from('intern_tasks').select('*').eq('intern_id', user.id)
        .then(({ data }) => setTasks(data || []))
        
      supabase.from('intern_projects').select('*').eq('intern_id', user.id)
        .then(({ data }) => setProjects(data || []))
    }
  }, [user])

  const handleTaskClick = (task: any) => {
    navigate('/updates', { state: { selectedTitle: `Task: ${task.title}` } })
  }

  const handleMarkCompleted = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    const { data, error } = await supabase.from('intern_tasks').update({ 
      status: 'completed',
      progress: 100,
      updated_at: new Date().toISOString()
    }).eq('id', taskId).select()
    
    if (error || !data || data.length === 0) {
      alert("Failed to mark task as completed. Your database permissions might be restricting this.")
    } else {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
    }
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  
  const calculateDaysRemaining = () => {
    if (!internDetails?.end_date) return '--'
    const end = new Date(internDetails.end_date)
    const today = new Date()
    const diffTime = Math.abs(end.getTime() - today.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusVariant = (status: string) => {
    switch(status?.toLowerCase()) {
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
      const completed = pTasks.filter(t => t.status === 'completed').length
      if (pTasks.length === 0 || completed < pTasks.length) {
        return { project: p, tasks: pTasks, completed }
      }
    }
    const lastP = projects[projects.length - 1]
    const pTasks = tasks.filter(t => t.project_id === lastP.id)
    return { project: lastP, tasks: pTasks, completed: pTasks.filter(t => t.status === 'completed').length }
  }

  const currentProjectData = getCurrentProject()

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible">
      
      {/* Dashboard Hero */}
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Dashboard
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          Good morning, {profile?.first_name || 'Intern'}
        </h1>
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex items-center gap-2 text-sm text-xyphx-text bg-white/50 px-4 py-2 rounded-lg border border-xyphx-border">
            <span className="xyphx-mono text-xs text-xyphx-muted uppercase">Role</span>
            <span className="font-medium">{internDetails?.role || '--'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-xyphx-text bg-white/50 px-4 py-2 rounded-lg border border-xyphx-border">
            <span className="xyphx-mono text-xs text-xyphx-muted uppercase">Dept</span>
            <span className="font-medium">{internDetails?.department || '--'}</span>
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
                  <span>{tasks.length - completedTasks} REMAINING</span>
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
          <XyphxCardContent className="pt-2">
            <div className="text-5xl font-bold text-xyphx-text xyphx-heading">{calculateDaysRemaining()}</div>
            <p className="text-sm text-xyphx-muted mt-2">Days remaining in internship</p>
          </XyphxCardContent>
        </XyphxCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-xyphx-text xyphx-heading border-b border-xyphx-border pb-2">Upcoming Tasks</h2>
          
          {tasks.filter(t => t.status !== 'completed').length === 0 ? (
            <XyphxCard className="bg-transparent border-dashed">
              <XyphxCardContent className="pt-6 flex flex-col items-center justify-center text-center min-h-[160px]">
                <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">No Tasks Assigned</p>
                <p className="text-sm text-xyphx-text font-medium">You're all caught up for now.</p>
              </XyphxCardContent>
            </XyphxCard>
          ) : (
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => (
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
                        <span>DUE: {task.deadline || task.due_date ? new Date(task.deadline || task.due_date).toLocaleDateString() : 'NO DATE'}</span>
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
                  
                  {currentProjectData.tasks.filter(t => t.status !== 'completed').length > 0 && (
                    <div className="pt-4 mt-2 border-t border-xyphx-border">
                      <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">Next Task</p>
                      <p className="font-semibold text-sm text-xyphx-text">
                        {currentProjectData.tasks.filter(t => t.status !== 'completed')[0].title}
                      </p>
                      {currentProjectData.tasks.filter(t => t.status !== 'completed')[0].due_date && (
                        <p className="text-xs text-xyphx-muted mt-1">
                          Due: {new Date(currentProjectData.tasks.filter(t => t.status !== 'completed')[0].due_date).toLocaleDateString()}
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
