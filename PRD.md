# Planning Guide

A comprehensive marketing campaign management application that organizes work hierarchically (Projects → Campaigns → Tasks) with cross-campaign visibility, budget tracking, campaign timelines, and multiple view modes - combining the flexibility of Trello with enterprise campaign management capabilities.

**Experience Qualities**:
1. **Hierarchical** - Organize marketing work from high-level projects down to individual campaigns and tasks, maintaining clear relationships and context
2. **Campaign-Focused** - Purpose-built for marketing teams to track campaign types, stages, budgets, goals, and timelines from planning through follow-up
3. **Unified** - View and filter across all projects and campaigns without silos, while maintaining the ability to drill down into specific initiatives

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a hierarchical project management system with two-level organization (Projects → Campaigns), where campaigns contain tasks organized in lists. Includes campaign-specific features (types, stages, budgets, timelines), cross-campaign aggregation, multiple visualization modes, and comprehensive drag-and-drop functionality throughout the interface.

## Essential Features

### Hierarchical Organization: Projects and Campaigns
- **Functionality**: Two-level hierarchy - Projects contain Campaigns. Campaigns contain Lists of Tasks. Items can be created contextually (create campaign in project view, create task in campaign view), renamed inline, reorganized via drag and drop, and deleted. Campaigns can be moved between projects via drag-and-drop or dropdown menu. Tasks can be moved between campaigns via task detail dialog. Full drag-and-drop support for reordering projects, campaigns, and tasks.
- **Purpose**: Organize marketing work from strategic initiatives down to tactical execution, maintaining clear parent-child relationships with flexibility to reorganize as needs change. Create items in context so they're automatically assigned to the right parent.
- **Trigger**: "New Campaign" button in project view (auto-assigns to project), "Add Task" button in list within campaign view (auto-assigns to campaign), context menus on existing items, inline editing via click or context menu, drag handles on all items, "Move to Project" dropdown in campaign menu, campaign selection in task detail dialog
- **Progression**: Create project → Navigate to project → Click "New Campaign" (auto-assigned to project) → Campaign created and opens → Add lists to campaign → Add tasks to lists (auto-assigned to campaign) → Rename items inline (click or context menu) → Drag campaigns to projects to reassign → Drag tasks between lists → Edit task to change campaign assignment → Visual feedback during all operations
- **Success criteria**: Clear visual hierarchy in sidebar; expandable/collapsible tree structure; campaigns created in project view are automatically assigned to that project; tasks created in campaign lists are automatically assigned to that campaign; ability to drag campaigns onto projects to reassign; dropdown menu in campaigns shows "Move to Project" with all available projects; task detail dialog allows selecting different campaign; drag handles appear on hover; opacity changes during drag (40%); smooth animations on drop; parent-child relationships persist and update correctly

### Campaign Management
- **Functionality**: Campaigns have types (webinar, tradeshow, paid social, content, email, event), stages (planning, in-progress, launched, completed, follow-up), budgets, goals, and multi-phase timelines
- **Purpose**: Track marketing campaigns through their entire lifecycle with campaign-specific metadata and financial tracking
- **Trigger**: Create campaign within a project or standalone, edit campaign details from header
- **Progression**: Create campaign → Set type and stage → Define budget and goals → Set planning/launch/end/follow-up dates → Track progress through stages → Monitor budget vs. actual spend
- **Success criteria**: Campaign type and stage visible in sidebar and header; budget tracking shows percentage used; timeline dates help identify what to work on when; stage updates reflect campaign progress

