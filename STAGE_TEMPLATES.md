# Stage Templates & Organization Features - Implementation Plan

## Overview

This document outlines the remaining features to implement based on user requirements:
1. Stage template management (reusable stage names)
2. Task stage assignment UI
3. Organization invite system
4. Organization-wide views

## 1. Stage Template Management

### Purpose
Allow users to create reusable stage names that can be applied to multiple tasks, similar to labels but for workflow stages.

### Requirements
- Create/edit/delete stage templates
- Assign colors to stages for visual distinction
- Order stages (for logical workflow progression)
- Share templates across organization (org-scoped) or keep personal (user-scoped)

### UI Components Needed

#### StageTemplateManager.tsx
Location: `src/components/StageTemplateManager.tsx`

**Features:**
- List of existing stage templates
- Drag-and-drop reordering
- Add new template button
- Edit template (name, color)
- Delete template (with confirmation)
- Filter: Show org templates vs personal templates

**Mockup Structure:**
```
┌─────────────────────────────────────────┐
│ Stage Templates                         │
│ ─────────────────────────────────────── │
│ [+ New Template]    [Personal|Org]      │
│                                         │
│ ○ Planning         [Edit] [Delete]     │
│ ○ Development      [Edit] [Delete]     │
│ ○ Testing          [Edit] [Delete]     │
│ ○ Review           [Edit] [Delete]     │
│ ○ Deployed         [Edit] [Delete]     │
└─────────────────────────────────────────┘
```

**Code Skeleton:**
```typescript
interface StageTemplateManagerProps {
  stageTemplates: StageTemplate[]
  setStageTemplates: (updater: (templates: StageTemplate[]) => StageTemplate[]) => void
  currentUserId?: string
  currentOrgId?: string
}

export function StageTemplateManager({ ... }: StageTemplateManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showOrgTemplates, setShowOrgTemplates] = useState(true)
  
  const handleCreate = () => {
    const newTemplate: StageTemplate = {
      id: generateId(),
      name: 'New Stage',
      color: '#6366f1',
      order: stageTemplates.length,
      createdBy: currentUserId,
      orgId: showOrgTemplates ? currentOrgId : undefined
    }
    setStageTemplates(prev => [...prev, newTemplate])
  }
  
  const handleDelete = (id: string) => {
    // Show confirmation dialog
    // Check if any tasks use this stage
    // Delete template
  }
  
  // ... render logic
}
```

### Integration Points
- Add menu item in Header or Sidebar to open template manager
- Could be a dialog or dedicated view
- Access via Settings or Tools menu

## 2. Task Stage Assignment UI

### Purpose
Allow users to set the `currentStage` field on tasks by selecting from available stage templates.

### UI Components Needed

#### Stage Selector in TaskDetailDialog.tsx

**Location to Update:** `src/components/TaskDetailDialog.tsx`

**Feature:**
Add a "Current Stage" dropdown in the task details panel

**Mockup:**
```
┌─────────────────────────────────────────┐
│ Task Details                            │
│ ─────────────────────────────────────── │
│ Title: [Task title here]                │
│                                         │
│ Current Stage: [Select stage ▼]        │
│   Planning                              │
│   Development                           │
│   Testing                               │
│   Review                                │
│   + Create new stage                    │
│                                         │
│ Due Date: [Date picker]                 │
│ Labels: [Label selector]                │
└─────────────────────────────────────────┘
```

