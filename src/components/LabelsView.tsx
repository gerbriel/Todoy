import { useState } from 'react'
import { Label, LabelColor } from '@/lib/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { Plus, PencilSimple, Trash, Tag } from '@phosphor-icons/react'
import { labelsService } from '@/services/labels.service'

interface LabelsViewProps {
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  orgId: string
}

const LABEL_COLORS: { name: string; value: LabelColor; hex: string }[] = [
  { name: 'Blue', value: 'blue', hex: '#3B82F6' },
  { name: 'Purple', value: 'purple', hex: '#8B5CF6' },
  { name: 'Green', value: 'green', hex: '#10B981' },
  { name: 'Orange', value: 'orange', hex: '#F97316' },
  { name: 'Red', value: 'red', hex: '#EF4444' },
  { name: 'Teal', value: 'teal', hex: '#14B8A6' },
]

export default function LabelsView({ labels, setLabels, orgId }: LabelsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const [labelName, setLabelName] = useState('')
  const [labelColor, setLabelColor] = useState<LabelColor>(LABEL_COLORS[0].value)

  const getColorHex = (color: LabelColor): string => {
    return LABEL_COLORS.find(c => c.value === color)?.hex || '#3B82F6'
  }

  const handleCreate = () => {
    setEditingLabel(null)
    setLabelName('')
    setLabelColor(LABEL_COLORS[0].value)
    setDialogOpen(true)
  }

  const handleEdit = (label: Label) => {
    setEditingLabel(label)
    setLabelName(label.name)
    setLabelColor(label.color)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!labelName.trim()) {
      toast.error('Label name cannot be empty')
      return
    }

    try {
      if (editingLabel) {
        // Update existing label
        const updated = await labelsService.update(editingLabel.id, {
          name: labelName.trim(),
          color: labelColor,
        })
        setLabels(prev => prev.map(l => l.id === updated.id ? updated : l))
        toast.success('Label updated')
      } else {
        // Create new label
        const newLabel = await labelsService.create({
          name: labelName.trim(),
          color: labelColor,
        }, orgId)
        setLabels(prev => [...prev, newLabel])
        toast.success('Label created')
      }
      setDialogOpen(false)
    } catch (error) {
      toast.error(editingLabel ? 'Failed to update label' : 'Failed to create label')
      console.error(error)
    }
  }

  const handleDelete = async (label: Label) => {
    if (!confirm(`Delete label "${label.name}"?`)) return

    try {
      await labelsService.delete(label.id)
      setLabels(prev => prev.filter(l => l.id !== label.id))
      toast.success('Label deleted')
    } catch (error) {
      toast.error('Failed to delete label')
      console.error(error)
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Labels</h1>
            <p className="text-muted-foreground mt-1">
              Organize your tasks with custom labels
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            New Label
          </Button>
        </div>

        {/* Labels List */}
        <div className="bg-card border rounded-lg">
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="p-4 space-y-2">
              {labels.length === 0 ? (
                <div className="text-center py-12">
                  <Tag size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No labels yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first label to get started
                  </p>
                </div>
              ) : (
                labels.map(label => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getColorHex(label.color) }}
                      />
                      <span className="font-medium">{label.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(label)}
                      >
                        <PencilSimple size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(label)}
                      >
                        <Trash size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLabel ? 'Edit Label' : 'Create Label'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={labelName}
                onChange={(e) => setLabelName(e.target.value)}
                placeholder="Label name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Color</label>
              <div className="grid grid-cols-5 gap-2">
                {LABEL_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-full h-10 rounded-md transition-all ${
                      labelColor === color.value
                        ? 'ring-2 ring-primary ring-offset-2'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    onClick={() => setLabelColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: getColorHex(labelColor) }}
              />
              <span className="font-medium">{labelName || 'Label Preview'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingLabel ? 'Save Changes' : 'Create Label'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