### Task Management with Drag & Drop
- **Functionality**: Create lists within campaigns, create tasks within lists (auto-assigned to campaign), add subtasks within tasks. Full drag-and-drop: tasks within lists, tasks between lists, tasks between campaigns. Task detail dialog allows reassigning tasks to different campaigns and lists via dropdowns. Tasks support nested subtask lists with completion tracking.
- **Purpose**: Manage action items and tasks that can be organized and reorganized through direct manipulation or explicit reassignment. Break down tasks into granular subtasks for detailed tracking. Maintain flexibility to move tasks as campaign structures evolve.
- **Trigger**: "Add List" within campaign, "Add Task" within list (auto-assigns to campaign), "Add Subtask" within task detail, drag task card to move, task detail dialog to change campaign/list assignment
- **Progression**: Create list → Add tasks (auto-assigned to campaign) → Edit task → Select different campaign/list in dropdowns to reassign → Add subtasks → Check off subtasks → Drag task to reorder within list → Drag task to different list → Drag task to different campaign → Visual feedback shows valid drop zones → Drop completes move → Track subtask progress on task card
- **Success criteria**: Tasks created in campaign lists are automatically assigned to that campaign; task detail dialog provides campaign and list selection dropdowns; changing campaign in dialog automatically updates available lists; tasks can be dragged anywhere with clear visual feedback; drag handles visible on hover; 40% opacity during drag; valid drop zones highlight with accent colors; tasks maintain all properties after move including subtasks; subtask completion shows on task card preview; touch-friendly for mobile

### List Management with Drag & Drop
- **Functionality**: Lists organize tasks within a campaign. Lists can be created, renamed inline, reordered via drag-and-drop, and deleted. Lists show task count and provide drop zones for tasks.
- **Purpose**: Provide flexible organization of tasks within campaigns (e.g., To Do, In Progress, Done or Planning, Execution, Review)
- **Trigger**: "Add List" button in campaign view, list header for inline editing, drag handle in list header
- **Progression**: Create list → Name list → Add tasks → Drag list header to reorder → Visual feedback during drag → Drop to new position → Lists reorder smoothly
- **Success criteria**: List reordering works smoothly; six-dot drag handle appears on hover; cursor changes to grab/grabbing; smooth animations; list order persists; inline editing works for list names

### Budget & Goals Tracking
- **Functionality**: Set budgets and track actual spend at campaign level; define goals and objectives; visual progress indicators
- **Purpose**: Monitor financial performance of campaigns, track ROI, identify budget risks
- **Trigger**: Edit campaign details, view budget in header bar
- **Progression**: Set budget amount → Enter actual spend → View progress bar and percentage → See remaining/over-budget amount → Update as spend changes
- **Success criteria**: Budget progress bars show accurate percentages; over-budget situations clearly flagged; campaign header shows budget summary

### Campaign Timeline & Stage Management
- **Functionality**: Four-phase timeline (Planning Start, Launch Date, End Date, Follow-up Date) plus stage tracking (planning, in-progress, launched, completed, follow-up)
- **Purpose**: Plan when to work on campaigns, track current phase, identify upcoming launches and deadlines, manage post-campaign follow-up
- **Trigger**: Edit campaign details to set dates and stage
- **Progression**: Set planning start → Work during planning stage → Update stage to in-progress → Set launch date → Update stage to launched → Campaign runs → Set end date → Update to completed → Set follow-up date → Handle follow-up items → Mark completed
- **Success criteria**: Timeline dates visible in campaign header; stages accurately reflect current phase; visual indicators show stage status; dates help prioritize what needs attention now vs. future

### Cross-Campaign Unified View
- **Functionality**: Toggle to view all tasks from all campaigns in a single aggregated kanban or calendar view
- **Purpose**: Break down campaign silos to see all work holistically, identifying patterns and priorities across projects
- **Trigger**: "All Campaigns" toggle in header or dedicated view mode
- **Progression**: Toggle all campaigns view → See aggregated tasks grouped by status/date → Filter by campaign/label/date → Click task to edit → Task updates reflect in source campaign
- **Success criteria**: All tasks from all campaigns appear correctly; filters work across the entire dataset; changes sync to source campaigns; performance remains smooth with 100+ tasks

### Kanban View with Comprehensive Drag & Drop
- **Functionality**: Visual board with draggable columns (lists) and tasks. Full drag and drop support for tasks within lists, tasks between lists, tasks between campaigns, list reordering within campaigns, and campaign reordering in sidebar.
- **Purpose**: Primary workflow visualization showing tasks moving through stages with intuitive direct manipulation
- **Trigger**: Default view when opening a campaign or selecting kanban view mode
- **Progression**: View campaign → See lists as columns → See tasks in lists → Drag tasks within same list to reorder → Drag tasks between lists to move → Drag tasks between campaigns → Drag lists to reorder columns → Drag campaigns in sidebar to reorganize → Click task for details → Visual feedback during all drag operations (opacity, hover states, drop indicators)
- **Success criteria**: All drag and drop operations work smoothly with visual feedback (opacity changes, hover states, drop indicators); tasks update position immediately; list order persists; campaign order in sidebar persists; mobile-friendly touch interactions; drag handles visible on hover; cursor changes appropriately (grab/grabbing)

