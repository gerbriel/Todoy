import { useState } from 'react'
import { Task, Campaign, List, Label, Comment, Attachment, Project } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label as UILabel } from './ui/label'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner'
import { Target, Trash, ChatCircle, Paperclip, Tag, Plus, X, Link, File, Archive, DotsThree, ArrowsLeftRight, UploadSimple, Copy } from '@phosphor-icons/react'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { generateId, formatDate } from '@/lib/helpers'
import { tasksService } from '@/services/tasks.service'
import { attachmentsService } from '@/services/attachments.service'
import ConfirmDialog from './ConfirmDialog'
import DuplicateDialog from './DuplicateDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import StageDateManager from './StageDateManager'

interface TaskDetailDialogProps {
  task: Task
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  campaigns: Campaign[]
  projects: Project[]
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
}

export default function TaskDetailDialog({
  task,
  tasks,
  setTasks,
  campaigns,
  lists,
  projects,
  labels,
  setLabels,
  open,
  onOpenChange,
  orgId,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description)
  const [selectedCampaignId, setSelectedCampaignId] = useState(task.campaignId)
  const [selectedListId, setSelectedListId] = useState(task.listId)
  const [dueDate, setDueDate] = useState(task.dueDate || '')
  const [stageDates, setStageDates] = useState(task.stageDates || [])
  const [comments, setComments] = useState<Comment[]>(task.comments || [])
  const [attachments, setAttachments] = useState<Attachment[]>(task.attachments || [])
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task.labelIds || [])
  
  const [newComment, setNewComment] = useState('')
  const [newAttachmentName, setNewAttachmentName] = useState('')
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('')
  const [attachmentType, setAttachmentType] = useState<'file' | 'link'>('link')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId)
  const availableLists = lists.filter(l => l.campaignId === selectedCampaignId)

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    try {
      await tasksService.update(task.id, {
        title: title.trim(),
        description: description.trim(),
        campaignId: selectedCampaignId,
        listId: selectedListId,
        dueDate: dueDate || undefined,
        stageDates,
        labelIds: selectedLabelIds,
      })
      toast.success('Task updated')
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    
    const comment: Comment = {
      id: generateId(),
      content: newComment.trim(),
      author: 'You', // In a real app, get from auth
      createdAt: new Date().toISOString(),
    }
    
    setComments([...comments, comment])
    setNewComment('')
    toast.success('Comment added')
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(c => c.id !== commentId))
    toast.success('Comment deleted')
  }

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim() || !newAttachmentUrl.trim()) {
      toast.error('Please fill in both name and URL')
      return
    }
    
    const attachment: Attachment = {
      id: generateId(),
      name: newAttachmentName.trim(),
      url: newAttachmentUrl.trim(),
      type: attachmentType,
      createdAt: new Date().toISOString(),
    }
    
    setAttachments([...attachments, attachment])
    setNewAttachmentName('')
    setNewAttachmentUrl('')
    toast.success('Attachment added')
  }

  const handleDeleteAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId))
    toast.success('Attachment removed')
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)
      
      const uploadedAttachment = await attachmentsService.upload(file, orgId, task.id)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      const attachment: Attachment = {
        id: uploadedAttachment.id,
        name: uploadedAttachment.name,
        url: uploadedAttachment.url,
        type: 'file',
        size: uploadedAttachment.size,
        createdAt: new Date().toISOString(),
      }
      
      setAttachments([...attachments, attachment])
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    
    // Upload first file only
    await handleFileUpload(files[0])
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    handleFileUpload(files[0])
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const handleDelete = async () => {
    try {
      await tasksService.delete(task.id)
      // Optimistically update local state
      setTasks(prev => prev.filter(t => t.id !== task.id))
      toast.success('Task deleted')
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleArchive = async () => {
    try {
      await tasksService.update(task.id, { completed: true })
      // Optimistically update local state
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true } : t))
      toast.success('Task archived')
      onOpenChange(false)
    } catch (error) {
      console.error('Error archiving task:', error)
      toast.error('Failed to archive task')
    }
  }

  const handleDuplicate = async (targetProjectId: string, targetCampaignId?: string, targetListId?: string, newName?: string) => {
    try {
      const taskName = newName || `${task.title} (Copy)`
      const duplicatedTask = await tasksService.duplicate(
        task.id,
        taskName,
        targetListId,
        targetCampaignId
      )
      // Optimistically add to local state
      setTasks(prev => [...prev, duplicatedTask])
      toast.success('Task duplicated successfully')
      setShowDuplicateDialog(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Error duplicating task:', error)
      toast.error('Failed to duplicate task')
    }
  }

  const handleMoveToCampaign = async (newCampaignId: string) => {
    const newCampaignLists = lists.filter(l => l.campaignId === newCampaignId)
    const targetListId = newCampaignLists.length > 0 ? newCampaignLists[0].id : ''
    
    try {
      await tasksService.update(task.id, { 
        campaignId: newCampaignId, 
        listId: targetListId 
      })
      const campaignName = campaigns.find(c => c.id === newCampaignId)?.title || 'campaign'
      toast.success(`Moved to ${campaignName}`)
      onOpenChange(false)
    } catch (error) {
      console.error('Error moving task:', error)
      toast.error('Failed to move task')
    }
  }

  const handleMoveToList = async (newListId: string) => {
    try {
      await tasksService.update(task.id, { listId: newListId })
      const listName = lists.find(l => l.id === newListId)?.title || 'list'
      toast.success(`Moved to ${listName}`)
    } catch (error) {
      console.error('Error moving task:', error)
      toast.error('Failed to move task')
    }
  }

  const handleCampaignChange = (newCampaignId: string) => {
    setSelectedCampaignId(newCampaignId)
    const newCampaignLists = lists.filter(l => l.campaignId === newCampaignId)
    if (newCampaignLists.length > 0) {
      setSelectedListId(newCampaignLists[0].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription className="sr-only">
              Edit task details including title, description, stage, due date, and assignments
            </DialogDescription>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                className="text-orange-600 hover:bg-orange-50"
              >
                <Archive size={16} weight="bold" />
                Archive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDuplicateDialog(true)}
                className="text-blue-600 hover:bg-blue-50"
              >
                <Copy size={16} weight="bold" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash size={16} weight="bold" />
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <ChatCircle size={16} weight="duotone" />
              Comments {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip size={16} weight="duotone" />
              Attachments {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="labels" className="gap-2">
              <Tag size={16} weight="duotone" />
              Labels
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="details" className="space-y-4 m-0 p-1">
              <div className="space-y-2">
                <UILabel htmlFor="task-title">Title</UILabel>
                <Input
                  id="task-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                />
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="task-description">Description</UILabel>
                <Textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <UILabel htmlFor="task-campaign">Campaign</UILabel>
                  <Select value={selectedCampaignId} onValueChange={handleCampaignChange}>
                    <SelectTrigger id="task-campaign">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          <div className="flex items-center gap-2">
                            <Target size={14} weight="duotone" />
                            {campaign.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {availableLists.length > 0 && (
                  <div className="space-y-2">
                    <UILabel htmlFor="task-list">List</UILabel>
                    <Select value={selectedListId} onValueChange={setSelectedListId}>
                      <SelectTrigger id="task-list">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLists.map(list => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <UILabel htmlFor="task-due-date">Due Date</UILabel>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <Separator />

              <StageDateManager
                stageDates={stageDates}
                onChange={setStageDates}
                entityType="task"
              />
            </TabsContent>

            <TabsContent value="comments" className="space-y-4 m-0 p-1">
              <div className="space-y-2">
                <UILabel>Add Comment</UILabel>
                <div className="flex gap-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAddComment()
                      }
                    }}
                  />
                </div>
                <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim()}>
                  <Plus size={16} weight="bold" />
                  Add Comment
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4 m-0 p-1">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all
                  ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25'}
                  ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50 hover:bg-muted/30'}
                `}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <UploadSimple size={32} weight="duotone" className="text-muted-foreground" />
                    {isUploading ? (
                      <>
                        <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                        <div className="w-full max-w-xs h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Drag & drop files here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maximum file size: 10MB
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or add a link</span>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
                <div className="space-y-2">
                  <Input
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    placeholder="Link title..."
                  />
                  <Input
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    placeholder="https://..."
                  />
                  <Button onClick={handleAddAttachment} size="sm" className="w-full">
                    <Plus size={16} weight="bold" />
                    Add Link
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attachments yet. Drag & drop files or add links.
                  </p>
                ) : (
                  attachments.map(attachment => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {attachment.type === 'link' ? (
                          <Link size={20} weight="duotone" className="text-primary flex-shrink-0" />
                        ) : (
                          <File size={20} weight="duotone" className="text-primary flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium hover:underline truncate block"
                          >
                            {attachment.name}
                          </a>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {attachment.size && (
                              <span>{attachmentsService.formatFileSize(attachment.size)}</span>
                            )}
                            {attachment.createdAt && (
                              <span>• {formatDate(attachment.createdAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.id)}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="labels" className="space-y-4 m-0 p-1">
              <div className="space-y-2">
                <UILabel>Select Labels</UILabel>
                <div className="flex flex-wrap gap-2">
                  {labels.map(label => (
                    <Badge
                      key={label.id}
                      variant={selectedLabelIds.includes(label.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleLabel(label.id)}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="flex justify-between pt-4 border-t mt-4">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <DotsThree size={20} weight="bold" className="mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowsLeftRight size={16} className="mr-2" />
                      Move to Campaign
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {campaigns.map(campaign => (
                        <DropdownMenuItem 
                          key={campaign.id} 
                          onClick={() => handleMoveToCampaign(campaign.id)}
                          disabled={campaign.id === selectedCampaignId}
                        >
                          <Target size={14} className="mr-2" />
                          {campaign.title}
                          {campaign.id === selectedCampaignId && (
                            <span className="ml-auto text-xs text-muted-foreground">(current)</span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowsLeftRight size={16} className="mr-2" />
                      Move to List
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {lists
                        .filter(l => l.campaignId === selectedCampaignId)
                        .map(list => (
                          <DropdownMenuItem 
                            key={list.id} 
                            onClick={() => handleMoveToList(list.id)}
                            disabled={list.id === selectedListId}
                          >
                            {list.title}
                            {list.id === selectedListId && (
                              <span className="ml-auto text-xs text-muted-foreground">(current)</span>
                            )}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
                    <Archive size={16} className="mr-2" />
                    Archive Task
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive">
                    <Trash size={16} className="mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
        title="Delete Task?"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete Task"
      />

      <DuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        type="task"
        itemName={task.title}
        onDuplicate={handleDuplicate}
        projects={projects}
        campaigns={campaigns}
        lists={lists}
        currentCampaignId={task.campaignId}
      />
    </Dialog>
  )
}