**Code Addition:**
```typescript
// In TaskDetailDialog.tsx

// Add to component
const [selectedStage, setSelectedStage] = useState(task.currentStage || '')

// Add to UI (near labels section)
<div className="space-y-2">
  <Label>Current Stage</Label>
  <Select
    value={selectedStage}
    onValueChange={(value) => {
      setSelectedStage(value)
      // Update task in state
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, currentStage: value } : t
      ))
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select stage" />
    </SelectTrigger>
    <SelectContent>
      {stageTemplates
        .sort((a, b) => a.order - b.order)
        .map(template => (
          <SelectItem key={template.id} value={template.name}>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: template.color }} 
              />
              {template.name}
            </div>
          </SelectItem>
        ))}
      <SelectItem value="__create_new__">
        <Plus size={14} /> Create new stage
      </SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Integration Points
- Pass `stageTemplates` prop to TaskDetailDialog
- Handle "Create new stage" option (open inline form or template manager)
- Show current stage with color indicator in task cards

## 3. Organization Invite System

### Purpose
Allow organization owners/admins to invite users by email, and allow users to request to join organizations.

### UI Components Needed

#### OrgInviteDialog.tsx
Location: `src/components/OrgInviteDialog.tsx`

**Features:**
- Email input field
- Role selector (member, admin, owner)
- Send invite button
- List of pending invites
- Resend/cancel invite actions

**Mockup:**
```
┌─────────────────────────────────────────┐
│ Invite to Organization                  │
│ ─────────────────────────────────────── │
│ Email: [user@example.com]               │
│ Role:  [Member ▼]                       │
│                                         │
│        [Send Invite]                    │
│                                         │
│ Pending Invites:                        │
│ • alice@example.com (Member)            │
│   [Resend] [Cancel]                     │
│ • bob@example.com (Admin)               │
│   [Resend] [Cancel]                     │
└─────────────────────────────────────────┘
```

**Code Skeleton:**
```typescript
interface OrgInviteDialogProps {
  organization: Organization
  onClose: () => void
  onInvite: (invite: OrgInvite) => void
}

export function OrgInviteDialog({ ... }: OrgInviteDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('member')
  
  const handleSendInvite = () => {
    const invite: OrgInvite = {
      id: generateId(),
      orgId: organization.id,
      email,
      role,
      invitedBy: currentUserId,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      expiresAt: addDays(new Date(), 7).toISOString()
    }
    onInvite(invite)
    // Send notification/email
    toast.success('Invite sent!')
  }
  
  // ... render logic
}
```

#### OrgJoinRequestDialog.tsx
Location: `src/components/OrgJoinRequestDialog.tsx`

**Features:**
- Browse organizations (public visibility)
- Request to join button
- Optional message field
- View status of pending requests

**Mockup:**
```
┌─────────────────────────────────────────┐
│ Join Organization                       │
│ ─────────────────────────────────────── │
│ Organizations:                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Acme Corp                           │ │
│ │ Marketing and design team           │ │
│ │ 12 members                          │ │
│ │              [Request to Join]      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Your Requests:                          │
│ • Acme Corp (Pending)                   │
│ • Design Agency (Approved) ✓            │
└─────────────────────────────────────────┘
```

**Code Skeleton:**
```typescript
export function OrgJoinRequestDialog({ ... }) {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [message, setMessage] = useState('')
  
  const handleRequestJoin = (orgId: string) => {
    const request: JoinRequest = {
      id: generateId(),
      userId: currentUserId,
      orgId,
      message,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    }
    // Save request
    // Notify org admins
    toast.success('Request sent!')
  }
  
  // ... render logic
}
```

#### OrgManagementPanel.tsx
Location: `src/components/OrgManagementPanel.tsx`

**Features:**
- View organization details
- Manage members (promote/demote/remove)
- Approve/reject join requests
- View/manage invites
- Organization settings

**Sections:**
- Members tab
- Pending Invites tab
- Join Requests tab
- Settings tab

### Integration Points
- Add "Invite Members" button in Header user menu or organization view
- Add "Join Organization" in user menu or settings
- Notification when invite received/request approved
- Show org switcher in Header

## 4. Organization-Wide Views

### Purpose
Allow users to see all projects, campaigns, and tasks from their organization members (respecting visibility settings).

### UI Components Needed

#### OrganizationView.tsx
Location: `src/components/OrganizationView.tsx`

**Features:**
- Show all org projects/campaigns/tasks
- Filter by:
  - User (show only specific member's items)
  - Visibility (public, org, private)
  - Project/Campaign
  - Date range
- Group by user or project
- Aggregate statistics (total tasks, completion rate, etc.)

**Mockup:**
```
┌─────────────────────────────────────────────────────────┐
│ Organization Overview - Acme Corp                        │
│ ──────────────────────────────────────────────────────── │
│ [All Members ▼] [All Projects ▼] [This Month ▼]         │
│                                                          │
│ Team Activity:                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Alice Smith                                        │  │
│ │ • Product Launch (Campaign) - 8 tasks              │  │
│ │ • Website Redesign (Project) - 12 tasks            │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Bob Johnson                                        │  │
│ │ • Q4 Marketing (Campaign) - 5 tasks                │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Statistics:                                              │
│ • Total Projects: 15                                     │
│ • Active Campaigns: 23                                   │
│ • Tasks Completed This Week: 47                          │
│ • Team Velocity: ▲ 12%                                   │
└──────────────────────────────────────────────────────────┘
```

**Code Skeleton:**
```typescript
interface OrganizationViewProps {
  organization: Organization
  members: OrgMember[]
  projects: Project[]
  campaigns: Campaign[]
  tasks: Task[]
}

