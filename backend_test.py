#!/usr/bin/env python3
import requests
import json
import os
import sys
import time
from dotenv import load_dotenv
from pathlib import Path
import uuid

# Load environment variables from frontend/.env to get the backend URL
frontend_env_path = Path(__file__).parent / "frontend" / ".env"
load_dotenv(frontend_env_path)

# Get backend URL from environment
BACKEND_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BACKEND_URL:
    print("Error: REACT_APP_BACKEND_URL not found in frontend/.env")
    sys.exit(1)

# Ensure backend URL ends with /api
API_URL = f"{BACKEND_URL}/api"
print(f"Testing backend API at: {API_URL}")

# Test user ID
TEST_USER_ID = f"test-user-{uuid.uuid4()}"
print(f"Using test user ID: {TEST_USER_ID}")

# Sample resume data
sample_resume = {
    "user_id": TEST_USER_ID,
    "personal_info": {
        "name": "Alex Johnson",
        "email": "alex.johnson@example.com",
        "phone": "+1 (555) 123-4567",
        "address": "123 Tech Lane, San Francisco, CA 94107",
        "linkedin": "linkedin.com/in/alexjohnson",
        "github": "github.com/alexjohnson"
    },
    "summary": "Experienced Data Scientist with 5+ years of expertise in machine learning, statistical analysis, and data visualization. Proven track record of delivering actionable insights that drive business growth and operational efficiency.",
    "experience": [
        {
            "title": "Senior Data Scientist",
            "company": "TechInnovate Solutions",
            "location": "San Francisco, CA",
            "start_date": "2020-06",
            "end_date": "Present",
            "description": "Lead data scientist for customer analytics team",
            "achievements": [
                "Developed predictive models that increased customer retention by 23%",
                "Implemented automated data pipeline reducing reporting time by 40%",
                "Mentored 5 junior data scientists and led weekly knowledge sharing sessions"
            ]
        },
        {
            "title": "Data Analyst",
            "company": "DataDriven Corp",
            "location": "Boston, MA",
            "start_date": "2018-03",
            "end_date": "2020-05",
            "description": "Analyzed customer behavior and market trends",
            "achievements": [
                "Created interactive dashboards used by executive team for strategic decisions",
                "Identified key market segments leading to 15% revenue growth",
                "Optimized SQL queries reducing database load by 30%"
            ]
        }
    ],
    "education": [
        {
            "degree": "Master of Science in Data Science",
            "institution": "Massachusetts Institute of Technology",
            "location": "Cambridge, MA",
            "graduation_date": "2018",
            "gpa": "3.92/4.0"
        },
        {
            "degree": "Bachelor of Science in Computer Science",
            "institution": "University of California, Berkeley",
            "location": "Berkeley, CA",
            "graduation_date": "2016",
            "gpa": "3.85/4.0"
        }
    ],
    "skills": [
        "Python", "R", "SQL", "TensorFlow", "PyTorch", 
        "Machine Learning", "Statistical Analysis", "Data Visualization", 
        "A/B Testing", "Big Data", "Hadoop", "Spark", 
        "AWS", "Azure", "Docker", "Git"
    ],
    "certifications": [
        {
            "name": "AWS Certified Machine Learning Specialist",
            "issuer": "Amazon Web Services",
            "date": "2021-04"
        },
        {
            "name": "Professional Data Scientist Certification",
            "issuer": "Data Science Council of America",
            "date": "2019-11"
        }
    ],
    "projects": [
        {
            "name": "Customer Churn Prediction Model",
            "description": "Developed an ML model to predict customer churn with 92% accuracy",
            "technologies": ["Python", "Scikit-learn", "XGBoost", "Pandas"],
            "date": "2021"
        },
        {
            "name": "Real-time Analytics Dashboard",
            "description": "Created interactive visualization platform for business metrics",
            "technologies": ["D3.js", "React", "Node.js", "MongoDB"],
            "date": "2020"
        }
    ],
    "languages": [
        {
            "name": "English",
            "proficiency": "Native"
        },
        {
            "name": "Spanish",
            "proficiency": "Professional working proficiency"
        }
    ]
}

