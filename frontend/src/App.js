import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

// Components
import Dashboard from "./components/Dashboard";
import ResumeEditor from "./components/ResumeEditor";
import CoverLetterGenerator from "./components/CoverLetterGenerator";
import ResumeUploader from "./components/ResumeUploader";
import JobSearch from "./components/JobSearch";
import ApplicationTracker from "./components/ApplicationTracker";
import ColdEmailCampaigns from "./components/ColdEmailCampaigns";
import Navigation from "./components/Navigation";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Sample user ID for demo purposes
const DEMO_USER_ID = "demo-user-123";

function App() {
  const [currentUser] = useState(DEMO_USER_ID);
  const [userResumes, setUserResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's resumes on app load
  useEffect(() => {
    fetchUserResumes();
  }, []);

  const fetchUserResumes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/user/${currentUser}/resumes`);
      setUserResumes(response.data);
      
      // If user has resumes, select the first one
      if (response.data.length > 0) {
        setSelectedResume(response.data[0]);
      }
    } catch (error) {
      console.error("Error fetching user resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = (resume) => {
    setSelectedResume(resume);
  };

  const handleResumeUpdate = async () => {
    // Refresh the resume list when a resume is updated
    await fetchUserResumes();
  };

  const handleNewResume = async (resumeData) => {
    try {
      const response = await axios.post(`${API}/resume`, {
        ...resumeData,
        user_id: currentUser
      });
      
      setUserResumes(prev => [...prev, response.data]);
      setSelectedResume(response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating resume:", error);
      throw error;
    }
  };

  const handleJobApplication = (applications) => {
    // Handle job applications success
    console.log("Job applications submitted:", applications);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BrowserRouter>
        <Navigation 
          userResumes={userResumes}
          selectedResume={selectedResume}
          onResumeSelect={handleResumeSelect}
          onNewResume={handleNewResume}
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  selectedResume={selectedResume}
                  onResumeUpdate={handleResumeUpdate}
                />
              } 
            />
            
            <Route 
              path="/editor" 
              element={
                <ResumeEditor 
                  selectedResume={selectedResume}
                  onResumeUpdate={handleResumeUpdate}
                />
              } 
            />
            
            <Route 
              path="/cover-letter" 
              element={
                <CoverLetterGenerator 
                  selectedResume={selectedResume}
                />
              } 
            />
            
            <Route 
              path="/upload" 
              element={
                <ResumeUploader 
                  currentUser={currentUser}
                  onResumeUploaded={fetchUserResumes}
                />
              } 
            />

            <Route 
              path="/job-search" 
              element={
                <JobSearch 
                  selectedResume={selectedResume}
                  onJobApplication={handleJobApplication}
                />
              } 
            />

            <Route 
              path="/applications" 
              element={
                <ApplicationTracker 
                  currentUser={currentUser}
                />
              } 
            />

            <Route 
              path="/cold-emails" 
              element={
                <ColdEmailCampaigns 
                  currentUser={currentUser}
                />
              } 
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;