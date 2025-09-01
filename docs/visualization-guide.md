# D3.js Visualization Component Guide

## Overview

The D3.js visualization component allows your chat application to display dynamic charts and graphs when the API response contains visualization data. The component supports multiple chart types and handles the DOM manipulation coordination between React and D3.js.

## Supported Chart Types

- **Bar Chart** (`bar`): Vertical bar charts for categorical data
- **Line Chart** (`line`): Line charts for time series or continuous data
- **Pie Chart** (`pie`): Pie charts for showing proportions
- **Scatter Plot** (`scatter`): Scatter plots for showing relationships between variables
- **Area Chart** (`area`): Area charts for showing data over time
- **Histogram** (`histogram`): Histograms for showing data distribution

## API Response Format

To trigger visualization in the chat, your API at `VITE_API_URL` should return a JSON response in the following format:

```json
{
  "visualization": true,
  "message": "Here is your requested chart:",
  "chartData": {
    "chartType": "bar",
    "title": "Sales by Quarter",
    "xLabel": "Quarter",
    "yLabel": "Sales ($)",
    "data": [
      { "label": "Q1", "value": 10000 },
      { "label": "Q2", "value": 15000 },
      { "label": "Q3", "value": 12000 },
      { "label": "Q4", "value": 18000 }
    ],
    "options": {
      "showGrid": true,
      "animate": true,
      "showLegend": false
    }
  }
}
```

## Data Formats by Chart Type

### Bar Chart
```json
{
  "chartType": "bar",
  "data": [
    { "label": "Category A", "value": 30 },
    { "label": "Category B", "value": 45 }
  ]
}
```

### Line Chart
```json
{
  "chartType": "line",
  "data": [
    { "x": 1, "y": 10 },
    { "x": 2, "y": 25 },
    { "x": 3, "y": 15 }
  ]
}
```

### Pie Chart
```json
{
  "chartType": "pie",
  "data": [
    { "label": "Red", "value": 25 },
    { "label": "Blue", "value": 35 },
    { "label": "Green", "value": 40 }
  ]
}
```

### Scatter Plot
```json
{
  "chartType": "scatter",
  "data": [
    { "x": 10, "y": 20, "size": 5 },
    { "x": 25, "y": 35, "size": 8 }
  ]
}
```

### Area Chart
```json
{
  "chartType": "area",
  "data": [
    { "x": 1, "y": 10 },
    { "x": 2, "y": 25 }
  ]
}
```

### Histogram
```json
{
  "chartType": "histogram",
  "data": [
    { "value": 1.2 },
    { "value": 2.3 },
    { "value": 1.8 }
  ]
}
```

## Configuration Options

### Chart Properties
- `title` (string): Chart title displayed at the top
- `xLabel` (string): X-axis label
- `yLabel` (string): Y-axis label
- `width` (number): Chart width in pixels (default: 600)
- `height` (number): Chart height in pixels (default: 400)
- `colors` (string[]): Array of colors for chart elements (uses D3 color scheme by default)

### Options Object
- `showGrid` (boolean): Show/hide grid lines (default: true for applicable charts)
- `showLegend` (boolean): Show/hide legend (default: true for pie charts)
- `animate` (boolean): Enable/disable animations (default: true)
- `margin` (object): Chart margins `{ top, right, bottom, left }` (default: `{ top: 20, right: 30, bottom: 40, left: 50 }`)

## Testing

You can test the visualization component by visiting `/test-visualization` in your application. This page provides:

1. Interactive buttons to switch between different chart types
2. Live preview of each chart type with sample data
3. JSON response format examples
4. Integration instructions

## Technical Implementation

### React-D3 Integration
The component properly handles DOM manipulation by:
- Using `useRef` to get direct DOM access for D3
- Clearing previous D3 content before re-rendering
- Using `useCallback` to optimize re-renders
- Implementing `ResizeObserver` for responsive behavior

### Performance Considerations
- Charts are only re-rendered when data changes
- D3 animations are optimized for smooth performance
- SVG elements are properly cleaned up to prevent memory leaks
- Responsive design adapts to container size

## Example Usage in Chat

When a user asks for data visualization, your backend should:

1. Process the user's request
2. Generate the appropriate chart data
3. Return a JSON response with `visualization: true`
4. Include the chart configuration in the `chartData` object

The chat component will automatically detect the visualization flag and render the chart below the text message.

