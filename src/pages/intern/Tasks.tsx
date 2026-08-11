import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { XyphxCard, XyphxCardContent } from '@/components/xyphx/XyphxCard'
import { XyphxBadge } from '@/components/xyphx/XyphxBadge'

export default function Tasks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      supabase.from('intern_projects').select('*').eq('intern_id', user.id)
        .then(({ data }) => setProjects(data || []))
      
      supabase.from('intern_tasks').select('*').eq('intern_id', user.id)
        .then(({ data }) => setTasks(data || []))
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
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'completed', progress: 100 } : t))
    }
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

  const getPriorityVariant = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return 'danger'
      case 'medium': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-12 pb-12 xyphx-reveal is-visible max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="space-y-3 border-b border-xyphx-border pb-8">
        <p className="text-xs tracking-[0.08em] xyphx-mono text-xyphx-muted uppercase">
          Intern Portal / Tasks
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-xyphx-text xyphx-heading">
          My Projects
        </h1>
        <p className="text-base text-xyphx-muted mt-2">Manage your internship projects and tasks.</p>
      </div>

      <div className="space-y-12">
        {projects.length === 0 ? (
          <XyphxCard className="bg-transparent border-dashed">
            <XyphxCardContent className="flex flex-col items-center justify-center h-48 text-center pt-6">
              <p className="text-xs xyphx-mono text-xyphx-muted uppercase tracking-widest mb-2">NO PROJECTS ASSIGNED</p>
              <p className="text-sm text-xyphx-text font-medium">Your supervisor will assign your projects soon.</p>
            </XyphxCardContent>
          </XyphxCard>
        ) : (
          projects.map((project) => {
            const projectTasks = tasks.filter(t => t.project_id === project.id)
            const completedCount = projectTasks.filter(t => t.status === 'completed').length
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
                       No tasks in this project.
                     </XyphxCardContent>
                  </XyphxCard>
                ) : (
                  <div className="grid gap-4">
                    {projectTasks.map(task => (
                      <XyphxCard key={task.id} className="hover:-translate-y-1 transition-transform cursor-pointer" onClick={() => handleTaskClick(task)}>
                        <XyphxCardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                              <h3 className={`font-semibold text-lg ${task.status === 'completed' ? 'text-xyphx-muted line-through' : 'text-xyphx-text'}`}>
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
                              {task.deadline || task.due_date ? new Date(task.deadline || task.due_date).toLocaleDateString() : 'NO DATE'}
                            </div>
                            {task.status !== 'completed' && (
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
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
