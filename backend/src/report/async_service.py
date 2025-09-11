from typing import Dict, Any, Optional, List
import asyncio
import uuid
from datetime import datetime, timedelta
from enum import Enum
import json
from .excel_generator import generate_excel_report_from_dict
import os

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ReportJob:
    def __init__(self, job_id: str, config: Dict[str, Any], filename: str):
        self.job_id = job_id
        self.config = config
        self.filename = filename
        self.status = JobStatus.PENDING
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.error_message: Optional[str] = None
        self.file_path: Optional[str] = None
        self.progress = 0
        self.warnings: List[str] = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.job_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "error_message": self.error_message,
            "file_path": self.file_path,
            "progress": self.progress,
            "filename": self.filename,
            "warnings": self.warnings
        }

class AsyncReportService:
    def __init__(self):
        self.jobs: Dict[str, ReportJob] = {}
        self.cleanup_interval = 3600  # 1 hour
        self.job_ttl = 24 * 3600  # 24 hours
        
    async def create_report_job(self, config: Dict[str, Any], filename: Optional[str] = None) -> str:
        """Create a new report generation job and return job_id"""
        job_id = str(uuid.uuid4())
        
        # Generate filename if not provided
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"report_{timestamp}.xlsx"
        elif not filename.endswith('.xlsx'):
            filename += '.xlsx'
            
        job = ReportJob(job_id, config, filename)
        self.jobs[job_id] = job
        
        # Start processing in background
        asyncio.create_task(self._process_report_job(job))
        
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job status by job_id"""
        job = self.jobs.get(job_id)
        if not job:
            return None
        return job.to_dict()
    
    async def _process_report_job(self, job: ReportJob):
        """Process report generation job in background"""
        try:
            job.status = JobStatus.PROCESSING
            job.updated_at = datetime.utcnow()
            job.progress = 10
            
            # Create reports directory if it doesn't exist
            reports_dir = os.path.join(os.getcwd(), "reports")
            os.makedirs(reports_dir, exist_ok=True)
            
            job.progress = 30
            job.updated_at = datetime.utcnow()
            
            # Generate full output path
            output_path = os.path.join(reports_dir, job.filename)
            
            job.progress = 50
            job.updated_at = datetime.utcnow()
            
            # Generate the Excel report
            from .excel_generator import ExcelReportGenerator
            generator = ExcelReportGenerator()
            result_path = generator.create_report(job.config, output_path)
            
            # Collect any warnings from the generator
            job.warnings = generator.get_warnings()
            
            job.progress = 90
            job.updated_at = datetime.utcnow()
            
            # Mark as completed
            job.status = JobStatus.COMPLETED
            job.file_path = result_path
            job.progress = 100
            job.updated_at = datetime.utcnow()
            
        except Exception as e:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.updated_at = datetime.utcnow()
    
    async def cleanup_old_jobs(self):
        """Remove old completed/failed jobs"""
        current_time = datetime.utcnow()
        jobs_to_remove = []
        
        for job_id, job in self.jobs.items():
            if (current_time - job.created_at).total_seconds() > self.job_ttl:
                # Remove old job file if exists
                if job.file_path and os.path.exists(job.file_path):
                    try:
                        os.remove(job.file_path)
                    except Exception:
                        pass  # Ignore file removal errors
                jobs_to_remove.append(job_id)
        
        for job_id in jobs_to_remove:
            del self.jobs[job_id]
    
    async def start_cleanup_task(self):
        """Start periodic cleanup task"""
        while True:
            await asyncio.sleep(self.cleanup_interval)
            await self.cleanup_old_jobs()

# Global instance
async_report_service = AsyncReportService()

# Start cleanup task when module is imported
asyncio.create_task(async_report_service.start_cleanup_task())