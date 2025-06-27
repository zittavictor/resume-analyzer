import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Navigation = ({ userResumes, selectedResume, onResumeSelect, onNewResume }) => {
  const location = useLocation();
  const [showResumeDropdown, setShowResumeDropdown] = useState(false);
  const [showNewResumeModal, setShowNewResumeModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");

  const isActive = (path) => location.pathname === path;

  const handleNewResume = async (e) => {
    e.preventDefault();
    if (!newResumeName.trim()) return;

    try {
      await onNewResume({
        personal_info: { name: newResumeName },
        summary: "",
        experience: [],
        education: [],
        skills: [],
        certifications: [],
        projects: [],
        languages: []
      });
      
      setNewResumeName("");
      setShowNewResumeModal(false);
    } catch (error) {
      console.error("Error creating new resume:", error);
    }
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="bg-blue-600 text-white rounded-lg p-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Resume Builder</span>
              </Link>
            </div>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                to="/editor"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/editor")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Editor
              </Link>
              
              <Link
                to="/cover-letter"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/cover-letter")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Cover Letter
              </Link>
              
              <Link
                to="/upload"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/upload")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Upload
              </Link>
              
              <Link
                to="/job-search"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/job-search")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Job Search
              </Link>
              
              <Link
                to="/applications"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/applications")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Applications
              </Link>
              
              <Link
                to="/cold-emails"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/cold-emails")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                Cold Emails
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4">
              {/* Resume Selector for Mobile */}
              <div className="relative">
                <button
                  onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                  className="bg-white border border-gray-300 rounded-md px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {selectedResume?.personal_info?.name?.split(' ')[0] || "Resume"}
                  <svg className="ml-1 h-3 w-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showResumeDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {userResumes.map((resume) => (
                        <button
                          key={resume.id}
                          onClick={() => {
                            onResumeSelect(resume);
                            setShowResumeDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedResume?.id === resume.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {resume.personal_info?.name || "Unnamed Resume"}
                          <div className="text-xs text-gray-500">
                            Updated {new Date(resume.updated_at).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          setShowNewResumeModal(true);
                          setShowResumeDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        + Create New Resume
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Hamburger menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Resume Selector - Desktop Only */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowResumeDropdown(!showResumeDropdown)}
                  className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {selectedResume?.personal_info?.name || "Select Resume"}
                  <svg className="ml-2 h-4 w-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showResumeDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      {userResumes.map((resume) => (
                        <button
                          key={resume.id}
                          onClick={() => {
                            onResumeSelect(resume);
                            setShowResumeDropdown(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            selectedResume?.id === resume.id ? "bg-blue-50 text-blue-700" : "text-gray-700"
                          }`}
                        >
                          {resume.personal_info?.name || "Unnamed Resume"}
                          <div className="text-xs text-gray-500">
                            Updated {new Date(resume.updated_at).toLocaleDateString()}
                          </div>
                        </button>
                      ))}
                      
                      <hr className="my-1" />
                      
                      <button
                        onClick={() => {
                          setShowNewResumeModal(true);
                          setShowResumeDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                      >
                        + Create New Resume
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/dashboard")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📊 Dashboard
            </Link>
            
            <Link
              to="/editor"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/editor")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              ✏️ Resume Editor
            </Link>
            
            <Link
              to="/cover-letter"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/cover-letter")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📝 Cover Letter
            </Link>
            
            <Link
              to="/upload"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/upload")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📤 Upload Resume
            </Link>
            
            <Link
              to="/job-search"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/job-search")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              🔍 Job Search
            </Link>
            
            <Link
              to="/applications"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/applications")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📋 Applications
            </Link>
            
            <Link
              to="/cold-emails"
              onClick={() => setShowMobileMenu(false)}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive("/cold-emails")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              📧 Cold Emails
            </Link>
          </div>
        </div>
      )}

      {/* New Resume Modal */}
      {showNewResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Resume</h3>
            <form onSubmit={handleNewResume}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume Name
                </label>
                <input
                  type="text"
                  value={newResumeName}
                  onChange={(e) => setNewResumeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewResumeModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Create Resume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;