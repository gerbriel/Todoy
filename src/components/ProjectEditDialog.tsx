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
import { projectsService } from '@/services/projects.service'
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

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Project title cannot be empty')
      return
    }

    try {
      await projectsService.update(project.id, {
        title: title.trim(),
        description: description.trim(),
        stageDates,
      })
      toast.success('Project updated')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setTitle(project.title)
    setDescription(project.description)
    setStageDates(project.stageDates || [])
    onOpenChange(false)
  }

  const handleArchive = async () => {
    try {
      await projectsService.update(project.id, { archived: true })
      toast.success('Project archived')
      onOpenChange(false)
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    }
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
