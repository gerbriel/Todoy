import { useState } from 'react'
import { Clock, Tag, CurrencyDollar } from '@phosphor-icons/react'
import { Card, Label, List, Board } from '@/lib/types'
import { getLabelColor, formatDate, isOverdue, formatCurrency } from '@/lib/helpers'
import { Badge } from './ui/badge'
import CardDetailDialog from './CardDetailDialog'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  card: Card
  cards: Card[]
  setCards: (updater: (cards: Card[]) => Card[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  boards: Board[]
}

export default function KanbanCard({
  card,
  cards,
  setCards,
  labels,
  setLabels,
  lists,
  boards,
}: KanbanCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const cardLabels = labels.filter(l => card.labelIds.includes(l.id))
  const visibleLabels = cardLabels.slice(0, 3)
  const remainingCount = cardLabels.length - 3

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="w-full bg-card border border-border rounded-lg p-3 text-left hover:shadow-md transition-shadow duration-200 group"
      >
        <h4 className="text-sm font-medium text-foreground mb-2 group-hover:text-accent transition-colors">
          {card.title}
        </h4>

        {card.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {card.description}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {visibleLabels.map(label => (
            <Badge
              key={label.id}
              className={cn(
                'text-xs text-white px-2 py-0.5',
                getLabelColor(label.color)
              )}
            >
              {label.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              +{remainingCount}
            </Badge>
          )}

          {card.dueDate && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isOverdue(card.dueDate)
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              <Clock size={12} weight="bold" />
              <span>{formatDate(card.dueDate)}</span>
            </div>
          )}

          {card.budget && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CurrencyDollar size={12} weight="bold" />
              <span>{formatCurrency(card.actualSpend || 0)} / {formatCurrency(card.budget)}</span>
            </div>
          )}
        </div>
      </button>

      <CardDetailDialog
        card={card}
        cards={cards}
        setCards={setCards}
        labels={labels}
        setLabels={setLabels}
        lists={lists}
        boards={boards}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  )
}
