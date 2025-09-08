from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import tempfile
from datetime import datetime
import json

from .excel_generator import generate_excel_report_from_dict

router = APIRouter(prefix="/report", tags=["reports"])


class ReportGenerationRequest(BaseModel):
    config: Dict[str, Any]
    filename: Optional[str] = None


class ReportGenerationResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None


@router.post("/generate-excel", response_model=ReportGenerationResponse)
async def generate_excel_report_endpoint(request: ReportGenerationRequest):
    """
    Generate an Excel report based on JSON configuration
    
    Args:
        request: ReportGenerationRequest containing the configuration and optional filename
        
    Returns:
        ReportGenerationResponse with success status and file path
    """
    try:
        # Generate filename if not provided
        if not request.filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"report_{timestamp}.xlsx"
        else:
            filename = request.filename
            if not filename.endswith('.xlsx'):
                filename += '.xlsx'
        
        # Create reports directory if it doesn't exist
        reports_dir = os.path.join(os.getcwd(), "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate full output path
        output_path = os.path.join(reports_dir, filename)
        
        # Generate the Excel report
        result_path = generate_excel_report_from_dict(request.config, output_path)
        
        return ReportGenerationResponse(
            success=True,
            message="Excel report generated successfully",
            file_path=result_path
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error generating Excel report: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_report(filename: str):
    """
    Download a generated Excel report
    
    Args:
        filename: Name of the file to download
        
    Returns:
        FileResponse with the Excel file
    """
    try:
        reports_dir = os.path.join(os.getcwd(), "reports")
        file_path = os.path.join(reports_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error downloading file: {str(e)}"
        )


@router.get("/list")
async def list_reports():
    """
    List all available Excel reports
    
    Returns:
        List of available report files with metadata
    """
    try:
        reports_dir = os.path.join(os.getcwd(), "reports")
        
        if not os.path.exists(reports_dir):
            return {"reports": []}
        
        reports = []
        for filename in os.listdir(reports_dir):
            if filename.endswith('.xlsx'):
                file_path = os.path.join(reports_dir, filename)
                stat = os.stat(file_path)
                
                reports.append({
                    "filename": filename,
                    "size": stat.st_size,
                    "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        # Sort by creation time (newest first)
        reports.sort(key=lambda x: x["created"], reverse=True)
        
        return {"reports": reports}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error listing reports: {str(e)}"
        )


@router.delete("/delete/{filename}")
async def delete_report(filename: str):
    """
    Delete a generated Excel report
    
    Args:
        filename: Name of the file to delete
        
    Returns:
        Success message
    """
    try:
        reports_dir = os.path.join(os.getcwd(), "reports")
        file_path = os.path.join(reports_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        if not filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        os.remove(file_path)
        
        return {"success": True, "message": f"Report {filename} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting file: {str(e)}"
        )


@router.post("/validate-config")
async def validate_config(config: Dict[str, Any]):
    """
    Validate Excel report configuration without generating the file
    
    Args:
        config: Report configuration to validate
        
    Returns:
        Validation result
    """
    try:
        # Basic validation
        errors = []
        warnings = []
        
        # Check if sheets are provided
        if "sheets" not in config or not config["sheets"]:
            errors.append("At least one sheet configuration is required")
        else:
            # Validate each sheet
            for i, sheet in enumerate(config["sheets"]):
                sheet_name = sheet.get("name", f"Sheet {i+1}")
                
                # Check for data or headers
                if "data" not in sheet and "headers" not in sheet:
                    warnings.append(f"Sheet '{sheet_name}' has no data or headers defined")
                
                # Validate chart configurations
                if "charts" in sheet:
                    for j, chart in enumerate(sheet["charts"]):
                        if "data_range" not in chart:
                            errors.append(f"Chart {j+1} in sheet '{sheet_name}' missing data_range")
                        
                        chart_type = chart.get("type", "bar")
                        if chart_type not in ["bar", "line", "pie"]:
                            errors.append(f"Invalid chart type '{chart_type}' in sheet '{sheet_name}'")
        
        # Try to create a temporary file to test the configuration
        if not errors:
            try:
                with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=True) as tmp_file:
                    generate_excel_report_from_dict(config, tmp_file.name)
                    validation_message = "Configuration is valid"
            except Exception as e:
                errors.append(f"Configuration test failed: {str(e)}")
                validation_message = "Configuration has errors"
        else:
            validation_message = "Configuration has validation errors"
        
        return {
            "valid": len(errors) == 0,
            "message": validation_message,
            "errors": errors,
            "warnings": warnings
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error validating configuration: {str(e)}"
        )


@router.get("/example-config")
async def get_example_config():
    """
    Get an example configuration for Excel report generation
    
    Returns:
        Example configuration object
    """
    example_config = {
        "properties": {
            "title": "Sample Report",
            "creator": "Report Generator",
            "description": "Generated Excel report example"
        },
        "sheets": [
            {
                "name": "Sales Data",
                "properties": {
                    "tab_color": "1F4E79",
                    "zoom": 100
                },
                "headers": [
                    {
                        "title": "Product",
                        "style": {
                            "font": {"bold": True, "color": "FFFFFF"},
                            "fill": {"color": "366092"},
                            "alignment": {"horizontal": "center"}
                        }
                    },
                    {
                        "title": "Sales",
                        "style": {
                            "font": {"bold": True, "color": "FFFFFF"},
                            "fill": {"color": "366092"},
                            "alignment": {"horizontal": "center"}
                        }
                    },
                    {
                        "title": "Revenue",
                        "style": {
                            "font": {"bold": True, "color": "FFFFFF"},
                            "fill": {"color": "366092"},
                            "alignment": {"horizontal": "center"}
                        }
                    }
                ],
                "data": [
                    ["Product A", 100, 5000],
                    ["Product B", 150, 7500],
                    ["Product C", 200, 10000],
                    ["Product D", 75, 3750],
                    ["Product E", 300, 15000]
                ],
                "formatting": {
                    "alternating_rows": {
                        "start_row": 2,
                        "color1": "FFFFFF",
                        "color2": "F2F2F2"
                    },
                    "freeze_panes": "A2"
                },
                "charts": [
                    {
                        "type": "bar",
                        "title": "Sales by Product",
                        "data_range": "A1:C6",
                        "position": "E2",
                        "x_axis_title": "Products",
                        "y_axis_title": "Sales"
                    }
                ]
            }
        ]
    }
    
    return {
        "example_config": example_config,
        "description": "This is a sample configuration for generating Excel reports",
        "usage": "POST this configuration to /report/generate-excel to create a report"
    }