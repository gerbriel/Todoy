# Organization Management System - Complete Documentation

## Overview

A full-featured organization management system that allows users to manage teams, invite members, view org-wide content, and assign people to projects, campaigns, and tasks.

## Features Implemented

### ✅ 1. Organization View & Management
- **View Organization Details**: Name, description, creation date
- **Edit Organization**: Update name and description (admin/owner only)
- **Organization Stats**: Real-time counts of members, projects, campaigns, and tasks
- **Tab-based Navigation**: Overview, Members, Invites, and Content tabs

### ✅ 2. Member Management
- **View All Members**: See all organization members with roles
- **Role Indicators**: Visual badges for Owner, Admin, and Member roles
- **Update Member Roles**: Change member roles (admin/owner only)
- **Remove Members**: Remove members from organization (admin/owner only)
- **Current User Indicator**: Shows "(You)" badge for current user
- **Role Descriptions**: Tooltip-like descriptions for each role

### ✅ 3. Invitation System
- **Send Invitations**: Invite new members by email
- **Role Selection**: Choose role when inviting (member/admin/owner)
- **Pending Invitations**: View all pending invites
- **Invite History**: See accepted/declined invites
- **Cancel Invites**: Cancel pending invitations
- **Expiration Tracking**: 7-day expiration for invites

### ✅ 4. Organization-Wide Content View
- **View All Content**: See all projects, campaigns, and tasks in the organization
- **Filter by Member**: Filter content by specific team member or view all
- **Assignments Display**: Shows who is assigned to each item
- **Grouped Views**: Content organized by type (projects, campaigns, tasks)
- **Empty States**: Helpful messages when no content exists

### ✅ 5. Assignment System
- **Projects**: Assign multiple users to projects (`assignedTo` field)
- **Campaigns**: Assign multiple users to campaigns (`assignedTo` field)
- **Tasks**: Assign multiple users to tasks (`assignedTo` field)
- **Assignment Badges**: Visual indicators showing assigned users
- **Filter by Assignment**: View only content assigned to specific users

## How to Access

### From Sidebar
Click the **"Organization"** button in the sidebar navigation (shows a briefcase icon)

### Navigation States
- Active state when viewing organization (blue/accent highlight)
- Always visible if you're part of an organization

## User Interface

### Organization View Layout

```
┌────────────────────────────────────────────────────────┐
│ 👥 Organization Name                          [Edit]   │
│ Description of the organization                        │
│                                                        │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│ │ 5 Members│  │ 12 Proj  │  │ 23 Camp  │  │ 47 Tasks││
│ └──────────┘  └──────────┘  └──────────┘  └─────────┘│
├────────────────────────────────────────────────────────┤
│ [Overview] [Members (5)] [Invites (2)] [Content]      │
├────────────────────────────────────────────────────────┤
│ (Tab Content Area)                                     │
│                                                        │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Overview Tab
- Organization details (name, description, created date)
- Activity section (coming soon)

### Members Tab

```
┌────────────────────────────────────────────────────────┐
│ Team Members                          [+ Invite Member]│
├────────────────────────────────────────────────────────┤
│ 👤 John Doe                           [Owner   ▼] [×] │
│    john@example.com                                    │
├────────────────────────────────────────────────────────┤
│ 👤 Jane Smith (You)                   [Admin]         │
│    jane@example.com                                    │
├────────────────────────────────────────────────────────┤
│ 👤 Bob Johnson                        [Member  ▼] [×] │
│    bob@example.com                                     │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Avatar placeholders
- Email addresses
- Role badges with color coding
- Role dropdown (for admins)
- Remove button (for admins, except owners)
- "You" indicator for current user

### Invites Tab

