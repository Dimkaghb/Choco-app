import pandas as pd
import json
import io
from typing import Dict, Any, List
from pathlib import Path
from fastapi import HTTPException
from config import settings

class FileProcessor:
    """Handles file processing using pandas and other libraries"""
    
    @staticmethod
    def process_file(file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Main method to process different file types"""
        file_extension = Path(filename).suffix.lower()
        
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_extension}. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        
        try:
            if file_extension == '.csv':
                return FileProcessor._process_csv(file_content)
            elif file_extension in ['.xlsx', '.xls']:
                return FileProcessor._process_excel(file_content)
            elif file_extension == '.json':
                return FileProcessor._process_json(file_content)
            elif file_extension in ['.txt', '.log']:
                return FileProcessor._process_text(file_content)
            else:
                return FileProcessor._process_generic(file_content, file_extension)
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing {file_extension} file: {str(e)}")
    
    @staticmethod
    def _process_csv(file_content: bytes) -> Dict[str, Any]:
        """Process CSV files"""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                df = pd.read_csv(io.BytesIO(file_content), encoding='utf-8', errors='ignore')
            
            return {
                "type": "csv",
                "shape": df.shape,
                "columns": df.columns.tolist(),
                "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
                "sample_data": df.head(settings.MAX_SAMPLE_ROWS).to_dict('records'),
                "summary_stats": FileProcessor._get_summary_stats(df),
                "null_counts": df.isnull().sum().to_dict(),
                "memory_usage": df.memory_usage(deep=True).to_dict(),
                "unique_counts": {col: df[col].nunique() for col in df.columns},
                "full_data": df.head(100).to_dict('records') if df.shape[0] <= 100 else None  # Only include full data for very small files
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV processing error: {str(e)}")
    
    @staticmethod
    def _process_excel(file_content: bytes) -> Dict[str, Any]:
        """Process Excel files"""
        try:
            excel_file = pd.ExcelFile(io.BytesIO(file_content))
            sheets_data = {}
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(io.BytesIO(file_content), sheet_name=sheet_name)
                sheets_data[sheet_name] = {
                    "shape": df.shape,
                    "columns": df.columns.tolist(),
                    "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
                    "sample_data": df.head(settings.MAX_SAMPLE_ROWS).to_dict('records'),
                    "summary_stats": FileProcessor._get_summary_stats(df),
                    "null_counts": df.isnull().sum().to_dict(),
                    "unique_counts": {col: df[col].nunique() for col in df.columns},
                    "full_data": df.head(100).to_dict('records') if df.shape[0] <= 100 else None
                }
            
            return {
                "type": "excel",
                "sheet_names": excel_file.sheet_names,
                "sheets_data": sheets_data,
                "total_sheets": len(excel_file.sheet_names)
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Excel processing error: {str(e)}")
    
    @staticmethod
    def _process_json(file_content: bytes) -> Dict[str, Any]:
        """Process JSON files"""
        try:
            json_data = json.loads(file_content.decode('utf-8'))
            
            # Analyze JSON structure
            if isinstance(json_data, list) and len(json_data) > 0:
                if all(isinstance(item, dict) for item in json_data):
                    # List of objects - can be converted to DataFrame
                    try:
                        df = pd.DataFrame(json_data)
                        return {
                            "type": "json",
                            "structure": "tabular",
                            "shape": df.shape,
                            "columns": df.columns.tolist(),
                            "data_types": {col: str(dtype) for col, dtype in df.dtypes.items()},
                            "sample_data": df.head(settings.MAX_SAMPLE_ROWS).to_dict('records'),
                            "summary_stats": FileProcessor._get_summary_stats(df),
                            "null_counts": df.isnull().sum().to_dict(),
                            "full_data": json_data if len(json_data) <= 1000 else None
                        }
                    except Exception:
                        pass
            
            # Fallback for non-tabular JSON
            return {
                "type": "json",
                "structure": "nested" if isinstance(json_data, (dict, list)) else "primitive",
                "data_type": type(json_data).__name__,
                "size": len(json_data) if isinstance(json_data, (list, dict, str)) else None,
                "sample_data": FileProcessor._get_json_sample(json_data),
                "full_data": json_data
            }
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"JSON processing error: {str(e)}")
    
    @staticmethod
    def _process_text(file_content: bytes) -> Dict[str, Any]:
        """Process text files"""
        try:
            # Try different encodings
            text_content = None
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    text_content = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            
            if text_content is None:
                text_content = file_content.decode('utf-8', errors='ignore')
            
            lines = text_content.split('\n')
            words = text_content.split()
            
            return {
                "type": "text",
                "line_count": len(lines),
                "word_count": len(words),
                "character_count": len(text_content),
                "sample_lines": lines[:20],
                "preview": text_content[:settings.MAX_TEXT_PREVIEW],
                "full_content": text_content if len(text_content) <= 10000 else None,  # Only include full content for small files
                "encoding_used": "utf-8"  # Simplified for now
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Text processing error: {str(e)}")
    
    @staticmethod
    def _process_generic(file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """Process unsupported file types with basic info"""
        try:
            # Try to decode as text
            try:
                text_content = file_content.decode('utf-8')
                return {
                    "type": "generic_text",
                    "extension": file_extension,
                    "size_bytes": len(file_content),
                    "character_count": len(text_content),
                    "preview": text_content[:settings.MAX_TEXT_PREVIEW],
                    "full_content": text_content if len(text_content) <= 5000 else None
                }
            except UnicodeDecodeError:
                return {
                    "type": "binary",
                    "extension": file_extension,
                    "size_bytes": len(file_content),
                    "preview": "Binary file - content not displayable as text"
                }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Generic file processing error: {str(e)}")
    
    @staticmethod
    def _get_summary_stats(df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary statistics for numeric columns"""
        try:
            numeric_df = df.select_dtypes(include=['number'])
            if numeric_df.empty:
                return None
            return numeric_df.describe().to_dict()
        except Exception:
            return None
    
    @staticmethod
    def _get_json_sample(data: Any, max_items: int = 5) -> Any:
        """Get a sample of JSON data for preview"""
        if isinstance(data, list):
            return data[:max_items] if len(data) > max_items else data
        elif isinstance(data, dict):
            items = list(data.items())[:max_items]
            return dict(items) if len(data) > max_items else data
        else:
            return data