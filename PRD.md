# Planning Guide

A comprehensive marketing campaign management application that organizes work hierarchically (Projects → Campaigns → Action Items) with cross-board visibility, budget tracking, campaign timelines, and multiple view modes - combining the flexibility of Trello with enterprise campaign management capabilities.

**Experience Qualities**:
1. **Hierarchical** - Organize marketing work from high-level projects down to individual campaigns and action items, maintaining clear relationships and context
2. **Campaign-Focused** - Purpose-built for marketing teams to track campaign types, stages, budgets, goals, and timelines from planning through follow-up
3. **Unified** - View and filter across all projects and campaigns without silos, while maintaining the ability to drill down into specific initiatives

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a hierarchical project management system with three-level organization (projects/campaigns/boards), campaign-specific features (types, stages, budgets, timelines), cross-board aggregation, multiple visualization modes, and comprehensive tracking of marketing initiatives from planning through completion.

## Essential Features

### Hierarchical Board Organization
- **Functionality**: Three-level hierarchy - Projects contain Campaigns, Campaigns contain Boards (action item boards)
- **Purpose**: Organize marketing work from strategic initiatives down to tactical execution, maintaining clear parent-child relationships
- **Trigger**: "New Project" or "New Campaign" buttons in sidebar, context menus on existing items
- **Progression**: Create project → Expand project in sidebar → Add campaigns to project → Expand campaign → Add boards to campaign → Navigate between levels
- **Success criteria**: Clear visual hierarchy in sidebar; expandable/collapsible tree structure; ability to move cards between any board; parent-child relationships persist

### Campaign Management
- **Functionality**: Campaigns have types (webinar, tradeshow, paid social, content, email, event), stages (planning, in-progress, launched, completed, follow-up), budgets, goals, and multi-phase timelines
- **Purpose**: Track marketing campaigns through their entire lifecycle with campaign-specific metadata and financial tracking
- **Trigger**: Create campaign within a project, edit campaign details from header
- **Progression**: Create campaign → Set type and stage → Define budget and goals → Set planning/launch/end/follow-up dates → Track progress through stages → Monitor budget vs. actual spend
- **Success criteria**: Campaign type and stage visible in sidebar and header; budget tracking shows percentage used; timeline dates help identify what to work on when; stage updates reflect campaign progress

### Board & Card Management with Cross-Board Movement
- **Functionality**: Create boards (as standalone or within campaigns), create lists within boards, create cards within lists, move cards between any list/board
- **Purpose**: Manage action items and tasks that can be organized hierarchically or standalone, with flexibility to reorganize
- **Trigger**: "Add Board" button, "Add List" within board, "Add Card" within list
- **Progression**: Create board → Add lists → Add cards → Edit card → Change board/list via dropdown → Card moves to new location → View card in new context
- **Success criteria**: Cards can move between any boards regardless of hierarchy; board/list selection in card editor shows all options; moved cards maintain all properties; visual feedback confirms movement

### Budget & Goals Tracking
- **Functionality**: Set budgets and track actual spend at both campaign and card levels; define goals and objectives; visual progress indicators
- **Purpose**: Monitor financial performance of campaigns and individual initiatives, track ROI, identify budget risks
- **Trigger**: Edit campaign/card details, view budget in header bar
- **Progression**: Set budget amount → Enter actual spend → View progress bar and percentage → See remaining/over-budget amount → Update as spend changes
- **Success criteria**: Budget progress bars show accurate percentages; over-budget situations clearly flagged; campaign header shows budget summary; card budgets roll up conceptually to campaign view

### Campaign Timeline & Stage Management
- **Functionality**: Four-phase timeline (Planning Start, Launch Date, End Date, Follow-up Date) plus stage tracking (planning, in-progress, launched, completed, follow-up)
- **Purpose**: Plan when to work on campaigns, track current phase, identify upcoming launches and deadlines, manage post-campaign follow-up
- **Trigger**: Edit campaign details to set dates and stage
- **Progression**: Set planning start → Work during planning stage → Update stage to in-progress → Set launch date → Update stage to launched → Campaign runs → Set end date → Update to completed → Set follow-up date → Handle follow-up items → Mark completed
- **Success criteria**: Timeline dates visible in campaign header; stages accurately reflect current phase; visual indicators show stage status; dates help prioritize what needs attention now vs. future

### Cross-Board Unified View
- **Functionality**: Toggle to view all cards from all boards in a single aggregated kanban or calendar view
- **Purpose**: Break down board silos to see all work holistically, identifying patterns and priorities across projects
- **Trigger**: "All Boards" toggle in header or dedicated view mode
- **Progression**: Toggle all boards view → See aggregated cards grouped by status/date → Filter by board/label/date → Click card to edit → Card updates reflect in source board
- **Success criteria**: All cards from all boards appear correctly; filters work across the entire dataset; changes sync to source boards; performance remains smooth with 100+ cards