```
┌────────────────────────────────────────────────────────┐
│ Pending Invitations                    [+ Send Invite] │
├────────────────────────────────────────────────────────┤
│ ✉ alice@example.com                   [Member] [⏱ Pending] [×]│
│   Invited by Jane Smith • Dec 10, 2025                 │
├────────────────────────────────────────────────────────┤
│ ✉ bob@example.com                     [Admin] [⏱ Pending] [×] │
│   Invited by John Doe • Dec 9, 2025                    │
├────────────────────────────────────────────────────────┤
│ Invite History                                         │
├────────────────────────────────────────────────────────┤
│ ✉ charlie@example.com                 [✓ Accepted]    │
│   Dec 5, 2025                                          │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Email addresses
- Inviter name and date
- Role badges
- Status indicators (Pending/Accepted/Declined)
- Cancel button for pending invites
- Historical record of past invites

### Content Tab

```
┌────────────────────────────────────────────────────────┐
│ Organization Content      [Filter: All Members     ▼] │
├────────────────────────────────────────────────────────┤
│ 📁 Projects (12)                                       │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Product Launch                                    │ │
│  │ Launch our new product line                       │ │
│  │ [John Doe] [Jane Smith]                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│ ──────────────────────────────────────────────────────│
│ 🎯 Campaigns (23)                                      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Q4 Marketing Push                                 │ │
│  │ End of year marketing campaign                    │ │
│  │ [Bob Johnson] [Alice Lee]                        │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│ ──────────────────────────────────────────────────────│
│ ✓ Tasks (47)                                           │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Update website copy                               │ │
│  │ Q4 Marketing Push                                 │ │
│  │ [Jane Smith]                                      │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Features:**
- Filter by member dropdown
- Content grouped by type
- Assignment badges on each item
- Hover effects for better UX
- Empty states when no content

## Dialogs

### Edit Organization Dialog

```
┌──────────────────────────────────┐
│ Edit Organization                │
│ Update your organization's...    │
├──────────────────────────────────┤
│ Organization Name:               │
│ [__________________________]     │
│                                  │
│ Description:                     │
│ [__________________________]     │
│ [__________________________]     │
│ [__________________________]     │
│                                  │
│ [Cancel]        [Save Changes]   │
└──────────────────────────────────┘
```

### Invite Member Dialog

```
┌──────────────────────────────────┐
│ Invite Team Member               │
│ Send an invitation to join...    │
├──────────────────────────────────┤
│ Email Address:                   │
│ [colleague@example.com_____]     │
│                                  │
│ Role:                        ▼   │
│ ┌────────────────────────────┐  │
│ │ Member                      │  │
│ │ Can view and edit assigned  │  │
│ │                             │  │
│ │ Admin                       │  │
│ │ Can manage members and all  │  │
│ │                             │  │
│ │ Owner                       │  │
│ │ Full control over org       │  │
│ └────────────────────────────┘  │
│                                  │
│ [Cancel]        [✉ Send Invite]  │
└──────────────────────────────────┘
```

## Permissions

### Member Roles

#### Owner
- **Full Control**: All permissions
- **Edit Organization**: Can update org details
- **Manage Members**: Add, remove, change roles
- **Send Invites**: Can invite new members
- **Cannot Be Removed**: Owners cannot be removed by anyone

#### Admin
- **Manage Members**: Add, remove (except owners), change roles
- **Edit Organization**: Can update org details
- **Send Invites**: Can invite new members
- **View All Content**: See all organization content

#### Member
- **View Organization**: Can see org details and stats
- **View Members**: See who's in the organization
- **View Assigned Content**: See content assigned to them
- **Cannot Manage**: Cannot add/remove members or edit org

### Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Edit Organization | ✅ | ✅ | ❌ |
| View Members | ✅ | ✅ | ✅ |
| Add Members | ✅ | ✅ | ❌ |
| Remove Members | ✅ | ✅ (not owners) | ❌ |
| Change Roles | ✅ | ✅ (not owners) | ❌ |
| Send Invites | ✅ | ✅ | ❌ |
| Cancel Invites | ✅ | ✅ | ❌ |
| View Content | ✅ | ✅ | ✅ (assigned) |
| Assign Users | ✅ | ✅ | ❌ |

## Data Model

### Updated Interfaces

