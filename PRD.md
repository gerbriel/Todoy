# Planning Guide

A comprehensive project management application that unifies kanban boards with cross-board filtering and multiple view modes, combining the simplicity of Trello with the power of enterprise tools like Monday and Wrike in a GitHub-inspired aesthetic.

**Experience Qualities**:
1. **Unified** - Seamlessly view and manage cards across all boards without siloed limitations, giving users a holistic view of their work
2. **Flexible** - Switch between kanban and calendar views effortlessly, with powerful filtering to surface exactly what matters
3. **Clean** - GitHub-inspired interface that feels professional and focused, removing visual noise to emphasize content

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
This is a multi-view project management system with cross-board aggregation, multiple visualization modes, advanced filtering, and comprehensive CRUD operations across boards, lists, and cards.

## Essential Features

### Board Management
- **Functionality**: Create, edit, archive, and delete project boards with custom names and descriptions
- **Purpose**: Organize work into separate contexts (projects, teams, workflows) while maintaining the ability to view across them
- **Trigger**: "New Board" button in sidebar or empty state
- **Progression**: Click new board → Enter board name/description → Board created and appears in sidebar → Navigate to board
- **Success criteria**: Multiple boards can be created, renamed, and deleted; boards persist between sessions; active board is visually indicated

### List Management within Boards
- **Functionality**: Create, reorder, rename, and delete lists (columns) within each board
- **Purpose**: Define workflow stages or categories for cards (e.g., To Do, In Progress, Done)
- **Trigger**: "Add List" button within a board view
- **Progression**: Click add list → Enter list name → List appears as new column → Drag to reorder lists → Cards can be added to list
- **Success criteria**: Lists can be added/removed/reordered within boards; list changes persist; empty lists display helpful prompts

### Card Management
- **Functionality**: Create, edit, move, and delete cards with title, description, due date, and labels
- **Purpose**: Represent individual tasks or items that move through workflow stages
- **Trigger**: "Add Card" button within a list or quick-add from any view
- **Progression**: Click add card → Enter card details (title required, description/date/labels optional) → Card appears in list → Drag between lists → Click to edit → Delete from card detail view
- **Success criteria**: Cards contain rich data; cards can be moved between lists and boards; card changes save automatically; due dates and labels are filterable

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
