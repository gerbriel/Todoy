import { useState } from 'react'
import { Project } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Archive, DotsThree } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import StageDateManager from './StageDateManager'

interface ProjectEditDialogProps {
  project: Project
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ProjectEditDialog({
  project,
  projects,
  setProjects,
  open,
  onOpenChange,
}: ProjectEditDialogProps) {
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description)
  const [stageDates, setStageDates] = useState(project.stageDates || [])

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Project title cannot be empty')
      return
    }

    setProjects(currentProjects =>
      currentProjects.map(p =>
        p.id === project.id
          ? {
              ...p,
              title: title.trim(),
              description: description.trim(),
              stageDates,
            }
          : p
      )
    )
    toast.success('Project updated')
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset to original values
    setTitle(project.title)
    setDescription(project.description)
    setStageDates(project.stageDates || [])
    onOpenChange(false)
  }

  const handleArchive = () => {
    setProjects(currentProjects =>
      currentProjects.map(p =>
        p.id === project.id ? { ...p, archived: true } : p
      )
    )
    toast.success('Project archived')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-title">Project Name</Label>
            <Input
              id="project-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project name..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your project..."
              rows={4}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Project Timeline & Milestones</Label>
            <p className="text-sm text-muted-foreground">
              Define key stages and milestones for this project
            </p>
            <StageDateManager
              stageDates={stageDates}
              onChange={setStageDates}
              entityType="project"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row sm:justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="text-muted-foreground hover:text-foreground sm:mr-auto"
              >
                <DotsThree size={20} weight="bold" className="mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
                <Archive size={16} className="mr-2" />
                Archive Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
