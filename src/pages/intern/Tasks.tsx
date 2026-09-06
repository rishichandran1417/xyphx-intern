import { useEffect, useState } from 'react'
import { useAppNavigate } from '@/hooks/useAppNavigate'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'

export default function Tasks() {
  const { user } = useAuth()
  const navigate = useAppNavigate()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      setLoading(true)
      Promise.all([
        supabase.from('intern_projects').select('*').eq('intern_id', user.id),
        supabase.from('intern_tasks').select('*').eq('intern_id', user.id)
      ]).then(([{ data: pData, error: pErr }, { data: tData, error: tErr }]) => {
        if (pErr) console.error("Error loading intern_projects:", pErr)
        if (tErr) console.error("Error loading intern_tasks:", tErr)
        setProjects(pData || [])
        setTasks(tData || [])
        setLoading(false)
      })
    }
  }, [user])

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

  const getStatusVariant = (status: string) => {
    switch(status?.trim().toLowerCase()) {
      case 'completed': return 'success'
      case 'overdue': return 'danger'
      case 'in_progress': return 'info'
      case 'review': return 'warning'
      case 'todo': return 'outline'
      default: return 'outline'
    }
  }

  const getPriorityVariant = (priority: string) => {
    switch(priority?.trim().toLowerCase()) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      default: return 'secondary'
    }
  }

  const projectIds = new Set(projects.map(p => p.id))
  const standaloneTasks = tasks.filter(t => !t.project_id || !projectIds.has(t.project_id))

  const renderTaskCard = (task: any) => (
    <XyphxCard key={task.id} className="hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => handleTaskClick(task)}>
      <XyphxCardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <h3 className={`font-semibold text-lg ${isCompleted(task.status) ? 'text-xyphx-muted line-through' : 'text-xyphx-text'}`}>
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="text-sm text-xyphx-muted line-clamp-2 md:line-clamp-1 max-w-2xl">
              {task.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-4 pt-2 md:pt-0">
          <XyphxBadge variant={getPriorityVariant(task.priority)}>
            {task.priority?.toUpperCase() || 'NORMAL'}
          </XyphxBadge>
          <XyphxBadge variant={getStatusVariant(task.status)}>
            {task.status?.replace('_', ' ').toUpperCase() || 'TODO'}
          </XyphxBadge>
          <div className="text-xs xyphx-mono text-xyphx-muted bg-xyphx-bg px-3 py-1.5 rounded-lg border border-xyphx-border whitespace-nowrap min-w-[120px] text-center">
            {task.due_date || task.deadline ? new Date(task.due_date || task.deadline).toLocaleDateString() : 'NO DATE'}
          </div>
          {!isCompleted(task.status) && (
            <button 
              onClick={(e) => handleMarkCompleted(e, task.id)}
              className="text-xs font-semibold bg-xyphx-purple text-white px-3 py-1.5 rounded-lg hover:bg-xyphx-purple/90 transition-colors whitespace-nowrap"
            >
              Mark Complete
            </button>
          )}
        </div>
      </XyphxCardContent>
    </XyphxCard>
  )

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Tasks
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          My Projects & Tasks
        </h1>
        <p className="text-base text-xyphx-muted mt-2">Manage your internship projects and ongoing tasks.</p>
      </div>

      <div className="space-y-12">
        {loading ? (
          <div className="text-center py-12 text-xyphx-muted xyphx-mono text-sm">Loading tasks...</div>
        ) : projects.length === 0 && tasks.length === 0 ? (
          <XyphxCard className="bg-transparent border-dashed">
            <XyphxCardContent className="flex flex-col items-center justify-center h-48 text-center pt-6">
              <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">NO TASKS ASSIGNED</p>
              <p className="text-sm text-xyphx-text font-medium">Your supervisor will assign your projects and tasks soon.</p>
            </XyphxCardContent>
          </XyphxCard>
        ) : (
          <>
            {/* Projects List */}
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.project_id === project.id)
              const completedCount = projectTasks.filter(t => isCompleted(t.status)).length
              const progress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0
              
              return (
                <div key={project.id} className="space-y-6">
                  <div className="border-b border-xyphx-border pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-2xl font-semibold text-xyphx-text xyphx-heading flex items-center gap-3">
                        {project.name}
                      </h2>
                      <span className="xyphx-mono text-xs text-xyphx-muted uppercase tracking-widest">
                        {completedCount} / {projectTasks.length} TASKS COMPLETED
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-xyphx-border rounded-full overflow-hidden">
                        <div className="h-full bg-xyphx-purple transition-all duration-500" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="xyphx-mono text-xs font-semibold">{progress}%</span>
                    </div>
                  </div>
                  
                  {projectTasks.length === 0 ? (
                    <XyphxCard className="bg-transparent border-dashed">
                       <XyphxCardContent className="pt-6 pb-6 text-center text-sm text-xyphx-muted">
                         No tasks in this project yet.
                       </XyphxCardContent>
                    </XyphxCard>
                  ) : (
                    <div className="grid gap-4">
                      {projectTasks.map(renderTaskCard)}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Standalone Tasks */}
            {standaloneTasks.length > 0 && (
              <div className="space-y-6">
                <div className="border-b border-xyphx-border pb-4">
                  <h2 className="text-2xl font-semibold text-xyphx-text xyphx-heading">
                    {projects.length > 0 ? 'General / Individual Tasks' : 'Assigned Tasks'}
                  </h2>
                </div>
                <div className="grid gap-4">
                  {standaloneTasks.map(renderTaskCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
