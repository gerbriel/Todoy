import { Button } from '../ui/button'
import { CaretDown, CaretUp } from '@phosphor-icons/react'

interface ShowMoreButtonProps {
  count: number
  isExpanded: boolean
  onClick: () => void
  layer?: number // Optional now, only used for backward compatibility
}

export function ShowMoreButton({ count, isExpanded, onClick, layer }: ShowMoreButtonProps) {
  // Position at bottom of container by default, or use layer positioning if provided
  const positionStyle = layer !== undefined && layer > 0
    ? { top: `${2.5 + layer * 2.25}rem` }
    : { bottom: 0 }
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="absolute left-2 text-xs font-medium text-primary/70 hover:text-primary hover:underline transition-colors flex items-center gap-1 z-20 bg-background/80 px-2 py-1 rounded-md backdrop-blur-sm"
      style={positionStyle}
    >
      {isExpanded ? (
        <>
          <CaretUp size={12} weight="bold" />
          <span>Show less</span>
        </>
      ) : (
        <>
          <CaretDown size={12} weight="bold" />
          <span>+ {count} more</span>
        </>
      )}
    </button>
  )
}
