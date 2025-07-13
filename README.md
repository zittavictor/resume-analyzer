# 🚀 AI-Powered Resume Builder & Job Application Platform

A comprehensive, AI-driven resume builder that helps job seekers create ATS-optimized resumes, generate tailored cover letters, search for jobs, and automate their job application process.

![Resume Builder](https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## ✨ Features

### 🎯 **Smart Resume Builder**
- **Interactive Resume Editor**: Comprehensive resume creation with multiple sections (personal info, experience, education, skills, projects, certifications)
- **Real-time Validation**: Instant feedback on resume completeness and structure
- **Multiple Templates**: Professional resume templates optimized for different industries
- **Auto-save Functionality**: Never lose your work with automatic saving

### 🤖 **AI-Powered Analysis**
- **ATS Score Analysis**: Get detailed ATS (Applicant Tracking System) compatibility scores
- **Smart Suggestions**: AI-powered recommendations for improving your resume
- **Keyword Optimization**: Identify and optimize keywords for specific job roles
- **Missing Information Detection**: Automatically detect and suggest missing crucial information
- **Section-wise Scoring**: Detailed breakdown of each resume section's effectiveness

### 📄 **Intelligent Cover Letter Generator**
- **AI-Tailored Letters**: Generate personalized cover letters based on job descriptions
- **Job Posting Integration**: Paste job descriptions for auto-tailored content
- **Multiple Formats**: Professional formatting with customizable templates
- **Company-Specific Customization**: Tailored content for specific companies and roles

### 📤 **Resume Upload & Parsing**
- **Smart File Upload**: Drag-and-drop interface for existing resumes
- **AI-Powered Parsing**: Automatically extract information from PDF/Word documents
- **Format Detection**: Support for multiple resume formats
- **Data Validation**: Intelligent data extraction and verification

### 🔍 **Integrated Job Search**
- **Real-time Job Listings**: Live job search powered by Adzuna API
- **Advanced Filtering**: Filter by location, salary, company, and more
- **Job Matching**: AI-powered job recommendations based on your resume
- **Application Tracking**: Keep track of applied positions

### 📧 **Email Automation & Outreach**
- **Cold Email Campaigns**: Automated email sequences for job applications
- **Personalized Templates**: AI-generated personalized email content
- **Application Tracking**: Monitor email opens, responses, and follow-ups
- **Company Contact Discovery**: Find relevant hiring managers and recruiters

### 📊 **Application Dashboard**
- **Comprehensive Analytics**: Track application success rates and trends
- **Resume Performance**: Monitor which resumes perform better
- **Application Status**: Real-time status tracking for all applications
- **Interview Scheduling**: Manage interview schedules and follow-ups

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React framework with modern hooks
- **TailwindCSS** - Utility-first CSS framework for responsive design
- **React Router** - Client-side routing for single-page application
- **Axios** - HTTP client for API communication
- **Modern ES6+** - Latest JavaScript features and syntax

### Backend
- **FastAPI** - High-performance Python web framework
- **Python 3.8+** - Modern Python with type hints
- **MongoDB** - NoSQL database for flexible data storage
- **Motor** - Async MongoDB driver for Python
- **Pydantic** - Data validation using Python type annotations

### AI & Integrations
- **Google Gemini AI** - Advanced language model for resume analysis and cover letter generation
- **Adzuna API** - Real-time job search and listings
- **Resend API** - Professional email automation and delivery
- **LiteLLM** - Universal LLM interface for AI operations

### DevOps & Tools
- **Docker** - Containerization for consistent deployment
- **Kubernetes** - Container orchestration
- **Supervisor** - Process management for production
- **GitHub Actions** - CI/CD pipeline automation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.8+
- MongoDB instance
- API keys for integrations

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd resume-builder
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

Create `.env` file in backend directory:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=resume_builder
GEMINI_API_KEY=your_gemini_api_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=your_sender_email
```

3. **Frontend Setup**
```bash
cd frontend
yarn install
```

Create `.env` file in frontend directory:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

4. **Start the Application**
```bash
# Backend (from backend directory)
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (from frontend directory)
yarn start
```

## 📋 API Documentation

### Resume Endpoints
- `POST /api/resume` - Create new resume
- `GET /api/resume/{resume_id}` - Get specific resume
- `PUT /api/resume/{resume_id}` - Update resume
- `GET /api/user/{user_id}/resumes` - Get user's resumes

### Analysis Endpoints
- `POST /api/resume/{resume_id}/analyze` - Analyze resume with AI
- `GET /api/resume/{resume_id}/analysis` - Get analysis results

### Cover Letter Endpoints
- `POST /api/cover-letter/generate` - Generate AI cover letter
- `GET /api/cover-letter/{letter_id}` - Get specific cover letter

### Job Search Endpoints
- `GET /api/jobs/search` - Search jobs with filters
- `GET /api/jobs/recent` - Get recent job listings

### Email Automation Endpoints
- `POST /api/email/send-application` - Send job application email
- `POST /api/email/campaign` - Create email campaign

## 🔧 Configuration

### AI Configuration
The application uses Google Gemini for AI-powered features. Configure your API key in the environment variables.

### Job Search Integration
Adzuna API provides real-time job listings. Sign up at [Adzuna Developer Portal](https://developer.adzuna.com/) for API credentials.

### Email Automation
Resend API handles email delivery. Get your API key from [Resend Dashboard](https://resend.com/).

## 🎨 UI/UX Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: User preference-based theme switching
- **Accessibility**: WCAG compliant with keyboard navigation support
- **Progressive Web App**: Installable with offline capabilities
- **Real-time Updates**: Live resume scoring and suggestions
- **Drag & Drop**: Intuitive file upload and section reordering

## 🔐 Security & Privacy

- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **API Security**: Rate limiting and authentication for all endpoints
- **Privacy Compliance**: GDPR and CCPA compliant data handling
- **Secure Storage**: Encrypted file storage with access controls

## 📈 Performance

- **Optimized Loading**: Code splitting and lazy loading for fast initial load
- **Caching Strategy**: Intelligent caching for API responses
- **Database Optimization**: Indexed queries for fast data retrieval
- **CDN Integration**: Static assets served via CDN for global performance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Google Gemini AI for advanced language processing
- Adzuna for comprehensive job search API
- Resend for reliable email delivery
- TailwindCSS for beautiful, responsive design
- FastAPI for high-performance backend framework