# Sample job posting for Data Analyst position
sample_job_posting = {
    "company_name": "DataTech Innovations",
    "position_title": "Senior Data Analyst",
    "job_description": """
    DataTech Innovations is seeking a skilled Senior Data Analyst to join our growing analytics team. The ideal candidate will have strong experience in data analysis, visualization, and business intelligence tools.
    
    Responsibilities:
    - Analyze complex datasets to identify trends and insights
    - Create and maintain interactive dashboards for stakeholders
    - Collaborate with cross-functional teams to support data-driven decision making
    - Develop and implement data quality processes
    - Present findings to technical and non-technical audiences
    
    This position offers competitive compensation, flexible work arrangements, and opportunities for professional growth in a dynamic, innovative environment.
    """,
    "requirements": [
        "Bachelor's degree in Computer Science, Statistics, or related field",
        "3+ years of experience in data analysis or business intelligence",
        "Proficiency in SQL, Python, and data visualization tools",
        "Experience with big data technologies (Hadoop, Spark)",
        "Strong problem-solving and communication skills",
        "Experience with cloud platforms (AWS, Azure) preferred"
    ]
}

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def run_test(test_name, test_func):
    """Run a test and track results"""
    print(f"\n{'='*80}\nTEST: {test_name}\n{'='*80}")
    start_time = time.time()
    try:
        result = test_func()
        duration = time.time() - start_time
        if result:
            test_results["passed"] += 1
            status = "PASSED"
        else:
            test_results["failed"] += 1
            status = "FAILED"
        
        test_results["tests"].append({
            "name": test_name,
            "status": status,
            "duration": f"{duration:.2f}s"
        })
        
        print(f"\n[{status}] {test_name} ({duration:.2f}s)")
        return result
    except Exception as e:
        duration = time.time() - start_time
        test_results["failed"] += 1
        test_results["tests"].append({
            "name": test_name,
            "status": "ERROR",
            "duration": f"{duration:.2f}s",
            "error": str(e)
        })
        print(f"\n[ERROR] {test_name} ({duration:.2f}s)")
        print(f"Exception: {str(e)}")
        return False

def print_response(response):
    """Print formatted response details"""
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {json.dumps(dict(response.headers), indent=2)}")
    try:
        print(f"Response Body: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response Body: {response.text}")

def test_root_endpoint():
    """Test 1: Basic connectivity to root endpoint"""
    try:
        response = requests.get(f"{API_URL}/")
        print_response(response)
        
        if response.status_code == 200 and "message" in response.json():
            print("✅ Root endpoint is accessible")
            return True
        else:
            print("❌ Root endpoint test failed")
            return False
    except Exception as e:
        print(f"❌ Error connecting to root endpoint: {str(e)}")
        return False

def test_create_resume():
    """Test 2: Create a new resume"""
    global created_resume_id
    
    try:
        response = requests.post(
            f"{API_URL}/resume",
            json=sample_resume
        )
        print_response(response)
        
        if response.status_code == 200 and "id" in response.json():
            created_resume_id = response.json()["id"]
            print(f"✅ Resume created successfully with ID: {created_resume_id}")
            return True
        else:
            print("❌ Resume creation failed")
            return False
    except Exception as e:
        print(f"❌ Error creating resume: {str(e)}")
        return False

def test_get_resume():
    """Test 3: Retrieve the created resume"""
    try:
        if not created_resume_id:
            print("❌ No resume ID available for retrieval")
            return False
            
        response = requests.get(f"{API_URL}/resume/{created_resume_id}")
        print_response(response)
        
        if response.status_code == 200 and response.json()["id"] == created_resume_id:
            print("✅ Resume retrieved successfully")
            return True
        else:
            print("❌ Resume retrieval failed")
            return False
    except Exception as e:
        print(f"❌ Error retrieving resume: {str(e)}")
        return False

def test_update_resume():
    """Test 4: Update the resume with additional information"""
    try:
        # Update with additional skills and a new project
        update_data = {
            "user_id": TEST_USER_ID,
            "skills": sample_resume["skills"] + ["Data Ethics", "Tableau", "Power BI"],
            "projects": sample_resume["projects"] + [
                {
                    "name": "Sentiment Analysis Tool",
                    "description": "Built an NLP-based sentiment analysis tool for social media monitoring",
                    "technologies": ["BERT", "Python", "Flask", "React"],
                    "date": "2022"
                }
            ]
        }
        
        response = requests.put(
            f"{API_URL}/resume/{created_resume_id}",
            json=update_data
        )
        print_response(response)
        
        if response.status_code == 200 and "Data Ethics" in response.json()["skills"]:
            print("✅ Resume updated successfully")
            return True
        else:
            print("❌ Resume update failed")
            return False
    except Exception as e:
        print(f"❌ Error updating resume: {str(e)}")
        return False