### Calendar View
- **Functionality**: Month calendar displaying tasks on their due dates
- **Purpose**: Visualize work by timeline, identify deadline clustering, and manage time-based priorities
- **Trigger**: Calendar icon in view switcher
- **Progression**: Switch to calendar view → See current month with tasks on due dates → Click date to see all tasks → Click task to edit → Navigate months → Filter by campaign/label
- **Success criteria**: Tasks appear on correct dates; tasks without dates show in "unscheduled" area; multiple tasks per date are visible; navigation between months is smooth

### Advanced Filtering
- **Functionality**: Filter tasks by campaign, list, label, due date, and search text across all views
- **Purpose**: Surface specific subsets of work without losing context of the larger system
- **Trigger**: Filter panel toggle in header
- **Progression**: Click filter icon → Select filter criteria (campaign/label/date range) → View updates instantly → Multiple filters combine (AND logic) → Clear filters to reset
- **Success criteria**: Filters apply to current view (kanban/calendar); filter state persists during session; filter combinations work logically; filter count badge shows active filters

### Labels & Tags
- **Functionality**: Create custom labels with colors, assign to tasks, filter by labels
- **Purpose**: Categorize work by type, priority, department, or any custom taxonomy
- **Trigger**: Label selector in task edit dialog
- **Progression**: Edit task → Click labels → Create new label with name/color → Select labels to assign → Labels appear on task → Filter by label in any view
- **Success criteria**: Labels are color-coded and visible; labels are reusable across tasks; label filtering works in all views; label colors follow design system

## Edge Case Handling

- **Empty States**: Helpful illustrations and CTAs when campaigns, lists, or tasks are empty, guiding users to create their first items; empty lists show "Drop tasks here" message during drag operations
- **Task with No Due Date**: Calendar view shows "Unscheduled" section for tasks without dates; they still appear in kanban views
- **Deleting Campaign with Tasks**: Confirmation dialog warns about data loss; option to archive instead of permanent delete
- **Drag Over Mobile**: Touch-and-hold to activate drag mode on mobile; visual feedback shows draggable state
- **Filter No Results**: Clear message showing active filters and option to clear them when no tasks match
- **Long Task Titles**: Truncate with ellipsis in compact views, show full title in detail dialog and on hover
- **Many Labels on Task**: Show first 2-3 labels with "+N more" indicator; expand in detail view
- **Cross-Campaign Task Move**: When dragging tasks between lists from different campaigns, task automatically updates its campaign association and appears in the new campaign's context. Task detail dialog also allows explicit campaign reassignment via dropdown with automatic list update.
- **Campaign Project Assignment**: Campaigns can be moved between projects via drag-and-drop (drag campaign onto project in sidebar) or via dropdown menu ("Move to Project" shows all available projects). Campaigns can also be removed from projects to become standalone. Visual feedback (accent background) shows valid drop target when dragging campaign over project.
- **Task Campaign Assignment**: Tasks are automatically assigned to the campaign of the list they're created in. Tasks can be reassigned to different campaigns via the task detail dialog, which provides a campaign dropdown and automatically updates the available lists based on selected campaign.
- **Contextual Creation**: Creating a campaign while viewing a project automatically assigns it to that project. Creating a task in a list automatically assigns it to the campaign that owns the list. This reduces manual assignment steps and prevents orphaned items.
- **List Reordering Across Campaigns**: Lists can only be reordered within the same campaign; dragging a list to a different campaign's list is prevented
- **Campaign Reordering Hierarchy**: Campaigns can only be reordered within their sibling group (same project or standalone); campaigns within projects stay together
- **Drag Visual Feedback**: Clear opacity changes (40%) and cursor changes (grab/grabbing) indicate draggable state; drop zones highlight with accent colors when valid; invalid drop targets don't highlight
- **Simultaneous Drags**: System handles only one drag operation at a time; optimistic UI updates ensure smooth experience

