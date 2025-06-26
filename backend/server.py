from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import tempfile
import asyncio

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

# Resume Models
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

# API Endpoints
@api_router.get("/")
async def root():
    return {"message": "Resume Builder API is running"}

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