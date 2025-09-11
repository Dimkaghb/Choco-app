import pandas as pd
import json
import io
import asyncio
import numpy as np
from typing import Dict, Any, List
from pathlib import Path
from fastapi import HTTPException
from concurrent.futures import ThreadPoolExecutor

from ..config import settings


class FileProcessor:
    """Handles file processing using pandas and other libraries with async support"""
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
    
    async def process_file(self, file_content: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Main method to process different file types"""
        file_extension = Path(filename).suffix.lower()
        
        if file_extension not in settings.ALLOWED_FILE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file_extension}. Allowed types: {settings.ALLOWED_FILE_TYPES}"
            )
        
        try:
            # Run file processing in thread pool for better async performance
            loop = asyncio.get_event_loop()
            
            if file_extension == '.csv':
                return await loop.run_in_executor(self.executor, self._process_csv, file_content)
            elif file_extension in ['.xlsx', '.xls']:
                return await loop.run_in_executor(self.executor, self._process_excel, file_content)
            elif file_extension == '.json':
                return await loop.run_in_executor(self.executor, self._process_json, file_content)
            elif file_extension in ['.txt', '.log']:
                return await loop.run_in_executor(self.executor, self._process_text, file_content)
            else:
                return await loop.run_in_executor(self.executor, self._process_generic, file_content, file_extension)
                
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing {file_extension} file: {str(e)}")
    
    def _process_csv(self, file_content: bytes) -> Dict[str, Any]:
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
                "data_type": "tabular",
                "summary": {
                    "rows": len(df),
                    "columns": len(df.columns),
                    "column_names": df.columns.tolist(),
                    "data_types": df.dtypes.astype(str).to_dict(),
                    "stats": self._get_summary_stats(df)
                },
                "sample_data": self._clean_data_for_json(df.head(settings.MAX_SAMPLE_ROWS).to_dict('records'))
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing CSV: {str(e)}")
    
    def _process_excel(self, file_content: bytes) -> Dict[str, Any]:
        """Process Excel files"""
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(io.BytesIO(file_content))
            sheets_data = {}
            
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(io.BytesIO(file_content), sheet_name=sheet_name)
                sheets_data[sheet_name] = {
                    "rows": len(df),
                    "columns": len(df.columns),
                    "column_names": df.columns.tolist(),
                    "sample_data": self._clean_data_for_json(df.head(settings.MAX_SAMPLE_ROWS).to_dict('records'))
                }
            
            return {
                "data_type": "spreadsheet",
                "summary": {
                    "sheet_count": len(excel_file.sheet_names),
                    "sheet_names": excel_file.sheet_names,
                    "sheets": sheets_data
                }
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing Excel: {str(e)}")
    
    def _process_json(self, file_content: bytes) -> Dict[str, Any]:
        """Process JSON files"""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    text_content = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                text_content = file_content.decode('utf-8', errors='ignore')
            
            data = json.loads(text_content)
            
            return {
                "data_type": "json",
                "summary": {
                    "structure_type": type(data).__name__,
                    "size": len(data) if isinstance(data, (list, dict)) else 1,
                    "keys": list(data.keys()) if isinstance(data, dict) else None,
                    "sample_items": self._get_json_sample(data)
                },
                "sample_data": self._get_json_sample(data, max_items=settings.MAX_SAMPLE_ROWS)
            }
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing JSON: {str(e)}")
    
    def _process_text(self, file_content: bytes) -> Dict[str, Any]:
        """Process text files"""
        try:
            # Try different encodings
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    text_content = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                text_content = file_content.decode('utf-8', errors='ignore')
            
            lines = text_content.split('\n')
            
            return {
                "data_type": "text",
                "summary": {
                    "total_lines": len(lines),
                    "total_characters": len(text_content),
                    "total_words": len(text_content.split()),
                    "encoding_used": encoding
                },
                "sample_data": {
                    "preview": text_content[:settings.MAX_TEXT_PREVIEW],
                    "first_lines": lines[:settings.MAX_SAMPLE_ROWS]
                }
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing text file: {str(e)}")
    
    def _process_generic(self, file_content: bytes, file_extension: str) -> Dict[str, Any]:
        """Process generic/unknown file types"""
        try:
            return {
                "data_type": "binary",
                "summary": {
                    "file_extension": file_extension,
                    "size_bytes": len(file_content),
                    "size_mb": round(len(file_content) / (1024 * 1024), 2)
                },
                "sample_data": {
                    "hex_preview": file_content[:100].hex(),
                    "binary_preview": str(file_content[:100])
                }
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
    
    def _get_summary_stats(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Get summary statistics for DataFrame"""
        numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
        
        # Get missing values and handle NaN
        missing_values = df.isnull().sum().to_dict()
        missing_values = {k: int(v) if not pd.isna(v) else 0 for k, v in missing_values.items()}
        
        # Get numeric stats and handle NaN/infinity values
        numeric_stats = {}
        if numeric_cols:
            stats_df = df.describe()
            numeric_stats = stats_df.to_dict()
            
            # Clean NaN and infinity values
            for col, col_stats in numeric_stats.items():
                for stat_name, stat_value in col_stats.items():
                    if pd.isna(stat_value) or np.isinf(stat_value):
                        numeric_stats[col][stat_name] = None
                    elif isinstance(stat_value, (np.integer, np.floating)):
                        numeric_stats[col][stat_name] = float(stat_value)
        
        return {
            "numeric_columns": numeric_cols,
            "missing_values": missing_values,
            "numeric_stats": numeric_stats
        }
    
    def _clean_data_for_json(self, data: Any) -> Any:
        """Clean data to make it JSON serializable by handling NaN and infinity values"""
        if isinstance(data, dict):
            return {k: self._clean_data_for_json(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._clean_data_for_json(item) for item in data]
        elif pd.isna(data) or (isinstance(data, (float, np.floating)) and np.isinf(data)):
            return None
        elif isinstance(data, (np.integer, np.floating)):
            return float(data)
        elif isinstance(data, np.bool_):
            return bool(data)
        else:
            return data
    
    def _get_json_sample(self, data: Any, max_items: int = 5) -> Any:
        """Get a sample of JSON data"""
        if isinstance(data, list):
            return data[:max_items]
        elif isinstance(data, dict):
            items = list(data.items())[:max_items]
            return dict(items)
        else:
            return data