### Kanban View
- **Functionality**: Visual board with draggable columns (lists) and cards
- **Purpose**: Primary workflow visualization showing cards moving through stages
- **Trigger**: Default view when opening a board or selecting kanban view mode
- **Progression**: View board → See lists as columns → See cards in lists → Drag cards between lists → Drag lists to reorder → Click card for details
- **Success criteria**: Drag and drop works smoothly; visual feedback during drag; cards update position immediately; mobile-friendly touch interactions

### Calendar View
- **Functionality**: Month calendar displaying cards on their due dates
- **Purpose**: Visualize work by timeline, identify deadline clustering, and manage time-based priorities
- **Trigger**: Calendar icon in view switcher
- **Progression**: Switch to calendar view → See current month with cards on due dates → Click date to see all cards → Click card to edit → Navigate months → Filter by board/label
- **Success criteria**: Cards appear on correct dates; cards without dates show in "unscheduled" area; multiple cards per date are visible; navigation between months is smooth

### Advanced Filtering
- **Functionality**: Filter cards by board, list, label, due date, and search text across all views
- **Purpose**: Surface specific subsets of work without losing context of the larger system
- **Trigger**: Filter panel toggle in header
- **Progression**: Click filter icon → Select filter criteria (board/label/date range) → View updates instantly → Multiple filters combine (AND logic) → Clear filters to reset
- **Success criteria**: Filters apply to current view (kanban/calendar); filter state persists during session; filter combinations work logically; filter count badge shows active filters

### Labels & Tags
- **Functionality**: Create custom labels with colors, assign to cards, filter by labels
- **Purpose**: Categorize work by type, priority, department, or any custom taxonomy
- **Trigger**: Label selector in card edit dialog
- **Progression**: Edit card → Click labels → Create new label with name/color → Select labels to assign → Labels appear on card → Filter by label in any view
- **Success criteria**: Labels are color-coded and visible; labels are reusable across cards; label filtering works in all views; label colors follow design system

## Edge Case Handling

- **Empty States**: Helpful illustrations and CTAs when boards, lists, or cards are empty, guiding users to create their first items
- **Card with No Due Date**: Calendar view shows "Unscheduled" section for cards without dates; they still appear in kanban views
- **Deleting Board with Cards**: Confirmation dialog warns about data loss; deleted boards are archived (soft delete) for potential recovery
- **Drag Over Mobile**: Touch-and-hold to activate drag mode on mobile; visual feedback shows draggable state
- **Filter No Results**: Clear message showing active filters and option to clear them when no cards match
- **Long Card Titles**: Truncate with ellipsis in compact views, show full title in detail dialog and on hover
- **Many Labels on Card**: Show first 2-3 labels with "+N more" indicator; expand in detail view
- **Cross-Board Card Move**: When viewing all boards, dragging a card to a different board's list prompts confirmation or shows origin board indicator

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

- **Card Drag**: Subtle lift with shadow increase during drag; smooth snap into position on drop (200ms ease-out)
- **View Transitions**: Quick fade-slide when switching between kanban/calendar views (250ms)
- **Filter Panel**: Slide-in from right with backdrop fade (200ms ease-out)
- **Card Details**: Dialog scales in from center with backdrop fade (200ms)
- **List Hover**: Gentle background color shift (150ms) to indicate interactivity
- **Button States**: Quick color transitions on hover/press (100ms) for immediate feedback

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
  - **Cards**: Rest state with border, hover with shadow lift, dragging with elevated shadow and rotation, selected with accent border
  - **Inputs**: Default with border, focus with accent ring and border color change, error with destructive color, disabled with muted appearance
  - **Lists**: Hover with background tint, drag-over with accent border and background highlight

- **Icon Selection**:
  - **Plus** (Plus): Add board, list, card
  - **Calendar** (CalendarBlank): Calendar view toggle, due date indicator
  - **Kanban** (Columns): Kanban view toggle
  - **Funnel** (FunnelSimple): Filter panel toggle
  - **Tag** (Tag): Labels section
  - **DotsThree** (DotsThreeVertical): Context menu trigger
  - **X** (X): Close dialogs, remove filters
  - **Check** (Check): Complete status
  - **Clock** (Clock): Due date indicator
  - **MagnifyingGlass** (MagnifyingGlass): Search functionality
  - **ArrowLeft/Right** (CaretLeft/CaretRight): Calendar navigation

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
