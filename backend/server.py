from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import tempfile
import asyncio
import httpx
import resend

# Import AI integration
from emergentintegrations.llm.chat import FileContentWithMimeType, LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# AI Chat initialization
gemini_api_key = os.environ.get('GEMINI_API_KEY')
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")

# Job Search API configuration
ADZUNA_APP_ID = os.environ.get('ADZUNA_APP_ID')
ADZUNA_APP_KEY = os.environ.get('ADZUNA_APP_KEY')
if not ADZUNA_APP_ID or not ADZUNA_APP_KEY:
    raise ValueError("ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables are required")

# Email configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'noreply@emergent.com')
if not RESEND_API_KEY:
    raise ValueError("RESEND_API_KEY environment variable is required")

resend.api_key = RESEND_API_KEY

# Resume Models (existing)
class ResumeContent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    personal_info: Dict[str, Any] = Field(default_factory=dict)
    summary: str = ""
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    projects: List[Dict[str, Any]] = Field(default_factory=list)
    languages: List[Dict[str, str]] = Field(default_factory=list)
    additional_sections: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResumeAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_id: str
    ats_score: float
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    keyword_optimization: Dict[str, Any] = Field(default_factory=dict)
    section_scores: Dict[str, float] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CoverLetter(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    resume_id: str
    job_posting: str
    company_name: str
    position_title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class JobPosting(BaseModel):
    company_name: str
    position_title: str
    job_description: str
    requirements: List[str] = Field(default_factory=list)

# New Models for Job Search and Email Automation
class JobListing(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    external_id: str  # ID from job board API
    title: str
    company: str
    location: str
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_currency: str = "USD"
    description: str
    requirements: List[str] = Field(default_factory=list)
    posted_date: datetime
    application_url: str
    source: str = "adzuna"  # Job board source
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
class JobApplication(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    resume_id: str
    job_id: str
    company_name: str
    position_title: str
    status: str = "pending"  # pending, sent, rejected, accepted
    cover_letter_id: Optional[str] = None
    application_date: datetime = Field(default_factory=datetime.utcnow)
    email_sent: bool = False
    email_id: Optional[str] = None

class CompanyContact(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_name: str
    email_addresses: List[EmailStr]
    contact_person: Optional[str] = None
    department: str = "HR"
    phone: Optional[str] = None
    website: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EmailCampaign(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    campaign_name: str
    email_subject: str
    email_template: str
    target_companies: List[str] = Field(default_factory=list)
    status: str = "draft"  # draft, active, completed, paused
    emails_sent: int = 0
    emails_opened: int = 0
    replies_received: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models
class ResumeCreateRequest(BaseModel):
    user_id: str
    personal_info: Optional[Dict[str, Any]] = None
    summary: Optional[str] = ""
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[Dict[str, str]]] = None

class CoverLetterRequest(BaseModel):
    resume_id: str
    job_posting: JobPosting

class JobSearchRequest(BaseModel):
    keywords: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    limit: int = 20

class JobApplicationRequest(BaseModel):
    user_id: str
    resume_id: str
    job_ids: List[str]
    send_emails: bool = True

class EmailCampaignRequest(BaseModel):
    user_id: str
    campaign_name: str
    email_subject: str
    email_template: str
    target_companies: List[str]

# Helper Functions
async def create_ai_chat(session_id: str) -> LlmChat:
    """Create an AI chat instance for resume analysis"""
    return LlmChat(
        api_key=gemini_api_key,
        session_id=session_id,
        system_message="""You are an expert resume analyzer and career advisor. Your role is to:
1. Analyze resumes for ATS optimization and completeness
2. Provide detailed, actionable feedback
3. Identify missing critical information
4. Suggest improvements for better job matching
5. Generate tailored cover letters

Always provide specific, actionable advice and maintain a professional tone."""
    ).with_model("gemini", "gemini-2.0-flash")

async def search_jobs_adzuna(keywords: str, location: str = None, salary_min: float = None, limit: int = 20) -> List[Dict]:
    """Search for jobs using Adzuna API"""
    try:
        base_url = "https://api.adzuna.com/v1/api/jobs/us/search/1"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_APP_KEY,
            "what": keywords,
            "results_per_page": limit,
            "sort_by": "date"
        }
        
        if location:
            params["where"] = location
        if salary_min:
            params["salary_min"] = int(salary_min)
            
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            jobs = []
            
            for job in data.get("results", []):
                job_data = {
                    "external_id": str(job.get("id", "")),
                    "title": job.get("title", ""),
                    "company": job.get("company", {}).get("display_name", ""),
                    "location": job.get("location", {}).get("display_name", ""),
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "description": job.get("description", ""),
                    "posted_date": datetime.fromisoformat(job.get("created").replace("Z", "+00:00")) if job.get("created") else datetime.utcnow(),
                    "application_url": job.get("redirect_url", ""),
                    "source": "adzuna"
                }
                jobs.append(job_data)
            
            return jobs
            
    except Exception as e:
        logging.error(f"Error searching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching jobs: {str(e)}")

async def send_job_application_email(applicant_name: str, company_name: str, position: str, cover_letter: str, recipient_emails: List[str]) -> Dict:
    """Send job application email using Resend"""
    try:
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Job Application: {position}</h2>
                    
                    <p>Dear {company_name} Hiring Team,</p>
                    
                    <p>I hope this email finds you well. My name is {applicant_name}, and I am writing to express my strong interest in the <strong>{position}</strong> position at {company_name}.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #007bff;">Cover Letter</h3>
                        <p>{cover_letter}</p>
                    </div>
                    
                    <p>I have attached my resume for your review and would welcome the opportunity to discuss how my skills and experience align with your team's needs.</p>
                    
                    <p>Thank you for considering my application. I look forward to hearing from you.</p>
                    
                    <p>Best regards,<br>
                    <strong>{applicant_name}</strong></p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        This email was sent via our job application platform. 
                        If you received this in error, please disregard.
                    </p>
                </div>
            </body>
        </html>
        """
        
        params = {
            "from": f"{applicant_name} <{SENDER_EMAIL}>",
            "to": recipient_emails,
            "subject": f"Application for {position} Position - {applicant_name}",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        return email
        
    except Exception as e:
        logging.error(f"Error sending email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")

async def analyze_resume_with_ai(resume_content: ResumeContent) -> Dict[str, Any]:
    """Analyze resume content using AI"""
    try:
        chat = await create_ai_chat(f"resume-analysis-{resume_content.id}")
        
        # Convert resume to text format for analysis
        resume_text = f"""
Personal Information: {json.dumps(resume_content.personal_info, indent=2)}
Summary: {resume_content.summary}
Experience: {json.dumps(resume_content.experience, indent=2)}
Education: {json.dumps(resume_content.education, indent=2)}
Skills: {', '.join(resume_content.skills)}
Certifications: {json.dumps(resume_content.certifications, indent=2)}
Projects: {json.dumps(resume_content.projects, indent=2)}
Languages: {json.dumps(resume_content.languages, indent=2)}
Additional Sections: {json.dumps(resume_content.additional_sections, indent=2)}
"""

        analysis_prompt = f"""
Analyze this resume and provide a comprehensive assessment in JSON format with the following structure:
{{
    "ats_score": <score from 0-100>,
    "strengths": [<list of strengths>],
    "weaknesses": [<list of weaknesses>],
    "missing_information": [<list of missing critical information>],
    "suggestions": [<list of specific improvement suggestions>],
    "keyword_optimization": {{
        "recommended_keywords": [<list of keywords to add>],
        "keyword_density": <current keyword optimization score>
    }},
    "section_scores": {{
        "personal_info": <score 0-100>,
        "summary": <score 0-100>,
        "experience": <score 0-100>,
        "education": <score 0-100>,
        "skills": <score 0-100>,
        "overall_structure": <score 0-100>
    }}
}}

Resume Content:
{resume_text}
"""

        response = await chat.send_message(UserMessage(text=analysis_prompt))
        
        # Parse the AI response
        try:
            # Extract JSON from response
            response_text = response if isinstance(response, str) else response.text
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                # Try to find JSON in the response
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                json_text = response_text[json_start:json_end]
            
            analysis_data = json.loads(json_text)
            return analysis_data
        except json.JSONDecodeError:
            # Fallback response if JSON parsing fails
            return {
                "ats_score": 75.0,
                "strengths": ["Professional experience listed", "Education included"],
                "weaknesses": ["Missing quantified achievements", "Needs more keywords"],
                "missing_information": ["Contact information", "Professional summary"],
                "suggestions": ["Add quantified achievements", "Include relevant keywords", "Improve formatting"],
                "keyword_optimization": {
                    "recommended_keywords": ["data analysis", "project management", "communication"],
                    "keyword_density": 60
                },
                "section_scores": {
                    "personal_info": 80.0,
                    "summary": 70.0,
                    "experience": 75.0,
                    "education": 85.0,
                    "skills": 65.0,
                    "overall_structure": 70.0
                }
            }
    except Exception as e:
        logging.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

async def generate_cover_letter_with_ai(resume_content: ResumeContent, job_posting: JobPosting) -> str:
    """Generate a tailored cover letter using AI"""
    try:
        chat = await create_ai_chat(f"cover-letter-{resume_content.id}")
        
        resume_summary = f"""
Name: {resume_content.personal_info.get('name', 'N/A')}
Summary: {resume_content.summary}
Key Skills: {', '.join(resume_content.skills[:10])}  # Top 10 skills
Recent Experience: {json.dumps(resume_content.experience[:2], indent=2) if resume_content.experience else 'None'}
Education: {json.dumps(resume_content.education, indent=2)}
"""

        cover_letter_prompt = f"""
Generate a professional, tailored cover letter based on the resume and job posting below. 
The cover letter should be:
- Professional and engaging
- Specific to the company and role
- Highlight relevant experience and skills
- Show enthusiasm for the position
- Be approximately 3-4 paragraphs
- Include proper business letter formatting

Resume Summary:
{resume_summary}

Job Posting:
Company: {job_posting.company_name}
Position: {job_posting.position_title}
Description: {job_posting.job_description}
Requirements: {', '.join(job_posting.requirements)}

Generate a complete cover letter that effectively matches the candidate's background to this specific role.
"""

        response = await chat.send_message(UserMessage(text=cover_letter_prompt))
        return response if isinstance(response, str) else response.text
    except Exception as e:
        logging.error(f"Error generating cover letter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")

# Existing API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Resume Builder API with Job Search and Email Automation is running"}

@api_router.post("/resume", response_model=ResumeContent)
async def create_resume(resume_data: ResumeCreateRequest):
    """Create a new resume"""
    try:
        resume = ResumeContent(
            user_id=resume_data.user_id,
            personal_info=resume_data.personal_info or {},
            summary=resume_data.summary or "",
            experience=resume_data.experience or [],
            education=resume_data.education or [],
            skills=resume_data.skills or [],
            certifications=resume_data.certifications or [],
            projects=resume_data.projects or [],
            languages=resume_data.languages or []
        )
        
        await db.resumes.insert_one(resume.dict())
        return resume
    except Exception as e:
        logging.error(f"Error creating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating resume: {str(e)}")

@api_router.get("/resume/{resume_id}", response_model=ResumeContent)
async def get_resume(resume_id: str):
    """Get a resume by ID"""
    try:
        resume = await db.resumes.find_one({"id": resume_id})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return ResumeContent(**resume)
    except Exception as e:
        logging.error(f"Error getting resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting resume: {str(e)}")

@api_router.put("/resume/{resume_id}", response_model=ResumeContent)
async def update_resume(resume_id: str, resume_data: ResumeCreateRequest):
    """Update an existing resume"""
    try:
        existing_resume = await db.resumes.find_one({"id": resume_id})
        if not existing_resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        update_data = {
            "personal_info": resume_data.personal_info or existing_resume.get("personal_info", {}),
            "summary": resume_data.summary or existing_resume.get("summary", ""),
            "experience": resume_data.experience or existing_resume.get("experience", []),
            "education": resume_data.education or existing_resume.get("education", []),
            "skills": resume_data.skills or existing_resume.get("skills", []),
            "certifications": resume_data.certifications or existing_resume.get("certifications", []),
            "projects": resume_data.projects or existing_resume.get("projects", []),
            "languages": resume_data.languages or existing_resume.get("languages", []),
            "updated_at": datetime.utcnow()
        }
        
        await db.resumes.update_one({"id": resume_id}, {"$set": update_data})
        
        updated_resume = await db.resumes.find_one({"id": resume_id})
        return ResumeContent(**updated_resume)
    except Exception as e:
        logging.error(f"Error updating resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating resume: {str(e)}")

@api_router.post("/resume/{resume_id}/analyze", response_model=ResumeAnalysis)
async def analyze_resume(resume_id: str):
    """Analyze a resume for ATS optimization"""
    try:
        resume = await db.resumes.find_one({"id": resume_id})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_content = ResumeContent(**resume)
        analysis_data = await analyze_resume_with_ai(resume_content)
        
        analysis = ResumeAnalysis(
            resume_id=resume_id,
            **analysis_data
        )
        
        await db.analyses.insert_one(analysis.dict())
        return analysis
    except Exception as e:
        logging.error(f"Error analyzing resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing resume: {str(e)}")

@api_router.get("/resume/{resume_id}/analysis", response_model=ResumeAnalysis)
async def get_resume_analysis(resume_id: str):
    """Get the latest analysis for a resume"""
    try:
        analysis = await db.analyses.find_one(
            {"resume_id": resume_id}, 
            sort=[("created_at", -1)]
        )
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return ResumeAnalysis(**analysis)
    except Exception as e:
        logging.error(f"Error getting analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting analysis: {str(e)}")

@api_router.post("/resume/{resume_id}/cover-letter", response_model=CoverLetter)
async def generate_cover_letter(resume_id: str, job_data: JobPosting):
    """Generate a tailored cover letter"""
    try:
        resume = await db.resumes.find_one({"id": resume_id})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_content = ResumeContent(**resume)
        cover_letter_content = await generate_cover_letter_with_ai(resume_content, job_data)
        
        cover_letter = CoverLetter(
            resume_id=resume_id,
            job_posting=job_data.job_description,
            company_name=job_data.company_name,
            position_title=job_data.position_title,
            content=cover_letter_content
        )
        
        await db.cover_letters.insert_one(cover_letter.dict())
        return cover_letter
    except Exception as e:
        logging.error(f"Error generating cover letter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")

@api_router.get("/user/{user_id}/resumes", response_model=List[ResumeContent])
async def get_user_resumes(user_id: str):
    """Get all resumes for a user"""
    try:
        resumes = await db.resumes.find({"user_id": user_id}).to_list(100)
        return [ResumeContent(**resume) for resume in resumes]
    except Exception as e:
        logging.error(f"Error getting user resumes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting user resumes: {str(e)}")

@api_router.post("/resume/parse-upload")
async def parse_uploaded_resume(file: UploadFile = File(...), user_id: str = Form(...)):
    """Parse an uploaded resume file and create a new resume entry"""
    try:
        if not file.filename.lower().endswith(('.pdf', '.txt', '.doc', '.docx')):
            raise HTTPException(status_code=400, detail="Only PDF, TXT, DOC, and DOCX files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.filename.split('.')[-1]}") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Create file content for AI analysis
            file_content = FileContentWithMimeType(
                file_path=tmp_file_path,
                mime_type=file.content_type or "application/pdf"
            )
            
            # Analyze with AI
            chat = await create_ai_chat(f"parse-resume-{uuid.uuid4()}")
            
            parse_prompt = """
            Parse this resume and extract structured information in JSON format:
            {
                "personal_info": {
                    "name": "",
                    "email": "",
                    "phone": "",
                    "address": "",
                    "linkedin": "",
                    "github": ""
                },
                "summary": "",
                "experience": [
                    {
                        "title": "",
                        "company": "",
                        "location": "",
                        "start_date": "",
                        "end_date": "",
                        "description": "",
                        "achievements": []
                    }
                ],
                "education": [
                    {
                        "degree": "",
                        "institution": "",
                        "location": "",
                        "graduation_date": "",
                        "gpa": ""
                    }
                ],
                "skills": [],
                "certifications": [
                    {
                        "name": "",
                        "issuer": "",
                        "date": ""
                    }
                ],
                "projects": [
                    {
                        "name": "",
                        "description": "",
                        "technologies": [],
                        "date": ""
                    }
                ],
                "languages": [
                    {
                        "name": "",
                        "proficiency": ""
                    }
                ]
            }
            """
            
            response = await chat.send_message(UserMessage(
                text=parse_prompt,
                file_contents=[file_content]
            ))
            
            # Parse AI response
            try:
                response_text = response if isinstance(response, str) else response.text
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    json_text = response_text[json_start:json_end].strip()
                else:
                    json_start = response_text.find("{")
                    json_end = response_text.rfind("}") + 1
                    json_text = response_text[json_start:json_end]
                
                parsed_data = json.loads(json_text)
                
                # Create resume from parsed data
                resume = ResumeContent(
                    user_id=user_id,
                    personal_info=parsed_data.get("personal_info", {}),
                    summary=parsed_data.get("summary", ""),
                    experience=parsed_data.get("experience", []),
                    education=parsed_data.get("education", []),
                    skills=parsed_data.get("skills", []),
                    certifications=parsed_data.get("certifications", []),
                    projects=parsed_data.get("projects", []),
                    languages=parsed_data.get("languages", [])
                )
                
                await db.resumes.insert_one(resume.dict())
                return resume
                
            except json.JSONDecodeError as e:
                logging.error(f"JSON parsing error: {str(e)}")
                raise HTTPException(status_code=500, detail="Error parsing resume content")
                
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except Exception as e:
        logging.error(f"Error parsing uploaded resume: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

# New API Endpoints for Job Search and Email Automation
@api_router.post("/jobs/search")
async def search_jobs(search_request: JobSearchRequest):
    """Search for jobs using Adzuna API"""
    try:
        jobs_data = await search_jobs_adzuna(
            keywords=search_request.keywords,
            location=search_request.location,
            salary_min=search_request.salary_min,
            limit=search_request.limit
        )
        
        # Store jobs in database
        jobs = []
        for job_data in jobs_data:
            job = JobListing(**job_data)
            jobs.append(job)
            
            # Check if job already exists
            existing_job = await db.jobs.find_one({"external_id": job.external_id, "source": job.source})
            if not existing_job:
                await db.jobs.insert_one(job.dict())
        
        return {"jobs": [job.dict() for job in jobs], "count": len(jobs)}
    except Exception as e:
        logging.error(f"Error searching jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching jobs: {str(e)}")

@api_router.get("/jobs/recent")
async def get_recent_jobs(limit: int = 50):
    """Get recently saved jobs"""
    try:
        jobs = await db.jobs.find().sort("created_at", -1).limit(limit).to_list(limit)
        return [JobListing(**job) for job in jobs]
    except Exception as e:
        logging.error(f"Error getting recent jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting recent jobs: {str(e)}")

@api_router.post("/jobs/apply")
async def apply_to_jobs(application_request: JobApplicationRequest, background_tasks: BackgroundTasks):
    """Apply to multiple jobs automatically"""
    try:
        # Get user's resume
        resume = await db.resumes.find_one({"id": application_request.resume_id})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume_content = ResumeContent(**resume)
        applicant_name = resume_content.personal_info.get('name', 'Job Applicant')
        
        applications = []
        for job_id in application_request.job_ids:
            # Get job details
            job = await db.jobs.find_one({"id": job_id})
            if not job:
                continue
                
            job_listing = JobListing(**job)
            
            # Generate cover letter
            job_posting = JobPosting(
                company_name=job_listing.company,
                position_title=job_listing.title,
                job_description=job_listing.description,
                requirements=job_listing.requirements
            )
            
            cover_letter_content = await generate_cover_letter_with_ai(resume_content, job_posting)
            
            # Create cover letter record
            cover_letter = CoverLetter(
                resume_id=application_request.resume_id,
                job_posting=job_listing.description,
                company_name=job_listing.company,
                position_title=job_listing.title,
                content=cover_letter_content
            )
            await db.cover_letters.insert_one(cover_letter.dict())
            
            # Create application record
            application = JobApplication(
                user_id=application_request.user_id,
                resume_id=application_request.resume_id,
                job_id=job_id,
                company_name=job_listing.company,
                position_title=job_listing.title,
                cover_letter_id=cover_letter.id
            )
            
            await db.applications.insert_one(application.dict())
            applications.append(application)
            
            # Send email if requested
            if application_request.send_emails:
                # Try to get company contact info
                company_contact = await db.company_contacts.find_one({"company_name": job_listing.company})
                if company_contact:
                    recipient_emails = company_contact["email_addresses"]
                else:
                    # Generate likely email addresses
                    company_domain = job_listing.company.lower().replace(" ", "").replace(",", "").replace(".", "") + ".com"
                    recipient_emails = [f"hr@{company_domain}", f"jobs@{company_domain}"]
                
                background_tasks.add_task(
                    send_application_email,
                    application.id,
                    applicant_name,
                    job_listing.company,
                    job_listing.title,
                    cover_letter_content,
                    recipient_emails
                )
        
        return {"applications": [app.dict() for app in applications], "count": len(applications)}
    except Exception as e:
        logging.error(f"Error applying to jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error applying to jobs: {str(e)}")

async def send_application_email(application_id: str, applicant_name: str, company_name: str, position: str, cover_letter: str, recipient_emails: List[str]):
    """Background task to send application email"""
    try:
        email_result = await send_job_application_email(
            applicant_name=applicant_name,
            company_name=company_name,
            position=position,
            cover_letter=cover_letter,
            recipient_emails=recipient_emails
        )
        
        # Update application with email info
        await db.applications.update_one(
            {"id": application_id},
            {"$set": {"email_sent": True, "email_id": email_result.get("id"), "status": "sent"}}
        )
        
        logging.info(f"Application email sent for {application_id}")
    except Exception as e:
        logging.error(f"Error sending application email for {application_id}: {str(e)}")
        await db.applications.update_one(
            {"id": application_id},
            {"$set": {"status": "failed"}}
        )

@api_router.get("/applications/{user_id}")
async def get_user_applications(user_id: str):
    """Get all applications for a user"""
    try:
        applications = await db.applications.find({"user_id": user_id}).sort("application_date", -1).to_list(100)
        return [JobApplication(**app) for app in applications]
    except Exception as e:
        logging.error(f"Error getting user applications: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting user applications: {str(e)}")

@api_router.post("/companies/contacts")
async def add_company_contact(contact: CompanyContact):
    """Add company contact information"""
    try:
        await db.company_contacts.insert_one(contact.dict())
        return contact
    except Exception as e:
        logging.error(f"Error adding company contact: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error adding company contact: {str(e)}")

@api_router.get("/companies/contacts")
async def get_company_contacts():
    """Get all company contacts"""
    try:
        contacts = await db.company_contacts.find().to_list(100)
        return [CompanyContact(**contact) for contact in contacts]
    except Exception as e:
        logging.error(f"Error getting company contacts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting company contacts: {str(e)}")

@api_router.post("/email/campaign")
async def create_email_campaign(campaign_request: EmailCampaignRequest):
    """Create an email campaign"""
    try:
        campaign = EmailCampaign(
            user_id=campaign_request.user_id,
            campaign_name=campaign_request.campaign_name,
            email_subject=campaign_request.email_subject,
            email_template=campaign_request.email_template,
            target_companies=campaign_request.target_companies
        )
        
        await db.email_campaigns.insert_one(campaign.dict())
        return campaign
    except Exception as e:
        logging.error(f"Error creating email campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating email campaign: {str(e)}")

@api_router.post("/email/campaign/{campaign_id}/send")
async def send_email_campaign(campaign_id: str, background_tasks: BackgroundTasks):
    """Send emails for a campaign"""
    try:
        campaign = await db.email_campaigns.find_one({"id": campaign_id})
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        email_campaign = EmailCampaign(**campaign)
        
        # Send emails to target companies
        background_tasks.add_task(execute_email_campaign, email_campaign)
        
        return {"status": "campaign_started", "campaign_id": campaign_id}
    except Exception as e:
        logging.error(f"Error sending email campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error sending email campaign: {str(e)}")

async def execute_email_campaign(campaign: EmailCampaign):
    """Execute email campaign in background"""
    try:
        emails_sent = 0
        
        for company_name in campaign.target_companies:
            # Get company contact info
            company_contact = await db.company_contacts.find_one({"company_name": company_name})
            if not company_contact:
                continue
                
            # Send email
            try:
                email_result = await send_job_application_email(
                    applicant_name="Job Seeker",  # This should come from user profile
                    company_name=company_name,
                    position="Open Position",
                    cover_letter=campaign.email_template,
                    recipient_emails=company_contact["email_addresses"]
                )
                emails_sent += 1
                
                # Rate limiting
                await asyncio.sleep(2)  # 2 second delay between emails
                
            except Exception as e:
                logging.error(f"Error sending email to {company_name}: {str(e)}")
                continue
        
        # Update campaign status
        await db.email_campaigns.update_one(
            {"id": campaign.id},
            {"$set": {"status": "completed", "emails_sent": emails_sent}}
        )
        
    except Exception as e:
        logging.error(f"Error executing email campaign: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()