## Design Direction

The design should evoke **professional focus and systematic organization** - a tool that feels powerful yet approachable. The GitHub-inspired aesthetic means clean layouts, subtle borders, muted backgrounds, and content-first design. It should feel like a developer's tool: precise, logical, and uncluttered. Moments of color come from labels and status indicators, not decorative flourishes.

## Color Selection

A refined, professional palette inspired by GitHub's interface - neutral backgrounds with strategic pops of color for semantic meaning and labels.

- **Primary Color**: Deep Slate `oklch(0.25 0.015 250)` - Conveys professionalism and structure, used for primary actions and headers
- **Secondary Colors**: 
  - Subtle Gray `oklch(0.96 0.002 250)` - For backgrounds and surfaces
  - Medium Gray `oklch(0.70 0.01 250)` - For secondary text and borders
  - Light Slate `oklch(0.85 0.01 250)` - For hover states and inactive elements
- **Accent Color**: Vibrant Blue `oklch(0.55 0.18 250)` - For CTAs, active states, and focus indicators
- **Label Colors**: 
  - Red `oklch(0.60 0.20 25)` - High priority
  - Orange `oklch(0.70 0.15 60)` - Medium priority
  - Green `oklch(0.65 0.15 150)` - Low priority / Complete
  - Purple `oklch(0.60 0.15 290)` - Feature
  - Blue `oklch(0.60 0.15 250)` - Bug
  - Teal `oklch(0.65 0.12 200)` - Design