def test_analyze_resume():
    """Test 5: Analyze resume for ATS scoring and suggestions"""
    try:
        response = requests.post(f"{API_URL}/resume/{created_resume_id}/analyze")
        print_response(response)
        
        if (response.status_code == 200 and 
            "ats_score" in response.json() and 
            "strengths" in response.json() and 
            "weaknesses" in response.json() and
            "suggestions" in response.json()):
            
            print("✅ Resume analysis successful")
            print(f"ATS Score: {response.json()['ats_score']}")
            print(f"Strengths: {response.json()['strengths']}")
            print(f"Weaknesses: {response.json()['weaknesses']}")
            print(f"Suggestions: {response.json()['suggestions']}")
            return True
        else:
            print("❌ Resume analysis failed")
            return False
    except Exception as e:
        print(f"❌ Error analyzing resume: {str(e)}")
        return False

def test_get_resume_analysis():
    """Test 6: Get the latest resume analysis"""
    try:
        response = requests.get(f"{API_URL}/resume/{created_resume_id}/analysis")
        print_response(response)
        
        if (response.status_code == 200 and 
            "ats_score" in response.json() and 
            "resume_id" in response.json() and
            response.json()["resume_id"] == created_resume_id):
            
            print("✅ Retrieved resume analysis successfully")
            return True
        else:
            print("❌ Resume analysis retrieval failed")
            return False
    except Exception as e:
        print(f"❌ Error retrieving resume analysis: {str(e)}")
        return False

def test_generate_cover_letter():
    """Test 7: Generate a cover letter with a sample job posting"""
    try:
        response = requests.post(
            f"{API_URL}/resume/{created_resume_id}/cover-letter",
            json=sample_job_posting
        )
        print_response(response)
        
        if (response.status_code == 200 and 
            "content" in response.json() and 
            len(response.json()["content"]) > 100):
            
            print("✅ Cover letter generated successfully")
            print(f"Cover Letter Preview: {response.json()['content'][:200]}...")
            return True
        else:
            print("❌ Cover letter generation failed")
            return False
    except Exception as e:
        print(f"❌ Error generating cover letter: {str(e)}")
        return False

def test_get_user_resumes():
    """Test 8: Get all resumes for a user"""
    try:
        response = requests.get(f"{API_URL}/user/{TEST_USER_ID}/resumes")
        print_response(response)
        
        if (response.status_code == 200 and 
            isinstance(response.json(), list) and 
            len(response.json()) > 0):
            
            print(f"✅ Retrieved {len(response.json())} resumes for user")
            return True
        else:
            print("❌ User resume listing failed")
            return False
    except Exception as e:
        print(f"❌ Error retrieving user resumes: {str(e)}")
        return False

def test_job_search():
    """Test 9: Search for jobs using Adzuna API"""
    try:
        search_data = {
            "keywords": "Data Scientist",
            "location": "San Francisco",
            "limit": 5
        }
        
        response = requests.post(
            f"{API_URL}/jobs/search",
            json=search_data
        )
        print_response(response)
        
        if (response.status_code == 200 and 
            "jobs" in response.json() and 
            isinstance(response.json()["jobs"], list) and
            "count" in response.json()):
            
            job_count = response.json()["count"]
            print(f"✅ Job search successful, found {job_count} jobs")
            
            # Print sample job details
            if job_count > 0:
                sample_job = response.json()["jobs"][0]
                print(f"Sample Job: {sample_job['title']} at {sample_job['company']}")
                
            return True
        else:
            print("❌ Job search failed")
            return False
    except Exception as e:
        print(f"❌ Error searching jobs: {str(e)}")
        return False

def test_get_recent_jobs():
    """Test 10: Get recently saved jobs"""
    try:
        response = requests.get(f"{API_URL}/jobs/recent?limit=5")
        print_response(response)
        
        if (response.status_code == 200 and 
            isinstance(response.json(), list)):
            
            job_count = len(response.json())
            print(f"✅ Retrieved {job_count} recent jobs")
            return True
        else:
            print("❌ Recent jobs retrieval failed")
            return False
    except Exception as e:
        print(f"❌ Error retrieving recent jobs: {str(e)}")
        return False

