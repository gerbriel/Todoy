import { Notification } from '@/lib/types'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  linkType?: 'project' | 'campaign' | 'task',
  linkId?: string,
  createdBy?: string
): Notification {
  return {
    id: generateId(),
    userId,
    type,
    title,
    message,
    linkType,
    linkId,
    read: false,
    createdAt: new Date().toISOString(),
    createdBy,
  }
}

export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

export function createMentionNotifications(
  commentText: string,
  taskId: string,
  taskTitle: string,
  authorName: string,
  userEmailMap: Map<string, string>
): Notification[] {
  const mentions = extractMentions(commentText)
  const notifications: Notification[] = []

  mentions.forEach((mention) => {
    const userId = userEmailMap.get(mention)
    if (userId) {
      notifications.push(
        createNotification(
          userId,
          'mention',
          `${authorName} mentioned you`,
          `"${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
          'task',
          taskId,
          authorName
        )
      )
    }
  })

  return notifications
}
