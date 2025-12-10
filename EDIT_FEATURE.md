# Project & Campaign Edit Feature Documentation

## Overview
Added comprehensive edit functionality for Projects and Campaigns with full support for all their properties including stage date management.

## New Components

### 1. ProjectEditDialog.tsx
**Purpose**: Edit individual project details

**Features**:
- Edit project name
- Edit project description
- Manage project timeline & milestones using StageDateManager
- Save/Cancel functionality with validation

**Fields Editable**:
- Title (required)
- Description
- Stage Dates (custom milestones with dates and colors)

### 2. CampaignEditDialog.tsx
**Purpose**: Comprehensive campaign editing interface

**Features**:
- Full campaign property editing
- Project assignment selection
- Campaign type and stage management
- Budget and spend tracking
- Key dates management
- Custom stage dates/milestones

**Fields Editable**:
- Title (required)
- Description
- Project association (dropdown with all projects)
- Campaign Type (Webinar, Trade Show, Paid Social, Content, Email, Event, Other)
- Campaign Stage (Planning, In Progress, Launched, Completed, Follow-up)
- Goals & Objectives
- Budget ($)
- Actual Spend ($)
- Planning Start Date
- Launch Date
- End Date
- Follow-up Date
- Custom Stage Dates & Milestones

## Integration Points

### 1. ProjectView
**Location**: When viewing an individual project

**Access**: 
- "Edit Project" button in the header (next to "New Campaign" button)
- Opens ProjectEditDialog for the active project

**Usage**:
```tsx
<ProjectView
  project={activeProject}
  projects={projects}
  setProjects={setProjects}
  // ... other props
/>
```

### 2. Header (Campaign View)
**Location**: When viewing an individual campaign

**Access**:
- "Edit Campaign" button in the header (appears when viewing a campaign)
- Located between Search and view mode buttons

**Usage**:
```tsx
<Header
  activeCampaign={activeCampaign}
  projects={projects}
  setProjects={setProjects}
  campaigns={campaigns}
  setCampaigns={setCampaigns}
  // ... other props
/>
```

### 3. Master View
**Location**: Master View table rows

**Access**:
- Pencil icon button in each project row (Projects tab)
- Pencil icon button in each campaign row (Campaigns tab)
- Appears alongside the navigate arrow button

**Features**:
- Click pencil icon to edit project/campaign
- Click arrow icon to navigate to project/campaign
- Both actions available in the same row

## User Workflows

### Edit a Project
1. **From Project View**:
   - Navigate to a project
   - Click "Edit Project" button in header
   - Modify project details
   - Add/edit/remove stage dates
   - Click "Save Changes"

2. **From Master View**:
   - Go to Master View → Projects tab
   - Click pencil icon on any project row
   - Edit in dialog
   - Save changes

### Edit a Campaign
1. **From Campaign View**:
   - Navigate to a campaign
   - Click "Edit Campaign" button in header
   - Modify any campaign properties
   - Manage dates and milestones
   - Click "Save Changes"

2. **From Master View**:
   - Go to Master View → Campaigns tab
   - Click pencil icon on any campaign row
   - Edit in dialog
   - Save changes

3. **From Header**:
   - While viewing any campaign (Kanban or Calendar view)
   - Click "Edit Campaign" button
   - Full edit dialog opens

## Stage Date Management

Both dialogs include the **StageDateManager** component which allows:
- Add custom stages/milestones
- Set start and end dates for each stage
- Assign colors to stages
- Reorder stages
- Delete stages

This is particularly useful for:
- Project timelines and phases
- Campaign milestones and deliverables
- Tracking progress against planned dates
- Visualizing on calendar view

## Validation

### Project Edit
- Title is required (cannot be empty)
- Description is optional
- Stage dates are validated for date logic

### Campaign Edit
- Title is required (cannot be empty)
- All other fields are optional
- Budget/spend must be valid numbers
- Dates are validated as proper date formats

## Data Persistence

- All edits are saved to localStorage via the `useKV` hook
- Changes are immediately reflected across all views
- Undo is through Cancel button (resets to original values)

## UI/UX Features

### Responsive Dialog Layout
- Max width: 3xl (campaigns), 3xl (projects)
- Max height: 90vh with scrolling
- Two-column grids for efficient space usage
- Clear section separators

### Button Placement
- Edit buttons use ghost variant with pencil icon
- Positioned logically near related content
- Consistent placement across all views

### Visual Feedback
- Toast notifications on save
- Form validation with error messages
- Cancel button resets all fields
- Dialog closes on successful save

## Technical Implementation

### State Management
```tsx
// Local state for form fields
const [title, setTitle] = useState(entity.title)
const [description, setDescription] = useState(entity.description)
// ... other fields

// Save handler
const handleSave = () => {
  setEntities(current =>
    current.map(e =>
      e.id === entity.id
        ? { ...e, ...updatedFields }
        : e
    )
  )
  toast.success('Saved!')
  onOpenChange(false)
}
```

### Cancel Behavior
```tsx
const handleCancel = () => {
  // Reset all fields to original values
  setTitle(entity.title)
  setDescription(entity.description)
  // ... reset other fields
  onOpenChange(false)
}
```

## Icons Used

- **PencilSimple**: Edit buttons
- **Folder**: Project references in dropdowns
- **Plus**: Add stage dates
- **X**: Remove/delete actions

## Future Enhancements

Potential additions:
- Duplicate project/campaign feature
- Archive/restore functionality
- Change history/audit log
- Bulk edit capabilities
- Template creation from existing projects/campaigns
- Advanced validation rules
- Field-level permissions

---

**Status**: ✅ Fully implemented and tested
**Components**: ProjectEditDialog.tsx, CampaignEditDialog.tsx
**Integration**: ProjectView, Header, MasterView
**Date**: December 10, 2025