```typescript
// Added assignment fields
interface Project {
  // ... existing fields
  assignedTo?: string[]  // Array of user IDs
  orgId?: string
}

interface Campaign {
  // ... existing fields
  assignedTo?: string[]  // Array of user IDs
  createdBy?: string
  orgId?: string
  completed?: boolean
  archived?: boolean
}

interface Task {
  // ... existing fields
  assignedTo?: string[]  // Array of user IDs
}

// Added id field
interface OrgMember {
  id: string  // NEW - unique member ID
  userId: string
  orgId: string
  role: UserRole
  joinedAt: string
}
```

### Storage Keys

- `orgMembers` - Array of OrgMember objects
- `orgInvites` - Array of OrgInvite objects
- `todoy_users` - Array of User objects (localStorage)

### AuthContext Updates

Added `users` to AuthContext:
```typescript
interface AuthContextType {
  // ... existing fields
  users: User[]  // NEW - all users for member lookup
}
```

## Integration Points

### Sidebar Navigation
- Added "Organization" button with briefcase icon
- Active state tracking
- Conditional display (only if user has organization)

### App.tsx Updates
- Added `'organization'` to `NavigationView` type
- Added `handleNavigateToOrganization` handler
- Added `OrganizationView` rendering
- Integrated with AuthContext for user/org data

### Type System Updates
- Added assignment fields to Project, Campaign, Task
- Added id field to OrgMember
- Updated FilterState for stage filtering

## Usage Examples

### Viewing Your Organization

1. Click **"Organization"** in the sidebar
2. View org details, stats, and members
3. Switch between tabs to see different information

### Inviting a New Member

1. Go to Organization view
2. Click **Members** tab
3. Click **"Invite Member"** button
4. Enter email address
5. Select role (Member/Admin/Owner)
6. Click **"Send Invite"**
7. Invite appears in **Invites** tab as pending

### Managing Member Roles

1. Go to Organization → Members tab
2. Find the member you want to update
3. Click role dropdown next to their name
4. Select new role
5. Role updates immediately

### Removing a Member

1. Go to Organization → Members tab
2. Find the member to remove (cannot be owner)
3. Click the **×** button next to their role
4. Confirm removal
5. Member is removed from organization

### Viewing Team Content

1. Go to Organization → Content tab
2. Use dropdown to filter by member (or view all)
3. Browse projects, campaigns, and tasks
4. See assignment badges on each item

### Filtering by Assignment

In the Content tab:
- Select "All Members" to see everything
- Select a specific member to see only their assigned items
- Assignments are shown as badges under each item

## Assignment Workflow

### How Assignments Work

1. **Creating Items with Assignments**:
   - When creating a project/campaign/task, you can add assignment data
   - Assignments are stored as array of user IDs in `assignedTo` field

2. **Viewing Assignments**:
   - Organization → Content tab shows all assigned users
   - Filter by member to see their workload
   - Badges display assigned user names

3. **Future Enhancement - Assignment UI**:
   - Add user selector to create/edit dialogs
   - Multi-select dropdown for assigning multiple users
   - Quick-assign from organization view

## Visual Design

### Color Coding

**Role Badges:**
- Owner: Yellow (`bg-yellow-500/10 text-yellow-700`)
- Admin: Blue (`bg-blue-500/10 text-blue-700`)
- Member: Gray (`bg-gray-500/10 text-gray-700`)

**Status Indicators:**
- Pending: Orange with clock icon
- Accepted: Green with checkmark
- Declined: Red with X icon

**Icons:**
- Owner: Crown (`Crown` - filled)
- Admin: Shield (`ShieldCheck` - filled)
- Member: User (`User` - outline)

### Responsive Layout

- Stats grid: 4 columns on desktop, stacks on mobile
- Tab navigation: Horizontal scroll on mobile
- Member list: Full-width cards
- Dialogs: Centered, max-width constrained

## Empty States

Each section has helpful empty states:

