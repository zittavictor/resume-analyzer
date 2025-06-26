import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoverLetterGenerator = ({ selectedResume }) => {
  const [jobPosting, setJobPosting] = useState({
    company_name: "",
    position_title: "",
    job_description: "",
    requirements: []
  });
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRequirement, setNewRequirement] = useState("");

  const handleGenerateCoverLetter = async (e) => {
    e.preventDefault();
    
    if (!selectedResume) {
      setError("Please select a resume first");
      return;
    }

    if (!jobPosting.company_name || !jobPosting.position_title || !jobPosting.job_description) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API}/resume/${selectedResume.id}/cover-letter`, jobPosting);
      setGeneratedCoverLetter(response.data);
    } catch (error) {
      console.error("Error generating cover letter:", error);
      setError("Failed to generate cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setJobPosting(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (index) => {
    setJobPosting(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = () => {
    if (generatedCoverLetter) {
      navigator.clipboard.writeText(generatedCoverLetter.content);
      alert("Cover letter copied to clipboard!");
    }
  };

  if (!selectedResume) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Resume Selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a resume from the dropdown above to generate a cover letter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Cover Letter Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a tailored cover letter for {selectedResume.personal_info?.name || "your resume"}
        </p>
      </div>

      {/* Job Posting Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Job Information</h2>
        
        <form onSubmit={handleGenerateCoverLetter} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                value={jobPosting.company_name}
                onChange={(e) => setJobPosting(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter company name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position Title *
              </label>
              <input
                type="text"
                value={jobPosting.position_title}
                onChange={(e) => setJobPosting(prev => ({ ...prev, position_title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter position title"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              value={jobPosting.job_description}
              onChange={(e) => setJobPosting(prev => ({ ...prev, job_description: e.target.value }))}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste the full job description here..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Requirements (Optional)
            </label>
            
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a job requirement"
              />
              <button
                type="button"
                onClick={addRequirement}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {jobPosting.requirements.map((requirement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {requirement}
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                "Generate Cover Letter"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Cover Letter */}
      {generatedCoverLetter && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Generated Cover Letter</h2>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-md p-6 bg-gray-50">
            <div className="whitespace-pre-wrap text-sm text-gray-900 leading-relaxed">
              {generatedCoverLetter.content}
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p>Company: {generatedCoverLetter.company_name}</p>
            <p>Position: {generatedCoverLetter.position_title}</p>
            <p>Generated: {new Date(generatedCoverLetter.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Sample Job Postings */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Sample Job Information</h2>
        <p className="text-sm text-gray-600 mb-4">
          Click on a sample to quickly fill in the form above:
        </p>
        
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setJobPosting({
              company_name: "DataTech Solutions",
              position_title: "Senior Data Analyst",
              job_description: "We are seeking a highly skilled Senior Data Analyst to join our growing analytics team. The ideal candidate will have strong experience in data analysis, visualization, and business intelligence tools. You will be responsible for analyzing complex datasets, creating dashboards, and providing actionable insights to drive business decisions. This role requires expertise in SQL, Python, and data visualization platforms.",
              requirements: [
                "Bachelor's degree in Computer Science, Statistics, or related field",
                "5+ years of experience in data analysis",
                "Proficiency in SQL, Python, and R",
                "Experience with Tableau or Power BI",
                "Strong analytical and problem-solving skills"
              ]
            })}
            className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Senior Data Analyst - DataTech Solutions</div>
            <div className="text-sm text-gray-500 mt-1">Technology company seeking data analyst with 5+ years experience</div>
          </button>
          
          <button
            type="button"
            onClick={() => setJobPosting({
              company_name: "FinanceFlow Inc",
              position_title: "Data Scientist",
              job_description: "FinanceFlow Inc is looking for a talented Data Scientist to join our quantitative research team. You will develop machine learning models, perform statistical analysis, and work with large financial datasets. The role involves close collaboration with portfolio managers and risk analysts to develop predictive models that drive investment decisions.",
              requirements: [
                "Master's degree in Data Science, Statistics, or related field",
                "3+ years of experience in machine learning",
                "Strong programming skills in Python and R",
                "Experience with financial markets and data",
                "Knowledge of deep learning frameworks"
              ]
            })}
            className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">Data Scientist - FinanceFlow Inc</div>
            <div className="text-sm text-gray-500 mt-1">Financial services company looking for ML-focused data scientist</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoverLetterGenerator;