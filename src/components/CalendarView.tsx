import { useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { Board, Card, Label, List, FilterState } from '@/lib/types'
import { filterCards, groupCardsByDate } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import KanbanCard from './KanbanCard'
import EmptyState from './EmptyState'

interface CalendarViewProps {
  boards: Board[]
  cards: Card[]
  setCards: (updater: (cards: Card[]) => Card[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeBoardId: string | null
  filters: FilterState
}

export default function CalendarView({
  boards,
  cards,
  setCards,
  labels,
  setLabels,
  lists,
  activeBoardId,
  filters,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const filteredCards = filterCards(cards, boards, labels, filters)
  const cardsWithDates = filteredCards.filter(c => c.dueDate)
  const cardsWithoutDates = filteredCards.filter(c => !c.dueDate)
  const groupedCards = groupCardsByDate(cardsWithDates)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
  
  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))

  const days: Date[] = []
  const currentDay = new Date(startDate)
  while (currentDay <= endDate) {
    days.push(new Date(currentDay))
    currentDay.setDate(currentDay.getDate() + 1)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  if (!activeBoardId && !filters.showAllBoards) {
    return (
      <EmptyState
        title="No board selected"
        description="Select a board from the sidebar to view its calendar"
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <CaretLeft size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <CaretRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map(day => {
              const dateKey = day.toISOString().split('T')[0]
              const dayCards = groupedCards[dateKey] || []
              const isCurrentMonth = day.getMonth() === month
              const isToday = day.toDateString() === new Date().toDateString()

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] border border-border rounded-lg p-2 ${
                    isCurrentMonth ? 'bg-card' : 'bg-muted/50'
                  } ${isToday ? 'ring-2 ring-accent' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayCards.slice(0, 3).map(card => {
                      const cardLabels = labels.filter(l => card.labelIds.includes(l.id))
                      return (
                        <div
                          key={card.id}
                          className="bg-accent/10 border border-accent/20 rounded px-2 py-1 text-xs text-foreground truncate cursor-pointer hover:bg-accent/20 transition-colors"
                          title={card.title}
                        >
                          {card.title}
                        </div>
                      )
                    })}
                    {dayCards.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayCards.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {cardsWithoutDates.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Unscheduled ({cardsWithoutDates.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cardsWithoutDates.map(card => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    cards={cards}
                    setCards={setCards}
                    labels={labels}
                    setLabels={setLabels}
                    lists={lists}
                    boards={boards}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
