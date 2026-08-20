# RFIs Page

This page provides a comprehensive interface for managing Requests for Information (RFIs) in the ProjectSight application.

## Features

### Record Toolbar
- **View Counter**: Shows the total number of RFIs being displayed
- **View Selector**: Dropdown to switch between different views (My Custom View, All RFIs, My RFIs)
- **Group Selector**: Options to group RFIs by Status, Assignee, Due Date, etc.
- **Status Filter**: Quick filter by RFI status
- **View Controls**: Toggle between grid and list view modes

### Data View
- **Grid View**: Card-based layout showing RFI details in a 2x3 grid
- **List View**: Compact list format for viewing multiple RFIs
- **RFI Cards Include**:
  - Checkbox for selection
  - RFI number and description
  - Chat bubble icon for communication
  - More options menu
  - Importance level with color coding
  - Due date
  - Open assignments count
  - Assignee information
  - Status indicator with color coding

### Search Panel
- **Search Bar**: Text search across RFI content
- **Assignment Filters**: Toggle switches for "Assigned to me" and "Assigned to my company"
- **Status Filters**: Toggle switches for Draft, Open, and Closed statuses
- **Location Filter**: Dropdown for filtering by building location
- **Due Date Range**: Date inputs for filtering by due date range
- **Linked Specifications**: Filter by related specification documents
- **Advanced Filters**: Multiple dropdowns for filtering by contacts, companies, authors, and disciplines
- **Reset Button**: Clear all applied filters
- **Floating Chat Icon**: Quick access to communication features

## Data Structure

The page uses mock data that includes:
- RFI ID, number, and description
- Importance levels (Normal, High, Low)
- Due dates
- Assignment status
- Current status (Draft, Open, Closed)
- Assignee information

## Navigation

The RFIs page is accessible through:
1. **Main Navigation**: Records → RFIs in the left sidebar
2. **Dashboard**: Links from the RFIs widget and Ball-in-Court workflows widget

## Responsive Design

- **Desktop**: Full three-column layout with search panel
- **Tablet**: Responsive grid that adapts to screen size
- **Mobile**: Stacked layout for smaller screens

## Future Enhancements

- Real-time data integration
- Advanced filtering and sorting
- Bulk operations
- Export functionality
- Integration with document management
- Workflow automation
