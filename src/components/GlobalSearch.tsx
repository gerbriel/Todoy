import { useState, useEffect } from 'react'
import { Input } from './ui/input'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { Project, Campaign, Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ScrollArea } from './ui/scroll-area'

interface GlobalSearchProps {
  projects: Project[]
  campaigns: Campaign[]
  tasks: Task[]
  onNavigateToProject: (projectId: string) => void
  onNavigateToCampaign: (campaignId: string) => void
  onClose?: () => void
}

type SearchResult = {
  type: 'project' | 'campaign' | 'task'
  id: string
  title: string
  subtitle?: string
  parentId?: string
}

export default function GlobalSearch({
  projects,
  campaigns,
  tasks,
  onNavigateToProject,
  onNavigateToCampaign,
  onClose,
}: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const query = searchQuery.toLowerCase()
    const searchResults: SearchResult[] = []

    projects.forEach(project => {
      if (project.title.toLowerCase().includes(query) || project.description.toLowerCase().includes(query)) {
        searchResults.push({
          type: 'project',
          id: project.id,
          title: project.title,
          subtitle: project.description,
        })
      }
    })

    campaigns.forEach(campaign => {
      if (campaign.title.toLowerCase().includes(query) || campaign.description?.toLowerCase().includes(query)) {
        const project = projects.find(p => p.id === campaign.projectId)
        searchResults.push({
          type: 'campaign',
          id: campaign.id,
          title: campaign.title,
          subtitle: project?.title,
          parentId: campaign.projectId,
        })
      }
    })

    tasks.forEach(task => {
      if (task.title.toLowerCase().includes(query) || task.description.toLowerCase().includes(query)) {
        const campaign = campaigns.find(c => c.id === task.campaignId)
        searchResults.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: campaign?.title,
          parentId: task.campaignId,
        })
      }
    })

    setResults(searchResults.slice(0, 20))
    setSelectedIndex(0)
  }, [searchQuery, projects, campaigns, tasks])

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'project') {
      onNavigateToProject(result.id)
    } else if (result.type === 'campaign') {
      onNavigateToCampaign(result.id)
    } else if (result.type === 'task' && result.parentId) {
      onNavigateToCampaign(result.parentId)
    }
    onClose?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose?.()
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          weight="bold"
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search projects, campaigns, tasks..."
          className="pl-9 pr-9"
          autoFocus
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X size={14} weight="bold" />
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <ScrollArea className="max-h-[400px] border rounded-lg bg-card">
          <div className="p-1">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded transition-colors',
                  index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-semibold text-muted-foreground">
                    {result.type}
                  </span>
                  <span className="text-sm font-medium truncate">{result.title}</span>
                </div>
                {result.subtitle && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {result.subtitle}
                  </div>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {searchQuery && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No results found for "{searchQuery}"
        </div>
      )}
    </div>
  )
}