def test_job_application():
    """Test 11: Apply to a job"""
    try:
        # First, search for jobs to get job IDs
        search_data = {
            "keywords": "Data Analyst",
            "location": "Remote",
            "limit": 1
        }
        
        search_response = requests.post(
            f"{API_URL}/jobs/search",
            json=search_data
        )
        
        if search_response.status_code != 200 or "jobs" not in search_response.json() or len(search_response.json()["jobs"]) == 0:
            print("❌ Could not find jobs to apply to")
            return False
            
        job_id = search_response.json()["jobs"][0]["id"]
        
        # Now apply to the job
        application_data = {
            "user_id": TEST_USER_ID,
            "resume_id": created_resume_id,
            "job_ids": [job_id],
            "send_emails": False  # Set to False to avoid sending actual emails during testing
        }
        
        response = requests.post(
            f"{API_URL}/jobs/apply",
            json=application_data
        )
        print_response(response)
        
        if (response.status_code == 200 and 
            "applications" in response.json() and 
            isinstance(response.json()["applications"], list) and
            len(response.json()["applications"]) > 0):
            
            print(f"✅ Job application successful")
            return True
        else:
            print("❌ Job application failed")
            return False
    except Exception as e:
        print(f"❌ Error applying to job: {str(e)}")
        return False

def test_email_sending():
    """Test 12: Test email sending functionality (without actually sending emails)"""
    try:
        # Create a company contact for testing
        contact_data = {
            "company_name": "Test Company",
            "email_addresses": ["test@example.com"],
            "contact_person": "HR Manager",
            "department": "Human Resources"
        }
        
        contact_response = requests.post(
            f"{API_URL}/companies/contacts",
            json=contact_data
        )
        
        if contact_response.status_code != 200:
            print("❌ Could not create test company contact")
            print_response(contact_response)
            return False
            
        # Create an email campaign (without sending)
        campaign_data = {
            "user_id": TEST_USER_ID,
            "campaign_name": "Test Campaign",
            "email_subject": "Test Subject",
            "email_template": "This is a test email template for API testing purposes.",
            "target_companies": ["Test Company"]
        }
        
        response = requests.post(
            f"{API_URL}/email/campaign",
            json=campaign_data
        )
        print_response(response)
        
        if (response.status_code == 200 and 
            "id" in response.json() and
            "campaign_name" in response.json() and
            response.json()["campaign_name"] == "Test Campaign"):
            
            print(f"✅ Email campaign creation successful")
            return True
        else:
            print("❌ Email campaign creation failed")
            return False
    except Exception as e:
        print(f"❌ Error testing email functionality: {str(e)}")
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("\n" + "="*80)
    print(f"RESUME BUILDER API TEST SUITE")
    print(f"Backend URL: {API_URL}")
    print("="*80 + "\n")
    
    # Store created resume ID for use across tests
    global created_resume_id
    created_resume_id = None
    
    # Run tests in sequence
    run_test("Root Endpoint Connectivity", test_root_endpoint)
    run_test("Create Resume", test_create_resume)
    run_test("Get Resume", test_get_resume)
    run_test("Update Resume", test_update_resume)
    run_test("Analyze Resume", test_analyze_resume)
    run_test("Get Resume Analysis", test_get_resume_analysis)
    run_test("Generate Cover Letter", test_generate_cover_letter)
    run_test("Get User Resumes", test_get_user_resumes)
    run_test("Job Search (Adzuna API)", test_job_search)
    run_test("Get Recent Jobs", test_get_recent_jobs)
    run_test("Job Application", test_job_application)
    run_test("Email Functionality (Resend API)", test_email_sending)
    
    # Print summary
    print("\n" + "="*80)
    print(f"TEST SUMMARY: {test_results['passed']} passed, {test_results['failed']} failed")
    print("="*80)
    
    for test in test_results["tests"]:
        status_symbol = "✅" if test["status"] == "PASSED" else "❌"
        print(f"{status_symbol} {test['name']} - {test['status']} ({test['duration']})")
        if test["status"] == "ERROR" and "error" in test:
            print(f"   Error: {test['error']}")
    
    print("\n" + "="*80)
    if test_results["failed"] == 0:
        print("🎉 All tests passed successfully! 🎉")
    else:
        print(f"❌ {test_results['failed']} tests failed")
    print("="*80 + "\n")

if __name__ == "__main__":
    run_all_tests()