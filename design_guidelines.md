# Design Guidelines: Ecology Data Processing Platform

## Design Approach
**Design System: Material Design 3** - Selected for its robust data-dense application patterns, excellent table/form components, and professional scientific tool aesthetic.

## Core Design Principles
1. **Data First**: Information hierarchy prioritizes readability and scannability
2. **Professional Clarity**: Clean, clinical interface appropriate for scientific workflows
3. **Operational Efficiency**: Minimize clicks, maximize information density
4. **Consistent Predictability**: Standard patterns throughout for rapid learning

## Typography System
- **Primary Font**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for file names, IDs, timestamps)

**Hierarchy:**
- Page Titles: text-2xl font-semibold
- Section Headers: text-lg font-medium
- Card Titles: text-base font-medium
- Body Text: text-sm
- Captions/Meta: text-xs text-gray-600
- Data Tables: text-sm tabular-nums (for metrics)
- File paths/names: text-xs font-mono

## Layout System
**Spacing Primitives**: Tailwind units 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section gaps: gap-4 to gap-8
- Page margins: p-6 to p-8

**Layout Structure:**
- Sidebar: Fixed 64px width (collapsed) / 240px (expanded), dark theme
- Topbar: h-16, white background, border-b
- Content area: max-w-7xl mx-auto with p-6 to p-8
- Cards: rounded-lg border shadow-sm with p-4 to p-6

## Component Library

### Navigation
- **Sidebar**: Icon-only collapsed state with tooltips, full labels when expanded
- **Active States**: Accent background (blue-50) with blue-600 border-l-4
- **Icons**: Use Heroicons outline style, 20px size

### Data Display
- **KPI Cards**: Grid layout (grid-cols-4), white background, subtle border, p-4 spacing
  - Large metric: text-3xl font-bold
  - Label: text-sm text-gray-600
  - Change indicator: small pill with +/- and arrow icon
  
- **Tables**: Striped rows (even:bg-gray-50), sticky headers, hover:bg-gray-100
  - Header: bg-gray-50 font-medium text-xs uppercase
  - Cell padding: px-4 py-3
  - Row actions: Icons appear on hover, right-aligned

- **Status Pills**: Rounded-full px-3 py-1 text-xs font-medium
  - RUNNING: bg-blue-100 text-blue-700
  - SUCCEEDED: bg-green-100 text-green-700
  - FAILED: bg-red-100 text-red-700
  - PENDING: bg-gray-100 text-gray-700

### Forms & Inputs
- **File Upload**: Dashed border-2 border-gray-300 rounded-lg, drag-over:border-blue-500 bg-blue-50
  - Icon: Upload cloud icon (Heroicons)
  - Instructions: text-sm text-gray-600
  - File list: mt-4 with file icon, name, size, remove button

- **Inputs**: h-10 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500
- **Buttons Primary**: bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md
- **Buttons Secondary**: border border-gray-300 hover:bg-gray-50

### Charts & Visualizations
- **Recharts Color Palette**: 
  - Primary: #2563eb (blue-600)
  - Secondary: #10b981 (emerald-500)
  - Tertiary: #f59e0b (amber-500)
  - Quaternary: #8b5cf6 (violet-500)
  
- **Chart Containers**: White card with p-6, min-h-[320px]
- **Chart Titles**: text-base font-medium mb-4

### Maps (Leaflet)
- **Map Container**: rounded-lg overflow-hidden border, h-[500px]
- **Popups**: Clean white with p-2, text-sm
  - Bold species name
  - Gray metadata (address, date)
- **Controls**: Top-right positioning with white bg, shadow-md

### Artifacts Section
- **List Layout**: Space-y-2 with hover:bg-gray-50
- **File Icons**: Document icon (Heroicons) with file extension badge
- **Metadata**: Inline text-xs text-gray-500 (size, modified date)
- **Actions**: Icon buttons (download, preview) right-aligned

### QC Flags Table
- **Flag Type Column**: Colored dot indicator + label
- **Action Buttons**: Small icon buttons (check, x-circle, comment)
- **Comment Modal**: Simple dialog with textarea, cancel/submit buttons
- **Filters**: Top toolbar with search input and dropdown filters

## Page-Specific Layouts

**Login**: Centered card (max-w-md) on light gray background, logo at top, form below

**Projects**: Grid of project cards (grid-cols-3), each with name, description, metadata, "Select" button

**Upload & Run**: Two-column layout - left: file uploads, right: run configuration and logs panel

**Jobs**: Full-width table with search/filter toolbar above

**Results**: KPI cards row → Charts section (2-column grid) → Tables section → Artifacts list

**GIS**: Map full-width at top (h-[500px]) → Artifact list below in 2 columns

**Reports**: Left: template selector + form, Right: report history list

**Admin**: Tab navigation (Health, Users, Settings) with corresponding panels

## No Animations
Static interface throughout - no transitions, fades, or loading animations beyond basic spinners.

## Images
No hero images. This is a utilitarian data platform. Only functional imagery: file type icons, status indicators, map tiles.