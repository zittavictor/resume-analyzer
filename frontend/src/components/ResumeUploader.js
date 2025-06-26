import React, { useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ResumeUploader = ({ currentUser, onResumeUploaded }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please select a PDF, TXT, DOC, or DOCX file");
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', currentUser);
      
      const response = await axios.post(`${API}/resume/parse-upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadResult(response.data);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Notify parent component
      if (onResumeUploaded) {
        onResumeUploaded();
      }
      
    } catch (error) {
      console.error("Error uploading resume:", error);
      setError(error.response?.data?.detail || "Failed to upload and parse resume. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResult(null);
    setError(null);
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Resume</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your existing resume and our AI will automatically parse and organize the information
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Resume File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF, TXT, DOC, or DOCX (MAX. 10MB)</p>
                </div>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          </div>

          {/* Selected File Info */}
          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">{file.name}</p>
                    <p className="text-xs text-blue-700">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={resetUpload}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

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

          {/* Upload Button */}
          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {uploading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                "Upload & Parse Resume"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Upload Success */}
      {uploadResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-medium text-gray-900">Upload Successful!</h2>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="text-sm text-green-700">
              Your resume has been successfully uploaded and parsed. You can now edit it in the Resume Editor.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.personal_info?.name || "Not detected"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.personal_info?.email || "Not detected"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.personal_info?.phone || "Not detected"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Experience Entries:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.experience?.length || 0}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Education Entries:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.education?.length || 0}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Skills:</span>
                <span className="ml-2 text-gray-600">
                  {uploadResult.skills?.length || 0}
                </span>
              </div>
            </div>

            {uploadResult.skills?.length > 0 && (
              <div>
                <span className="font-medium text-gray-700 text-sm">Detected Skills:</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {uploadResult.skills.slice(0, 10).map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                  {uploadResult.skills.length > 10 && (
                    <span className="text-xs text-gray-500">
                      +{uploadResult.skills.length - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={() => window.location.href = '/editor'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Edit Resume
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              View Dashboard
            </button>
            <button
              onClick={resetUpload}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">How it works</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-3 px-2.5 py-0.5 rounded-full">1</span>
            <p>Upload your resume in PDF, TXT, DOC, or DOCX format</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-3 px-2.5 py-0.5 rounded-full">2</span>
            <p>Our AI will automatically extract and organize your information</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-3 px-2.5 py-0.5 rounded-full">3</span>
            <p>Review and edit the parsed information in the Resume Editor</p>
          </div>
          <div className="flex items-start">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-3 px-2.5 py-0.5 rounded-full">4</span>
            <p>Get your ATS score and optimization suggestions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploader;