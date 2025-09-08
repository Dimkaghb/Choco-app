# Excel Structure Parser

A comprehensive tool for defining, parsing, and exporting Excel file structures using openpyxl.

## Features

- **Define Excel Structure**: Create detailed Excel file structures with cell positioning, formatting, and styles
- **Parse Existing Files**: Extract structure information from existing Excel files
- **JSON Export/Import**: Save and load structures as JSON for easy configuration
- **Advanced Styling**: Support for fonts, borders, fills, alignment, and number formatting
- **Cell Features**: Handle formulas, comments, hyperlinks, and merged cells
- **Sheet Management**: Configure multiple sheets with custom properties

## Usage

### Basic Usage

```python
from structure_parser import parse_structure

# Create a simple Excel file from JSON structure
parse_structure('config.json', 'output.xlsx')
```

### Advanced Usage

```python
from structure_parser import ExcelStructureParser, WorkbookStructure, SheetStructure, CellDefinition

# Create parser instance
parser = ExcelStructureParser()

# Parse existing file
structure = parser.parse_from_file('existing.xlsx')

# Export to JSON
parser.export_to_json('structure.json', structure)

# Create new workbook from structure
workbook = parser.create_workbook_from_structure(structure)

# Save workbook
parser.save_workbook('new_file.xlsx', structure)
```

## Structure Format

The parser uses a hierarchical structure:

- **WorkbookStructure**: Contains multiple sheets and global settings
- **SheetStructure**: Defines sheet properties and contains cells
- **CellDefinition**: Defines individual cell properties, values, and styling
- **CellStyle**: Handles font, fill, border, and alignment styling

## Testing

Run the test suite to verify functionality:

```bash
python test_structure_parser.py
```

The test suite includes:
- Basic structure creation
- JSON parsing and export
- Advanced features (formulas, comments, hyperlinks)
- Existing file parsing
- Convenience functions

## Generated Files

The parser generates various Excel files and JSON structures for testing and demonstration purposes.