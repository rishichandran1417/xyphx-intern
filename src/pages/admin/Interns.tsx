import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Search, ChevronLeft, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/contexts/AuthContext'

export default function AdminInterns() {
  const [interns, setInterns] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<{username: string, tempPassword: string} | null>(null)
  
  // State for Managing an Intern's Projects
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<any | null>(null)

  // Create Project State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', start_date: '', due_date: '' })

  // Create Task State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' })
  
  // Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    department: '',
    mentor: '',
    start_date: '',
    end_date: ''
  })

  // Edit Intern State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingIntern, setEditingIntern] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    department: '',
    role_title: '',
    mentor: '',
    start_date: '',
    end_date: ''
  })
  const { session } = useAuth()

  useEffect(() => {
    fetchInterns()
  }, [])

  const getInternId = (intern: any) => intern?.profile_id || intern?.id || intern?.profiles?.id

  const openEditModal = (intern: any) => {
    setEditingIntern(intern)
    setEditFormData({
      first_name: intern.profiles?.first_name || '',
      last_name: intern.profiles?.last_name || '',
      department: intern.department || '',
      role_title: intern.role_title || '',
      mentor: intern.mentor || '',
      start_date: intern.start_date || '',
      end_date: intern.end_date || ''
    })
    setIsEditModalOpen(true)
  }

  const handleUpdateIntern = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIntern) return
    const targetId = getInternId(editingIntern)
    if (!targetId) {
      alert("Error: Could not identify intern account ID.")
      return
    }
    setLoading(true)

    try {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetId)

      if (profileErr) throw profileErr

      const payload = [{
        profile_id: targetId,
        department: editFormData.department,
        role_title: editFormData.role_title,
        mentor: editFormData.mentor || null,
        start_date: editFormData.start_date,
        end_date: editFormData.end_date,
        status: editingIntern.status || 'active'
      }]

      const { error: recErr } = await supabase
        .from('intern_records')
        .upsert(payload)

      if (recErr) {
        const { error: internErr } = await supabase.from('interns').upsert(payload)
        if (internErr) throw internErr
      }

      setIsEditModalOpen(false)
      setEditingIntern(null)
      fetchInterns()
    } catch (err: any) {
      alert("Failed to update intern details: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchInterns = async () => {
    let { data: internRows } = await supabase.from('intern_records')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          username
        )
      `)

    if (!internRows) {
      const fallback = await supabase.from('interns')
        .select(`
          *,
          profiles (
            first_name,
            last_name,
            username
          )
        `)
      internRows = fallback.data
    }

    const { data: allProfiles } = await supabase.from('profiles')
      .select('*')
      .eq('role', 'intern')

    if (allProfiles && allProfiles.length > 0) {
      const existingProfileIds = new Set((internRows || []).map(i => getInternId(i)))
      const missingProfiles = allProfiles.filter(p => !existingProfileIds.has(p.id))
      
      const syntheticInterns = missingProfiles.map(p => ({
        profile_id: p.id,
        department: '--',
        role_title: '--',
        mentor: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        status: 'active',
        profiles: {
          first_name: p.first_name,
          last_name: p.last_name,
          username: p.username
        }
      }))
      
      setInterns([...(internRows || []), ...syntheticInterns])
      return
    }

    setInterns(internRows || [])
  }

  const loadInternProjects = async (internId: string) => {
    const [{ data: pData }, { data: tData }] = await Promise.all([
      supabase.from('intern_projects').select('*').eq('intern_id', internId).order('created_at', { ascending: false }),
      supabase.from('intern_tasks').select('*').eq('intern_id', internId).order('created_at', { ascending: true })
    ])
    setProjects(pData || [])
    setTasks(tData || [])
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-intern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'create_intern',
          internData: formData
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) throw new Error(result.error || "Failed to create intern")
      
      setCredentials({ username: result.username, tempPassword: result.tempPassword })
      fetchInterns()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setIsOpen(false)
    setCredentials(null)
    setFormData({
      first_name: '', last_name: '', username: '', department: '', mentor: '', start_date: '', end_date: ''
    })
  }

  const handleResetPassword = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-intern`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          action: 'reset_password',
          targetUserId: userId
        })
      })
      
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Failed to reset password")
      
      setCredentials({ username: result.username, tempPassword: result.tempPassword })
      setIsOpen(true)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = getInternId(selectedIntern)
    if (!targetId) return
    
    const { error } = await supabase.from('intern_projects').insert([{
      intern_id: targetId,
      ...newProject
    }])
    if (error) {
      alert("Failed to create project: " + error.message)
      return
    }
    setIsProjectModalOpen(false)
    setNewProject({ name: '', description: '', start_date: '', due_date: '' })
    loadInternProjects(targetId)
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetId = getInternId(selectedIntern)
    if (!targetId || !selectedProject) return
    
    const { error } = await supabase.from('intern_tasks').insert([{
      intern_id: targetId,
      project_id: selectedProject.id,
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.due_date || null,
      deadline: newTask.due_date || null,
      status: 'todo',
      progress: 0
    }])
    if (error) {
      alert("Failed to create task: " + error.message)
      return
    }
    setIsTaskModalOpen(false)
    setNewTask({ title: '', description: '', due_date: '' })
    loadInternProjects(targetId)
  }

  const handleToggleTaskStatus = async (task: any) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed'
    const newProgress = newStatus === 'completed' ? 100 : 0
    
    const { error } = await supabase.from('intern_tasks').update({
      status: newStatus,
      progress: newProgress,
      updated_at: new Date().toISOString()
    }).eq('id', task.id)

    if (error) {
      alert("Failed to update task status: " + error.message)
      return
    }

    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus, progress: newProgress } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return
    const { error } = await supabase.from('intern_tasks').delete().eq('id', taskId)
    if (error) {
      alert("Failed to delete task: " + error.message)
      return
    }
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project and all its tasks?")) return
    const { error } = await supabase.from('intern_projects').delete().eq('id', projectId)
    if (error) {
      alert("Failed to delete project: " + error.message)
      return
    }
    if (selectedProject?.id === projectId) setSelectedProject(null)
    loadInternProjects(selectedIntern.profile_id)
  }

  if (selectedIntern) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => { setSelectedIntern(null); setSelectedProject(null) }}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Interns
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {selectedIntern.profiles?.first_name} {selectedIntern.profiles?.last_name}
            </h1>
            <p className="text-slate-500 mt-1">Manage Projects & Tasks</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Projects Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Projects</h2>
              <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Project</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Project Name</Label>
                      <Input required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={newProject.start_date} onChange={e => setNewProject({...newProject, start_date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={newProject.due_date} onChange={e => setNewProject({...newProject, due_date: e.target.value})} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">Create Project</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {projects.length === 0 ? (
              <Card className="p-6 text-center text-slate-500">No projects created yet.</Card>
            ) : (
              projects.map(project => {
                const projectTasks = tasks.filter(t => t.project_id === project.id)
                const completedTasks = projectTasks.filter(t => t.status === 'completed').length
                const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
                const isSelected = selectedProject?.id === project.id

                return (
                  <Card 
                    key={project.id} 
                    className={`p-4 cursor-pointer transition-colors relative group ${isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'hover:border-slate-400'}`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold truncate pr-6">{project.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 uppercase">
                          {completedTasks === projectTasks.length && projectTasks.length > 0 ? 'Completed' : project.status}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                          title="Delete Project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500 mb-3">
                      {completedTasks} / {projectTasks.length} tasks
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs font-mono">{progress}%</span>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Tasks Column */}
          <div className="md:col-span-2 space-y-4">
            {!selectedProject ? (
              <Card className="p-12 flex flex-col items-center justify-center text-slate-500 h-full border-dashed">
                Select a project to view and manage its tasks
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedProject.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">{selectedProject.description}</p>
                  </div>
                  <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="h-4 w-4 mr-2"/> Add Task</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Task to Project</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateTask} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Task Title</Label>
                          <Input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
                        </div>
                        <Button type="submit" className="w-full">Create Task</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-3 pt-2">
                  {tasks.filter(t => t.project_id === selectedProject.id).length === 0 ? (
                    <div className="text-center py-8 text-slate-500">No tasks in this project yet.</div>
                  ) : (
                    tasks.filter(t => t.project_id === selectedProject.id).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm hover:border-slate-300">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task)}
                            className="mt-0.5 focus:outline-none"
                            title={task.status === 'completed' ? "Mark incomplete" : "Mark completed"}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-600 transition-colors" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-300 hover:text-slate-500 transition-colors" />
                            )}
                          </button>
                          <div>
                            <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {task.title}
                            </h4>
                            {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                            {(task.due_date || task.deadline) && (
                              <p className="text-xs text-slate-400 mt-2 font-mono">
                                Due: {new Date(task.due_date || task.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Intern Management</h1>
          <p className="text-slate-500 mt-2">Manage intern accounts, assign roles, and track progress.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" /> Add Intern
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Intern</DialogTitle>
              <DialogDescription>
                Create a new intern account. A temporary password will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            
            {credentials ? (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 p-4 border border-amber-200 rounded-md">
                  <h4 className="font-semibold text-amber-800">Important!</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Copy these credentials now. The temporary password will NEVER be displayed again.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Username</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={credentials.username} />
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(credentials.username)}>Copy</Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={credentials.tempPassword} />
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(credentials.tempPassword)}>Copy</Button>
                  </div>
                </div>
                
                <Button className="w-full mt-4" onClick={resetForm}>Done</Button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mentor">Mentor</Label>
                    <Input id="mentor" required value={formData.mentor} onChange={e => setFormData({...formData, mentor: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input id="start_date" type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input id="end_date" type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Intern Account'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search interns..." 
              className="pl-9 pr-4 py-2 w-full text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No interns found. Click "Add Intern" to create one.
                </TableCell>
              </TableRow>
            ) : (
              interns.map((intern) => {
                const targetId = getInternId(intern)
                return (
                  <TableRow key={targetId}>
                    <TableCell className="font-medium">
                      {intern.profiles?.first_name} {intern.profiles?.last_name}
                      <div className="text-xs text-slate-500 font-normal">{intern.profiles?.username}</div>
                    </TableCell>
                    <TableCell>{intern.role_title}</TableCell>
                    <TableCell>{intern.department}</TableCell>
                    <TableCell>{intern.start_date ? new Date(intern.start_date).toLocaleDateString() : '--'}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        intern.status === 'active' ? 'bg-green-100 text-green-700' : 
                        intern.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        intern.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'}`}>
                        {(intern.status || 'active').charAt(0).toUpperCase() + (intern.status || 'active').slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(intern)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setSelectedIntern(intern)
                        loadInternProjects(targetId)
                      }}>
                        Manage
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleResetPassword(targetId)}>
                        Reset Pass
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Intern Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Intern</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateIntern} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name</Label>
                <Input 
                  id="edit_first_name" 
                  required 
                  value={editFormData.first_name} 
                  onChange={e => setEditFormData({...editFormData, first_name: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name</Label>
                <Input 
                  id="edit_last_name" 
                  required 
                  value={editFormData.last_name} 
                  onChange={e => setEditFormData({...editFormData, last_name: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_department">Department</Label>
                <Input 
                  id="edit_department" 
                  required 
                  value={editFormData.department} 
                  onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_role_title">Role Title</Label>
                <Input 
                  id="edit_role_title" 
                  required 
                  value={editFormData.role_title} 
                  onChange={e => setEditFormData({...editFormData, role_title: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_mentor">Mentor Name (Optional)</Label>
              <Input 
                id="edit_mentor" 
                value={editFormData.mentor} 
                onChange={e => setEditFormData({...editFormData, mentor: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Start Date</Label>
                <Input 
                  id="edit_start_date" 
                  type="date" 
                  required 
                  value={editFormData.start_date} 
                  onChange={e => setEditFormData({...editFormData, start_date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_end_date">End Date</Label>
                <Input 
                  id="edit_end_date" 
                  type="date" 
                  required 
                  value={editFormData.end_date} 
                  onChange={e => setEditFormData({...editFormData, end_date: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
