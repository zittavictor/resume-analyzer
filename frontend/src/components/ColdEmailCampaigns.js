import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ColdEmailCampaigns({ currentUser }) {
  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyEmails, setNewCompanyEmails] = useState("");
  
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/companies/contacts`);
      setCompanies(response.data);
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newCompanyEmails.trim()) return;

    try {
      const emailList = newCompanyEmails.split(',').map(email => email.trim()).filter(email => email);
      
      const newCompany = {
        company_name: newCompanyName,
        email_addresses: emailList,
        department: "HR"
      };

      await axios.post(`${API}/companies/contacts`, newCompany);
      
      setNewCompanyName("");
      setNewCompanyEmails("");
      fetchCompanies();
      alert("Company added successfully!");
    } catch (error) {
      console.error("Error adding company:", error);
      alert("Error adding company. Please try again.");
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!campaignName.trim() || !emailSubject.trim() || !emailTemplate.trim() || selectedCompanies.length === 0) {
      alert("Please fill in all fields and select at least one company");
      return;
    }

    try {
      const campaignData = {
        user_id: currentUser,
        campaign_name: campaignName,
        email_subject: emailSubject,
        email_template: emailTemplate,
        target_companies: selectedCompanies
      };

      await axios.post(`${API}/email/campaign`, campaignData);
      
      // Reset form
      setCampaignName("");
      setEmailSubject("");
      setEmailTemplate("");
      setSelectedCompanies([]);
      setShowCreateForm(false);
      
      alert("Campaign created successfully!");
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign. Please try again.");
    }
  };

  const handleCompanySelect = (companyName) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyName)) {
        return prev.filter(name => name !== companyName);
      } else {
        return [...prev, companyName];
      }
    });
  };

  const defaultEmailTemplate = `Dear Hiring Manager,

I hope this email finds you well. My name is [Your Name], and I am a passionate professional with experience in [Your Field/Skills].

I am writing to express my interest in potential opportunities at [Company Name]. After researching your company, I am impressed by [specific company achievement/value], and I believe my skills in [relevant skills] would be a valuable addition to your team.

I have attached my resume for your review and would welcome the opportunity to discuss how I can contribute to your organization's continued success.

Key highlights of my background:
• [Achievement/skill 1]
• [Achievement/skill 2]
• [Achievement/skill 3]

I would be grateful for the chance to discuss potential opportunities or simply learn more about your company's vision and upcoming projects.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
[Your Name]
[Your Contact Information]`;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Cold Email Campaigns</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Cancel' : 'Create Campaign'}
          </button>
        </div>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Email Campaign</h3>
          
          <form onSubmit={handleCreateCampaign} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., Tech Companies Outreach Q1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g., Exploring Opportunities at [Company Name]"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="emailTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                Email Template *
              </label>
              <textarea
                id="emailTemplate"
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                placeholder="Enter your email template..."
                rows="12"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setEmailTemplate(defaultEmailTemplate)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Use Default Template
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Target Companies * ({selectedCompanies.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {companies.length > 0 ? (
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <label key={company.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company.company_name)}
                          onChange={() => handleCompanySelect(company.company_name)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {company.company_name} ({company.email_addresses.join(', ')})
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No companies available. Add companies first.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={selectedCompanies.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Create Campaign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Company Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Company Contact</h3>
        
        <form onSubmit={handleAddCompany} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newCompanyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name *
              </label>
              <input
                type="text"
                id="newCompanyName"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g., TechCorp Inc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newCompanyEmails" className="block text-sm font-medium text-gray-700 mb-1">
                Email Addresses * (comma-separated)
              </label>
              <input
                type="text"
                id="newCompanyEmails"
                value={newCompanyEmails}
                onChange={(e) => setNewCompanyEmails(e.target.value)}
                placeholder="hr@company.com, jobs@company.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Company
            </button>
          </div>
        </form>
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Company Contacts ({companies.length})
        </h3>
        
        {companies.length > 0 ? (
          <div className="grid gap-4">
            {companies.map((company) => (
              <div key={company.id} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">{company.company_name}</h4>
                    <p className="text-sm text-gray-600">
                      Emails: {company.email_addresses.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      Added: {new Date(company.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {company.department}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies added</h3>
            <p className="mt-1 text-sm text-gray-500">Add company contacts to start creating email campaigns.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ColdEmailCampaigns;