- **No Organization**: Large icon + message + suggestion
- **No Members**: "No members" message (shouldn't happen)
- **No Invites**: Envelope icon + "No pending invitations"
- **No Content**: Type-specific messages (no projects/campaigns/tasks)

## Error Handling

- **Empty name**: Toast error "Organization name cannot be empty"
- **Empty email**: Toast error "Email cannot be empty"
- **Confirmation dialogs**: For destructive actions (remove member)
- **Success toasts**: Confirmation for all actions

## Future Enhancements

### Short Term
1. **Assignment UI in Edit Dialogs**
   - Multi-select dropdown for assigning users
   - Show current assignments
   - Quick add/remove assignments

2. **Activity Feed**
   - Show recent actions in Overview tab
   - Member joins, role changes, content creation

3. **Search & Sorting**
   - Search members by name/email
   - Sort content by date, name, assignments
   - Filter by multiple criteria

### Medium Term
4. **Join Requests**
   - Public/private organization settings
   - Request to join functionality
   - Approve/reject requests UI

5. **Bulk Operations**
   - Assign multiple people at once
   - Bulk role updates
   - Export member list

6. **Analytics**
   - Member contribution stats
   - Workload distribution
   - Completion rates by member

### Long Term
7. **Teams/Groups**
   - Create sub-teams within organization
   - Group permissions
   - Team-based filtering

8. **Advanced Permissions**
   - Custom roles
   - Granular permissions
   - Project-level permissions

9. **Integration**
   - Email notifications for invites
   - Slack/Teams integration
   - SSO/SAML authentication

## Testing Checklist

- [ ] View organization details
- [ ] Edit organization (admin only)
- [ ] View all members with roles
- [ ] Update member roles
- [ ] Remove member (not owner)
- [ ] Send invitation
- [ ] Cancel pending invitation
- [ ] View invite history
- [ ] Filter content by member
- [ ] View assignments on content items
- [ ] Permission checks (member cannot edit)
- [ ] Empty states display correctly
- [ ] Toasts show for all actions
- [ ] Dialog forms validate input
- [ ] Navigation works from sidebar
- [ ] Active state shows correctly

## Files Modified/Created

### New Files
- `src/components/OrganizationView.tsx` - Main organization management component

### Modified Files
- `src/lib/types.ts` - Added assignment fields and id to OrgMember
- `src/contexts/AuthContext.tsx` - Added users state
- `src/App.tsx` - Added organization navigation and view
- `src/components/Sidebar.tsx` - Added organization navigation button

### Type Updates
```typescript
// Project, Campaign, Task
assignedTo?: string[]  // NEW

// Campaign additions
createdBy?: string
orgId?: string
completed?: boolean
archived?: boolean

// OrgMember
id: string  // NEW
```

## API/Storage Notes

Currently using:
- `useKV` for persistent storage
- `localStorage` for auth data
- In-memory state for UI

For production:
- Replace `useKV` with backend API
- Implement real email sending for invites
- Add database for users/orgs/assignments
- Real-time updates via WebSocket

## Known Limitations

1. **No Assignment UI**: Can only view assignments, not set them (yet)
2. **No Email Sending**: Invites stored but not sent via email
3. **No Real Auth**: Using demo authentication system
4. **No Search**: Cannot search members or content
5. **No Pagination**: All content loads at once
6. **No Activity Log**: Overview tab is placeholder

## Performance Considerations

- **Filtering**: Client-side filtering (fine for small orgs)
- **Assignment Lookups**: O(n) for user name resolution
- **State Updates**: Immutable updates for React optimization
- **Lazy Loading**: Not implemented (needed for large orgs)

## Accessibility

- ✅ Keyboard navigation for all controls
- ✅ ARIA labels on interactive elements
- ✅ Screen reader friendly structure
- ✅ Focus indicators visible
- ✅ Color not sole indicator (icons used)
- ⚠️ Could improve: More descriptive ARIA labels
- ⚠️ Could improve: Announce state changes

## Summary

You now have a fully functional organization management system! You can:
- ✅ View organization details and edit them
- ✅ See all members with their roles
- ✅ Update member roles and remove members
- ✅ Send invitations and manage pending invites
- ✅ View all organization content (projects/campaigns/tasks)
- ✅ Filter content by team member
- ✅ See who is assigned to each item
- ✅ Proper permission checks (admin-only actions)

The foundation is built for assigning people to items - you just need to add the assignment UI to the create/edit dialogs next!
