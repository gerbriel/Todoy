import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Project, Campaign, List } from '@/lib/types'
import { Copy } from '@phosphor-icons/react'

type DuplicateType = 'project' | 'campaign' | 'list' | 'task'

interface DuplicateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: DuplicateType
  itemName: string
  onDuplicate: (newName: string, targetId?: string) => Promise<void>
  
  // Optional: for selecting destination
  projects?: Project[]
  campaigns?: Campaign[]
  lists?: List[]
  
  // Current item context
  currentProjectId?: string
  currentCampaignId?: string
}

export default function DuplicateDialog({
  open,
  onOpenChange,
  type,
  itemName,
  onDuplicate,
  projects = [],
  campaigns = [],
  lists = [],
  currentProjectId,
  currentCampaignId,
}: DuplicateDialogProps) {
  const [newName, setNewName] = useState('')
  const [targetProjectId, setTargetProjectId] = useState<string>('')
  const [targetCampaignId, setTargetCampaignId] = useState<string>('')
  const [targetListId, setTargetListId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Set default name when dialog opens
  useEffect(() => {
    if (open) {
      setNewName(`${itemName} (Copy)`)
      setTargetProjectId(currentProjectId || '')
      setTargetCampaignId(currentCampaignId || '')
      setTargetListId('')
    }
  }, [open, itemName, currentProjectId, currentCampaignId])

  // Filter campaigns by selected project
  const filteredCampaigns = targetProjectId
    ? campaigns.filter(c => c.projectId === targetProjectId)
    : campaigns

  // Filter lists by selected campaign
  const filteredLists = targetCampaignId
    ? lists.filter(l => l.campaignId === targetCampaignId)
    : lists

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setIsSubmitting(true)
    try {
      let targetId: string | undefined

      if (type === 'campaign') {
        targetId = targetProjectId || undefined
      } else if (type === 'list') {
        targetId = targetCampaignId || undefined
      } else if (type === 'task') {
        targetId = targetListId || undefined
      }

      await onDuplicate(newName.trim(), targetId)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to duplicate:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getDialogTitle = () => {
    switch (type) {
      case 'project':
        return 'Duplicate Project as Template'
      case 'campaign':
        return 'Duplicate Campaign as Template'
      case 'list':
        return 'Duplicate List as Template'
      case 'task':
        return 'Duplicate Task as Template'
    }
  }

  const getDialogDescription = () => {
    switch (type) {
      case 'project':
        return 'Create a copy of this project with a new name. Stage structure will be preserved but dates and assignments will be reset.'
      case 'campaign':
        return 'Create a copy of this campaign. Choose a destination project and provide a new name.'
      case 'list':
        return 'Create a copy of this list. Choose a destination campaign and provide a new name.'
      case 'task':
        return 'Create a copy of this task. Choose a destination list and provide a new name.'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-5" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Enter new ${type} name`}
              required
            />
          </div>

          {/* Campaign: Select destination project */}
          {type === 'campaign' && projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="target-project">Destination Project</Label>
              <Select value={targetProjectId} onValueChange={setTargetProjectId}>
                <SelectTrigger id="target-project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* List: Select destination campaign */}
          {type === 'list' && (
            <>
              {projects.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="target-project-list">Project</Label>
                  <Select value={targetProjectId} onValueChange={(value) => {
                    setTargetProjectId(value)
                    setTargetCampaignId('') // Reset campaign when project changes
                  }}>
                    <SelectTrigger id="target-project-list">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {filteredCampaigns.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="target-campaign">Destination Campaign</Label>
                  <Select value={targetCampaignId} onValueChange={setTargetCampaignId}>
                    <SelectTrigger id="target-campaign">
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          {/* Task: Select destination list */}
          {type === 'task' && (
            <>
              {projects.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="target-project-task">Project</Label>
                  <Select value={targetProjectId} onValueChange={(value) => {
                    setTargetProjectId(value)
                    setTargetCampaignId('')
                    setTargetListId('')
                  }}>
                    <SelectTrigger id="target-project-task">
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {filteredCampaigns.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="target-campaign-task">Campaign</Label>
                  <Select value={targetCampaignId} onValueChange={(value) => {
                    setTargetCampaignId(value)
                    setTargetListId('')
                  }}>
                    <SelectTrigger id="target-campaign-task">
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCampaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {filteredLists.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="target-list">Destination List</Label>
                  <Select value={targetListId} onValueChange={setTargetListId}>
                    <SelectTrigger id="target-list">
                      <SelectValue placeholder="Select a list" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLists.map(list => (
                        <SelectItem key={list.id} value={list.id}>
                          {list.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !newName.trim()}>
              {isSubmitting ? 'Duplicating...' : 'Duplicate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