- **Foreground/Background Pairings**:
  - Background (Subtle Gray #F6F8FA): Foreground (Deep Slate #24292F) - Ratio 11.7:1 ✓
  - Primary (Deep Slate #24292F): White text (#FFFFFF) - Ratio 14.3:1 ✓
  - Accent (Vibrant Blue #0969DA): White text (#FFFFFF) - Ratio 4.9:1 ✓
  - Card (White #FFFFFF): Foreground (Deep Slate #24292F) - Ratio 15.1:1 ✓

## Font Selection

Typography should convey clarity and hierarchy while maintaining GitHub's systematic aesthetic - the combination should feel technical yet readable.

- **Primary Font**: Inter - Clean, highly legible, excellent for UI and data-dense interfaces
- **Monospace Font**: JetBrains Mono - For card IDs, timestamps, and technical metadata

- **Typographic Hierarchy**:
  - H1 (Board Title): Inter SemiBold / 24px / -0.02em letter spacing / 130% line height
  - H2 (Section Headers): Inter Medium / 18px / -0.01em letter spacing / 140% line height
  - H3 (Card Title): Inter Medium / 15px / normal letter spacing / 140% line height
  - Body (Card Description): Inter Regular / 14px / normal letter spacing / 160% line height
  - Caption (Metadata): Inter Regular / 12px / normal letter spacing / 140% line height
  - Mono (IDs): JetBrains Mono Regular / 13px / normal letter spacing / 140% line height

## Animations

Animations should reinforce the systematic, tool-like nature of the interface - precise and purposeful, never playful or bouncy. Focus on functional transitions that guide the user's eye and provide feedback.

- **Card Drag**: Opacity reduction to 40% during drag with cursor change to grabbing; smooth snap into position on drop with visual indicator showing target position; hover over valid drop zones shows accent border (200ms ease-out)
- **List Drag**: Six-dot drag handle visible on hover; opacity reduction during drag; drop zones highlight with ring; smooth reordering animation (200ms ease-out)
- **Board Drag**: Six-dot drag handle in sidebar items; subtle opacity change during drag; drop target highlighting; immediate position update on drop
- **View Transitions**: Quick fade-slide when switching between kanban/calendar views (250ms)
- **Filter Panel**: Slide-in from right with backdrop fade (200ms ease-out)
- **Card Details**: Dialog scales in from center with backdrop fade (200ms)
- **List Hover**: Gentle background color shift (150ms) to indicate interactivity
- **Button States**: Quick color transitions on hover/press (100ms) for immediate feedback
- **Drag Over States**: Target lists/cards show accent border when card is dragged over them, providing clear visual feedback of drop destination

## Component Selection

- **Components**:
  - **Dialog**: For card detail editing, confirmation prompts, and board creation forms
  - **Sheet**: Right-side panel for advanced filtering options
  - **Card**: Foundation for kanban cards, board cards in sidebar
  - **Button**: Primary actions (New Board, Add Card) with variants for secondary actions
  - **Input & Textarea**: Card title/description editing, board names
  - **Select**: List selection when moving cards, board selection in filters
  - **Badge**: Labels on cards, filter count indicators
  - **Popover**: Quick label picker, date picker for due dates
  - **Calendar** (from react-day-picker): Date selection in card editing and calendar view
  - **Dropdown Menu**: Context menus for board/list/card actions (edit, delete, archive)
  - **Separator**: Visual division between sidebar sections and filter groups
  - **Tabs**: View mode switcher (Kanban / Calendar) when appropriate
  - **Scroll Area**: For long lists of cards or boards in sidebar
  - **Tooltip**: Hover details for truncated text, icon buttons

- **Customizations**:
  - **Draggable Card Component**: Custom wrapper around Card using framer-motion for drag interactions
  - **Calendar Grid Component**: Custom month view showing cards as small badges on dates
  - **Board Selector**: Custom multi-select component for cross-board filtering
  - **Empty State Component**: Illustration + CTA for empty boards/lists/filtered views
  - **Label Color Picker**: Custom color grid for creating labels

- **States**:
  - **Buttons**: Default with subtle border, hover with background shift, active with slight scale-down, disabled with opacity reduction
  - **Cards**: Rest state with border, hover with shadow lift and cursor pointer, dragging with 40% opacity and grabbing cursor, drag-over state with accent border indicator, selected with accent border
  - **Inputs**: Default with border, focus with accent ring and border color change, error with destructive color, disabled with muted appearance
  - **Lists**: Hover with background tint, dragging with 40% opacity, drag-over with accent ring (2px), cursor grab on hover over header, cursor grabbing when dragging
  - **Boards (Sidebar)**: Hover shows drag handle, dragging with 40% opacity, cursor grab on hover, smooth reordering with immediate visual feedback
  - **Drag Handles**: Six-dot icons that appear on hover, indicating draggable elements; change cursor to grab/grabbing

- **Icon Selection**:
  - **Plus** (Plus): Add board, list, card
  - **Calendar** (CalendarBlank): Calendar view toggle, due date indicator
  - **Kanban** (Columns): Kanban view toggle
  - **Funnel** (FunnelSimple): Filter panel toggle
  - **Tag** (Tag): Labels section
  - **DotsThree** (DotsThreeVertical): Context menu trigger
  - **DotsSixVertical** (DotsSixVertical): Drag handles for lists and boards
  - **X** (X): Close dialogs, remove filters
  - **Check** (Check): Complete status
  - **Clock** (Clock): Due date indicator
  - **MagnifyingGlass** (MagnifyingGlass): Search functionality
  - **ArrowLeft/Right** (CaretLeft/CaretRight): Calendar navigation, collapsible sections

- **Spacing**:
  - Container padding: `p-6` (24px) for main views
  - Card padding: `p-4` (16px) internally
  - Card gaps: `gap-3` (12px) between cards in list
  - List gaps: `gap-4` (16px) between lists in board
  - Section gaps: `gap-6` (24px) between major sections
  - Button padding: `px-4 py-2` (16px x 8px) for primary buttons

- **Mobile**:
  - Sidebar collapses to bottom sheet navigation on mobile (<768px)
  - Kanban view switches to vertical scrolling list of lists (stack columns)
  - Calendar view maintains month grid but with smaller cards/badges
  - Filter sheet takes full screen on mobile
  - Card details dialog becomes full-screen sheet on mobile
  - Touch-friendly drag with long-press activation (500ms)
  - Minimum touch target 44x44px for all interactive elements
  - Reduce padding to `p-4` for containers, `p-3` for cards on mobile
