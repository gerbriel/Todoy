import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Notification } from '@/lib/types'
import { Bell, Check, X } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface NotificationsPanelProps {
  userId: string
  onNavigate?: (type: 'project' | 'campaign' | 'task', id: string) => void
}

export default function NotificationsPanel({ userId, onNavigate }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useKV<Notification[]>('notifications', [])
  const [isOpen, setIsOpen] = useState(false)

  const userNotifications = notifications?.filter(n => n.userId === userId) || []
  const unreadCount = userNotifications.filter(n => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications((current) =>
      (current || []).map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications((current) =>
      (current || []).map((n) =>
        n.userId === userId ? { ...n, read: true } : n
      )
    )
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((current) =>
      (current || []).filter((n) => n.id !== notificationId)
    )
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.linkType && notification.linkId && onNavigate) {
      onNavigate(notification.linkType, notification.linkId)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment':
        return '💬'
      case 'mention':
        return '@'
      case 'task_assigned':
        return '📋'
      case 'task_completed':
        return '✅'
      case 'project_shared':
        return '👥'
      case 'campaign_updated':
        return '📢'
      default:
        return '🔔'
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={20} weight={unreadCount > 0 ? 'fill' : 'regular'} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {userNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell size={48} className="text-muted-foreground mb-2" weight="duotone" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {userNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
                    !notification.read && 'bg-accent/20'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{notification.title}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                          >
                            <Check size={12} className="mr-1" />
                            Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
