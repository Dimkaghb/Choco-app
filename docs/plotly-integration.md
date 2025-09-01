# Plotly.js Integration Guide

## Overview

The application now supports automatic extraction and rendering of chart data from API responses using Plotly.js. This feature works alongside the existing D3.js visualization system and automatically detects chart JSON data in API responses.

## Supported Chart Types

- **Bar Chart** (`bar`): Vertical bar charts for categorical data
- **Line Chart** (`line`): Line charts for time series or continuous data  
- **Pie Chart** (`pie`): Pie charts for showing proportions
- **Scatter Plot** (`scatter`): Scatter plots for showing relationships between variables

## API Response Format

The system automatically detects chart data in the following JSON formats:

### Format 1: Chart Object in Response
```json
{
  "chart": {
    "data": [
      { "label": "Kazakhstan", "value": 1000 },
      { "label": "Russia", "value": 2000 },
      { "label": "USA", "value": 3000 }
    ],
    "type": "bar",
    "title": "Country Statistics"
  },
  "message": "Here is your requested chart."
}
```

### Format 2: Direct Chart Data
```json
{
  "data": [
    { "label": "Q1", "value": 1000 },
    { "label": "Q2", "value": 1500 },
    { "label": "Q3", "value": 1200 }
  ],
  "type": "line",
  "title": "Quarterly Sales"
}
```

## Data Structure Requirements

### Required Fields
- `data`: Array of objects with `label` (string) and `value` (number) properties
- `type`: Chart type - must be one of: `"bar"`, `"line"`, `"pie"`, `"scatter"`

### Optional Fields
- `title`: Chart title (string)

### Example Data Object
```typescript
{
  data: [
    { label: "Category A", value: 100 },
    { label: "Category B", value: 200 },
    { label: "Category C", value: 150 }
  ],
  type: "bar",
  title: "Sample Chart"
}
```

## How It Works

1. **Response Parsing**: When an AI response is received, the system first tries to parse it as JSON
2. **Message Content Priority**: The system prioritizes content in this order:
   - `answer` field (highest priority)
   - `message` field
   - `text` field
   - Full JSON if no text fields found
3. **Chart Detection**: The system automatically scans for chart JSON data using `extractChartFromResponse()`
4. **Dual Rendering**: Both the message text and chart (if found) are displayed together in the same message

## Components

### PlotlyChart Component

Location: `src/components/plotly-chart.tsx`

```typescript
interface PlotlyChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
  className?: string;
}
```

### Chart Extractor Utilities

Location: `src/lib/chart-extractor.ts`

- `extractChartFromResponse(responseText: string)`: Extracts chart data from API response
- `removeChartFromResponse(responseText: string)`: Removes chart JSON and returns clean message

## Integration Points

### Message Type Extension

The `Message` interface in `src/lib/types.ts` has been extended with:

```typescript
plotlyChart?: {
  data: Array<{
    label: string;
    value: number;
  }>;
  type: 'bar' | 'line' | 'pie' | 'scatter';
  title?: string;
};
```

### Chat UI Integration

The chat UI (`src/components/chat-ui.tsx`) automatically:
1. Scans API responses for chart data
2. Extracts chart information
3. Cleans message content
4. Creates messages with chart data

### Message Display

The chat message component (`src/components/chat-message.tsx`) renders Plotly charts when `message.plotlyChart` is present.

## Testing

A test page is available at `/test-plotly` that demonstrates:
- Direct chart component usage
- Chart extraction from JSON responses
- All supported chart types

## Styling

Charts inherit the application's theme and use:
- Responsive design (100% width, 400px height)
- Consistent color schemes
- Border and padding matching the UI design
- Font family matching the application (`Inter, system-ui, sans-serif`)

## Error Handling

- Invalid chart data is silently ignored
- Malformed JSON doesn't break the message display
- Fallback to text display if chart rendering fails
- Graceful degradation when Plotly.js fails to load

## Dependencies

- `plotly.js-dist-min`: Plotly.js library (minified version)
- `@types/plotly.js`: TypeScript definitions for Plotly.js

## Performance Considerations

- Uses the minified version of Plotly.js for smaller bundle size
- Charts are rendered client-side only
- Automatic cleanup of Plotly instances on component unmount
- Responsive design prevents layout issues