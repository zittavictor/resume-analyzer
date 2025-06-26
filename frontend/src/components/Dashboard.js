import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ selectedResume, onResumeUpdate }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedResume) {
      fetchAnalysis();
    }
  }, [selectedResume]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get existing analysis
      try {
        const response = await axios.get(`${API}/resume/${selectedResume.id}/analysis`);
        setAnalysis(response.data);
      } catch (err) {
        // If no analysis exists, create one
        if (err.response?.status === 404) {
          await generateAnalysis();
        } else {
          throw err;
        }
      }
    } catch (error) {
      console.error("Error fetching analysis:", error);
      setError("Failed to load resume analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API}/resume/${selectedResume.id}/analyze`);
      setAnalysis(response.data);
    } catch (error) {
      console.error("Error generating analysis:", error);
      setError("Failed to generate resume analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getScoreText = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Needs Improvement";
    return "Poor";
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
            Please select a resume from the dropdown above or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedResume.personal_info?.name || "Resume"} Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(selectedResume.updated_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {loading ? "Analyzing..." : "Refresh Analysis"}
          </button>
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

      {/* Loading State */}
      {loading && !analysis && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* ATS Score */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">ATS Score</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(analysis.ats_score)}`}>
                  {Math.round(analysis.ats_score)}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {getScoreText(analysis.ats_score)}
                  </p>
                  <p className="text-sm text-gray-500">ATS Compatibility Score</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Out of 100</p>
              </div>
            </div>
          </div>

          {/* Section Scores */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Section Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(analysis.section_scores || {}).map(([section, score]) => (
                <div key={section} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {section.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8">{Math.round(score)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strengths
              </h2>
              <ul className="space-y-2">
                {analysis.strengths?.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Areas for Improvement
              </h2>
              <ul className="space-y-2">
                {analysis.weaknesses?.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Missing Information */}
          {analysis.missing_information?.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <svg className="h-5 w-5 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Missing Information
              </h2>
              <ul className="space-y-2">
                {analysis.missing_information.map((item, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Improvement Suggestions
            </h2>
            <ul className="space-y-2">
              {analysis.suggestions?.map((suggestion, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Keywords */}
          {analysis.keyword_optimization?.recommended_keywords?.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recommended Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.keyword_optimization.recommended_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Current keyword optimization: {analysis.keyword_optimization.keyword_density}%
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;