export function OrganizationView({ ... }: OrganizationViewProps) {
  const [selectedMember, setSelectedMember] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'user' | 'project'>('user')
  
  // Filter items based on visibility and org membership
  const visibleProjects = projects.filter(p => {
    if (p.visibility === 'private') return false
    if (p.visibility === 'org' && p.orgId === organization.id) return true
    if (p.visibility === 'public') return true
    return false
  })
  
  // Group and display logic
  const groupedByUser = members.map(member => ({
    user: member,
    projects: visibleProjects.filter(p => p.ownerId === member.userId),
    campaigns: visibleCampaigns.filter(c => c.createdBy === member.userId),
    tasks: visibleTasks.filter(t => t.assignedTo === member.userId)
  }))
  
  // ... render logic
}
```

### Integration Points
- Add "Organization View" navigation item in Sidebar
- Add to navigation view type in App.tsx
- Respect visibility settings (don't show private items)
- Show user avatars/names for attribution

## Implementation Priority

### High Priority (Core Functionality)
1. ✅ Stage filter fix (COMPLETED)
2. **Task stage assignment UI** - Essential for stage system to be usable
3. **Basic stage template creation** - Allow users to create templates inline

### Medium Priority (Enhanced Features)
4. **Stage template manager** - Full CRUD for templates
5. **Organization invite system** - Core collaboration feature
6. **Invite acceptance flow** - Handle incoming invites

### Low Priority (Advanced Features)
7. **Organization join requests** - Alternative to invites
8. **Organization-wide views** - Visibility into team work
9. **Stage template sharing** - Org-scoped templates

## Data Model Review

### Already Implemented in types.ts:
```typescript
interface StageTemplate {
  id: string
  name: string
  color: string
  order: number
  createdBy?: string
  orgId?: string  // If set, template is org-wide
}

interface Task {
  currentStage?: string  // Current stage name
}

interface FilterState {
  stageNames: string[]  // Filter by stages
}

interface OrgInvite {
  id: string
  orgId: string
  email: string
  role: UserRole
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
}

interface JoinRequest {
  id: string
  userId: string
  orgId: string
  message?: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}
```

### Storage Keys for KV:
- `stageTemplates` - Array of StageTemplate
- `orgInvites` - Array of OrgInvite
- `joinRequests` - Array of JoinRequest
- (existing) `projects`, `campaigns`, `tasks`, `users`, `organizations`

## Next Immediate Action

**Start with Task Stage Assignment:**
1. Update TaskDetailDialog.tsx to include stage selector
2. Pass stageTemplates prop from App.tsx
3. Add visual indicator of current stage on task cards
4. Allow inline creation of new stage templates from dropdown

This will make the stage filtering feature immediately useful while you build out the full template management system.
