import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ApplicationTracker({ currentUser }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchApplications();
    }
  }, [currentUser]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/applications/${currentUser}`);
      setApplications(response.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      sent: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sent' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const ApplicationCard = ({ application }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{application.position_title}</h3>
          <p className="text-md font-medium text-gray-700">{application.company_name}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          {getStatusBadge(application.status)}
          <span className="text-sm text-gray-500">
            {new Date(application.application_date).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Application ID</p>
          <p className="text-sm text-gray-900 font-mono">{application.id.substring(0, 8)}...</p>
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-600">Email Status</p>
          <p className="text-sm text-gray-900">
            {application.email_sent ? (
              <span className="text-green-600 font-medium">✓ Email Sent</span>
            ) : (
              <span className="text-yellow-600 font-medium">⏳ Pending</span>
            )}
          </p>
        </div>
      </div>

      {application.email_id && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600">Email ID</p>
          <p className="text-sm text-gray-900 font-mono">{application.email_id}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {application.cover_letter_id && (
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View Cover Letter
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500">
          Applied {new Date(application.application_date).toLocaleDateString()}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Application Tracker</h2>
          <button
            onClick={fetchApplications}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{applications.length}</div>
            <div className="text-sm text-blue-600">Total Applications</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'sent').length}
            </div>
            <div className="text-sm text-green-600">Sent</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {applications.filter(app => app.email_sent).length}
            </div>
            <div className="text-sm text-purple-600">Emails Sent</div>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Applications</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length > 0 ? (
        <div className="space-y-6">
          {filteredApplications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all' 
                ? "You haven't applied to any jobs yet. Start by searching for jobs!"
                : `No applications with status "${filterStatus}"`
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicationTracker;