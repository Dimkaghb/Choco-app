# Excel Report Generator - JSON Configuration Structure

This document describes the JSON structure expected by the Excel Report Generator.

## Root Configuration Object

```json
{
  "properties": { ... },    // Optional: Workbook-level properties
  "sheets": [ ... ]         // Required: Array of sheet configurations
}
```

## Workbook Properties (Optional)

```json
"properties": {
  "title": "string",        // Workbook title
  "creator": "string",      // Creator name
  "description": "string"   // Workbook description
}
```

## Sheet Configuration

Each sheet in the `sheets` array follows this structure:

```json
{
  "name": "string",                    // Sheet name (optional, defaults to Sheet1, Sheet2, etc.)
  "properties": { ... },               // Optional: Sheet-specific properties
  "headers": [ ... ],                  // Optional: Column headers configuration
  "data": [ ... ],                     // Optional: Data rows
  "formatting": { ... },               // Optional: Sheet formatting options
  "charts": [ ... ],                   // Optional: Charts to add to the sheet
  "auto_adjust_columns": boolean       // Optional: Auto-adjust column widths (default: true)
}
```

### Sheet Properties (Optional)

```json
"properties": {
  "tab_color": "string",     // Hex color for sheet tab (e.g., "1F4E79")
  "zoom": number             // Zoom level (e.g., 100)
}
```

### Headers Configuration (Optional)

Array of header objects:

```json
"headers": [
  {
    "title": "string",        // Column header text
    "style": { ... },         // Optional: Header cell styling
    "data_style": { ... }     // Optional: Style for data cells in this column
  }
]
```

### Data Configuration (Optional)

Array of data rows, where each row is an array of values:

```json
"data": [
  ["value1", "value2", "value3"],    // Row 1
  ["value4", "value5", "value6"],    // Row 2
  // ... more rows
]
```

### Cell Style Configuration

Used in `style` and `data_style` properties:

```json
"style": {
  "font": {
    "name": "string",         // Font name (default: "Calibri")
    "size": number,           // Font size (default: 11)
    "bold": boolean,          // Bold text (default: false)
    "italic": boolean,        // Italic text (default: false)
    "color": "string"         // Hex color (default: "000000")
  },
  "fill": {
    "color": "string"         // Background color in hex (default: "FFFFFF")
  },
  "alignment": {
    "horizontal": "string",   // "left", "center", "right", "general"
    "vertical": "string",     // "top", "center", "bottom"
    "wrap_text": boolean      // Wrap text in cell
  },
  "border": {
    "style": "string",        // Border style: "thin", "thick", "medium", etc.
    "left": boolean,          // Show left border
    "right": boolean,         // Show right border
    "top": boolean,           // Show top border
    "bottom": boolean         // Show bottom border
  }
}
```

### Formatting Configuration (Optional)

```json
"formatting": {
  "borders": {
    "range": "string",        // Cell range (e.g., "A1:C10")
    "style": "string"         // Border style (default: "thin")
  },
  "alternating_rows": {
    "start_row": number,      // Starting row for alternating colors (default: 2)
    "end_row": number,        // Ending row (optional, defaults to last row)
    "color1": "string",       // First color in hex (default: "FFFFFF")
    "color2": "string"        // Second color in hex (default: "F2F2F2")
  },
  "freeze_panes": "string"   // Cell reference for freeze panes (e.g., "A2")
}
```

### Charts Configuration (Optional)

Array of chart objects:

```json
"charts": [
  {
    "type": "string",         // Chart type: "bar", "line", "pie"
    "title": "string",        // Chart title
    "data_range": "string",   // Data range for chart (e.g., "A1:C4")
    "position": "string",     // Chart position (e.g., "E2")
    "x_axis_title": "string", // X-axis title
    "y_axis_title": "string"  // Y-axis title
  }
]
```

## Complete Example

```json
{
  "properties": {
    "title": "Monthly Sales Report",
    "creator": "Sales Department",
    "description": "Comprehensive sales analysis for the month"
  },
  "sheets": [
    {
      "name": "Sales Summary",
      "properties": {
        "tab_color": "1F4E79",
        "zoom": 100
      },
      "headers": [
        {
          "title": "Product Name",
          "style": {
            "font": {"bold": true, "color": "FFFFFF", "size": 12},
            "fill": {"color": "366092"},
            "alignment": {"horizontal": "center", "vertical": "center"}
          },
          "data_style": {
            "alignment": {"horizontal": "left"}
          }
        },
        {
          "title": "Units Sold",
          "style": {
            "font": {"bold": true, "color": "FFFFFF", "size": 12},
            "fill": {"color": "366092"},
            "alignment": {"horizontal": "center", "vertical": "center"}
          },
          "data_style": {
            "alignment": {"horizontal": "right"}
          }
        },
        {
          "title": "Revenue ($)",
          "style": {
            "font": {"bold": true, "color": "FFFFFF", "size": 12},
            "fill": {"color": "366092"},
            "alignment": {"horizontal": "center", "vertical": "center"}
          },
          "data_style": {
            "alignment": {"horizontal": "right"}
          }
        },
        {
          "title": "Profit Margin (%)",
          "style": {
            "font": {"bold": true, "color": "FFFFFF", "size": 12},
            "fill": {"color": "366092"},
            "alignment": {"horizontal": "center", "vertical": "center"}
          },
          "data_style": {
            "alignment": {"horizontal": "right"}
          }
        }
      ],
      "data": [
        ["Laptop Pro", 45, 67500, 15.2],
        ["Desktop Elite", 32, 48000, 18.5],
        ["Tablet Max", 78, 39000, 22.1],
        ["Phone Ultra", 156, 93600, 28.3],
        ["Watch Smart", 89, 26700, 35.7]
      ],
      "formatting": {
        "alternating_rows": {
          "start_row": 2,
          "color1": "FFFFFF",
          "color2": "F8F9FA"
        },
        "borders": {
          "range": "A1:D6",
          "style": "thin"
        },
        "freeze_panes": "A2"
      },
      "charts": [
        {
          "type": "bar",
          "title": "Revenue by Product",
          "data_range": "A1:C6",
          "position": "F2",
          "x_axis_title": "Products",
          "y_axis_title": "Revenue ($)"
        },
        {
          "type": "pie",
          "title": "Market Share by Units",
          "data_range": "A1:B6",
          "position": "F15"
        }
      ],
      "auto_adjust_columns": true
    },
    {
      "name": "Monthly Trends",
      "properties": {
        "tab_color": "70AD47"
      },
      "headers": [
        {
          "title": "Month",
          "style": {
            "font": {"bold": true, "color": "FFFFFF"},
            "fill": {"color": "70AD47"},
            "alignment": {"horizontal": "center"}
          }
        },
        {
          "title": "Total Sales",
          "style": {
            "font": {"bold": true, "color": "FFFFFF"},
            "fill": {"color": "70AD47"},
            "alignment": {"horizontal": "center"}
          }
        },
        {
          "title": "Growth %",
          "style": {
            "font": {"bold": true, "color": "FFFFFF"},
            "fill": {"color": "70AD47"},
            "alignment": {"horizontal": "center"}
          }
        }
      ],
      "data": [
        ["January", 245000, 5.2],
        ["February", 267000, 8.9],
        ["March", 289000, 8.2],
        ["April", 312000, 7.9],
        ["May", 298000, -4.5],
        ["June", 334000, 12.1]
      ],
      "formatting": {
        "alternating_rows": {
          "start_row": 2,
          "color1": "FFFFFF",
          "color2": "E8F5E8"
        },
        "freeze_panes": "A2"
      },
      "charts": [
        {
          "type": "line",
          "title": "Sales Trend Over Time",
          "data_range": "A1:B7",
          "position": "E2",
          "x_axis_title": "Month",
          "y_axis_title": "Sales ($)"
        }
      ]
    }
  ]
}
```

## Usage Examples

### Python Usage

```python
from excel_generator import generate_excel_report_from_dict, generate_excel_report

# Using dictionary
config = { ... }  # Your configuration dictionary
output_path = "reports/my_report.xlsx"
result = generate_excel_report_from_dict(config, output_path)

# Using JSON string
config_json = '{"properties": {...}, "sheets": [...]}'
result = generate_excel_report(config_json, output_path)
```

### API Integration

```python
from fastapi import FastAPI, HTTPException
from excel_generator import generate_excel_report_from_dict

app = FastAPI()

@app.post("/generate-report")
async def create_report(config: dict):
    try:
        output_path = f"reports/report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        result_path = generate_excel_report_from_dict(config, output_path)
        return {"success": True, "file_path": result_path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

## Notes

- All color values should be in hexadecimal format without the '#' prefix (e.g., "FF0000" for red)
- Cell ranges follow Excel notation (e.g., "A1:C10")
- Chart data ranges should include headers for proper labeling
- The generator automatically creates parent directories if they don't exist
- Column widths are auto-adjusted unless `auto_adjust_columns` is set to `false`
- If no sheets are provided, a default empty sheet will be created
- Chart types supported: "bar", "line", "pie"
- Border styles supported: "thin", "thick", "medium", "dashed", "dotted", "double"
- Alignment options: horizontal ("left", "center", "right", "general"), vertical ("top", "center", "bottom")