# Query & Business Rule Alignment Checker (Next.js + MUI + Ant Design)

A modern Next.js web tool to validate SQL queries against defined business rules using Material-UI and Ant Design components.

## Features

- **Next.js Framework**: Server-side rendering and modern React patterns
- **Material-UI (MUI)**: Beautiful, professional UI components
- **Ant Design (antd)**: Enterprise-grade UI components for data-heavy operations
- **Multiple Checkers**: Create and manage multiple query-rule pairs simultaneously
- **Flexible Input Modes**:
  - SQL Query input
  - Raw condition/WHERE clause parsing
- **Bulk Import**: Paste business rules from Excel (tab-separated or space-separated)
- **Visual Reports**: Alignment scores, matched rules, and identified issues
- **Responsive Design**: Works seamlessly on desktop and mobile

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **Material-UI (MUI 5)** - Component library
- **Ant Design 5** - Enterprise UI components
- **Emotion** - CSS-in-JS styling for MUI

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Running the Application

```bash
# Development server
npm run dev
```

The application will open at `http://localhost:3000`

### Building for Production

```bash
# Build the project
npm run build

# Start the production server
npm start
```

## Usage

### Adding a Checker

1. Click **"+ Add New Checker"** button
2. Enter a descriptive name
3. Choose input mode: **SQL Query** or **Condition/WHERE**
4. Enter your SQL query or WHERE conditions
5. Add business rules (manually or via bulk import)
6. Click **"Check Alignment"** to analyze

### Business Rule Format

Rules can be entered in the table or imported as tab-separated/space-separated values:

```
TABLE_NAME	COLUMN_NAME	CONDITION
BB_POSTPAID	brand_type_code	WIRELINE
BB_POSTPAID	customer_facing_unit_type_description	Consumer
```

### Input Modes

- **SQL Query**: Full SELECT statements with WHERE clauses
- **Condition/WHERE**: Just the WHERE clause conditions (without the WHERE keyword)

### Bulk Import

Click **"Import Rules"** to paste business rules from Excel or spreadsheets in tab-separated format. Rules are automatically parsed into table rows.

## Component Structure

```
app/
├── page.js                    # Home page with theme setup
├── layout.js                  # Root layout
├── globals.css               # Global styles
├── components/
│   └── QueryChecker.js       # Main checker component
└── utils/
    └── queryAnalyzer.js      # SQL parsing and analysis utilities
```

## Key Components

### QueryChecker

Main component featuring:

- Input mode toggle (SQL Query / Condition)
- Business rules table with CRUD operations
- Alignment check and reporting
- Import dialog for bulk rule loading

### Query Analyzer Utils

- `parseWhereConditions()` - Extracts conditions from SQL while respecting parentheses
- `generateAlignmentReport()` - Compares queries against business rules
- `checkConditionAlignment()` - Validates individual conditions
- `matchesRule()` - Checks rule compliance

## Theme Customization

Edit `app/page.js` to customize MUI and Ant Design themes:

```javascript
const theme = createTheme({
  palette: {
    primary: { main: "#667eea" },
    // ... other theme settings
  },
});

const antdTheme = {
  token: {
    colorPrimary: "#667eea",
    // ... other token settings
  },
};
```

## Features Overview

### Visual Indicators

- **Green**: Aligned conditions
- **Red**: Issues or misaligned conditions
- **Yellow**: Warning (alignment score below 80%)

### Report Metrics

- Total Conditions: Number of WHERE conditions found
- Aligned: Conditions matching business rules
- Issues: Conditions with problems
- Score: Alignment percentage

### Case-Insensitive Matching

Table and column names match regardless of case:

- `BB_POSTPAID` = `bb_postpaid` = `Bb_PostPaid` ✓

### Parentheses-Aware Parsing

Correctly handles complex nested conditions:

```sql
( column IS NULL OR ( column >= 0 AND column < 21 ) )
```

## License

MIT

## Migration from React to Next.js

This is a Next.js 14 version with Material-UI and Ant Design. The original React version is still available in the `/src` directory for reference.

### Key Changes

1. **App Router**: Uses Next.js 14 App Router (`/app` directory)
2. **Client Components**: Uses `'use client'` directive for interactive components
3. **Styling**: Replaced custom CSS with MUI's `sx` prop and Ant Design components
4. **Theming**: Centralized theme in `app/page.js` with MUI ThemeProvider and Ant Design ConfigProvider
5. **Imports**: Updated component imports to use Next.js and MUI paths

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
