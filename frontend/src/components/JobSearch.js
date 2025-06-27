import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function JobSearch({ selectedResume, onJobApplication }) {
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [jobs, setJobs] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState(new Set());
  const [applyingJobs, setApplyingJobs] = useState(false);

  useEffect(() => {
    fetchRecentJobs();
  }, []);

  const fetchRecentJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs/recent?limit=20`);
      setRecentJobs(response.data);
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
    }
  };

  const handleJobSearch = async (e) => {
    e.preventDefault();
    if (!searchKeywords.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/jobs/search`, {
        keywords: searchKeywords,
        location: searchLocation || null,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        limit: 20
      });

      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error("Error searching jobs:", error);
      alert("Error searching jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jobId) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleApplyToSelected = async () => {
    if (!selectedResume) {
      alert("Please select a resume first");
      return;
    }

    if (selectedJobs.size === 0) {
      alert("Please select at least one job to apply to");
      return;
    }

    setApplyingJobs(true);
    try {
      const response = await axios.post(`${API}/jobs/apply`, {
        user_id: selectedResume.user_id,
        resume_id: selectedResume.id,
        job_ids: Array.from(selectedJobs),
        send_emails: true
      });

      alert(`Successfully applied to ${response.data.count} jobs!`);
      setSelectedJobs(new Set());
      
      if (onJobApplication) {
        onJobApplication(response.data.applications);
      }
    } catch (error) {
      console.error("Error applying to jobs:", error);
      alert("Error applying to jobs. Please try again.");
    } finally {
      setApplyingJobs(false);
    }
  };

  const JobCard = ({ job, isSelected, onSelect, showSelect = true }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} transition-all duration-200`}>
      {showSelect && (
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(job.id)}
            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-600">Select for application</label>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{job.title}</h3>
        <span className="text-sm text-gray-500 ml-4">
          {new Date(job.posted_date).toLocaleDateString()}
        </span>
      </div>
      
      <div className="mb-3">
        <p className="text-md font-medium text-gray-700">{job.company}</p>
        <p className="text-sm text-gray-600">{job.location}</p>
      </div>
      
      {(job.salary_min || job.salary_max) && (
        <div className="mb-3">
          <p className="text-sm font-medium text-green-600">
            ${job.salary_min ? job.salary_min.toLocaleString() : 'N/A'} - 
            ${job.salary_max ? job.salary_max.toLocaleString() : 'N/A'} {job.salary_currency}
          </p>
        </div>
      )}
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 line-clamp-3">
          {job.description ? job.description.substring(0, 200) + (job.description.length > 200 ? '...' : '') : 'No description available'}
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {job.source}
        </span>
        
        {job.application_url && (
          <a
            href={job.application_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View Job →
          </a>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Search & Auto-Apply</h2>
        
        {/* Search Form */}
        <form onSubmit={handleJobSearch} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Keywords *
              </label>
              <input
                type="text"
                id="keywords"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                placeholder="e.g., software engineer, marketing"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                placeholder="e.g., New York, Remote"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Salary
              </label>
              <input
                type="number"
                id="salary"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search Jobs'
              )}
            </button>
            
            {selectedJobs.size > 0 && (
              <button
                type="button"
                onClick={handleApplyToSelected}
                disabled={applyingJobs || !selectedResume}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {applyingJobs ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  `Apply to ${selectedJobs.size} Selected Job${selectedJobs.size > 1 ? 's' : ''}`
                )}
              </button>
            )}
          </div>
        </form>

        {!selectedResume && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  Please select a resume to enable job applications.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {jobs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Search Results ({jobs.length} jobs found)
          </h3>
          <div className="grid gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJobs.has(job.id)}
                onSelect={handleJobSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Jobs ({recentJobs.length} jobs)
          </h3>
          <div className="grid gap-6">
            {recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={selectedJobs.has(job.id)}
                onSelect={handleJobSelect}
              />
            ))}
          </div>
        </div>
      )}

      {jobs.length === 0 && recentJobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M8 6v10a2 2 0 002 2h4a2 2 0 002-2V6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
          <p className="mt-1 text-sm text-gray-500">Search for jobs using the form above.</p>
        </div>
      )}
    </div>
  );
}

export default JobSearch;