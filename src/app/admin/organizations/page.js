"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { 
  getAllOrganizations, 
  createOrganization, 
  updateOrganization,
  getChildOrganizations 
} from "../../../lib/database";

export default function OrganizationsPage() {
  const { user, userProfile, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "university",
    parentOrgId: null,
    level: "institution",
    email: "",
    phone: "",
    address: "",
    website: ""
  });

  // Redirect if not SuperAdmin
  useEffect(() => {
    if (!loading && (!userProfile || !isSuperAdmin)) {
      router.push("/dashboard");
    }
  }, [loading, userProfile, isSuperAdmin, router]);

  // Load organizations
  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [isSuperAdmin]);

  const loadOrganizations = async () => {
    setIsLoading(true);
    const result = await getAllOrganizations();
    if (result.success) {
      setOrganizations(result.data);
    } else {
      setError("Failed to load organizations");
    }
    setIsLoading(false);
  };

  const handleEditOrg = (org) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      type: org.type,
      parentOrgId: org.parentOrgId || "",
      level: org.level,
      email: org.contactInfo?.email || "",
      phone: org.contactInfo?.phone || "",
      address: org.contactInfo?.address || "",
      website: org.contactInfo?.website || ""
    });
    setShowEditForm(true);
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    setShowDetailsModal(true);
  };

  const handleUpdateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const orgData = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      type: formData.type,
      parentOrgId: formData.parentOrgId || null,
      level: formData.level,
      contactInfo: {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website
      }
    };

    const result = await updateOrganization(selectedOrg.id, orgData);
    
    if (result.success) {
      setSuccess("Organization updated successfully!");
      setShowEditForm(false);
      setSelectedOrg(null);
      setFormData({
        name: "", type: "university", parentOrgId: null, level: "institution",
        email: "", phone: "", address: "", website: ""
      });
      loadOrganizations();
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const orgData = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      type: formData.type,
      parentOrgId: formData.parentOrgId || null,
      level: formData.level,
      contactInfo: {
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website
      },
      settings: {
        certificateIdFormat: `{ORG}-{YEAR}-{NUMBER}`,
        qrCodeTemplate: "standard",
        approvalRequired: false,
        allowedCertTypes: ["academic", "training", "achievement"]
      },
      createdBy: user.uid
    };

    const result = await createOrganization(orgData);
    
    if (result.success) {
      setSuccess("Organization created successfully!");
      setShowCreateForm(false);
      setFormData({
        name: "", type: "university", parentOrgId: null, level: "institution",
        email: "", phone: "", address: "", website: ""
      });
      loadOrganizations();
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  if (loading || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Organizations</h1>
            <p className="text-slate-600 mt-2">Manage all organizations and institutions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            + Create Organization
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">🏢 Create New Organization</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateOrganization}>
                {/* Modal Body */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="e.g., Universitas Indonesia"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Organization Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="university">🎓 University</option>
                        <option value="school">🏫 School</option>
                        <option value="company">🏢 Company</option>
                        <option value="training">📚 Training Center</option>
                        <option value="ukm">🎯 Student Organization</option>
                        <option value="community">🤝 Community</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Level
                      </label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="institution">Institution</option>
                        <option value="faculty">Faculty</option>
                        <option value="department">Department</option>
                        <option value="club">Club/Organization</option>
                        <option value="division">Division</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Parent Organization
                      </label>
                      <select
                        name="parentOrgId"
                        value={formData.parentOrgId || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="">No Parent (Top Level)</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="admin@organization.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="+62-xxx-xxxx"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="Organization address"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="https://organization.com"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-8 py-6 flex justify-end space-x-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "✨ Create Organization"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Form Modal */}
        {showEditForm && selectedOrg && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">✏️ Edit Organization</h2>
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="text-green-100 hover:text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleUpdateOrganization}>
                {/* Modal Body */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Organization Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="e.g., Universitas Indonesia"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Organization Type *
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="university">🎓 University</option>
                        <option value="school">🏫 School</option>
                        <option value="company">🏢 Company</option>
                        <option value="training">📚 Training Center</option>
                        <option value="ukm">🎯 Student Organization</option>
                        <option value="community">🤝 Community</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Level
                      </label>
                      <select
                        name="level"
                        value={formData.level}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="institution">Institution</option>
                        <option value="faculty">Faculty</option>
                        <option value="department">Department</option>
                        <option value="club">Club/Organization</option>
                        <option value="division">Division</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Parent Organization
                      </label>
                      <select
                        name="parentOrgId"
                        value={formData.parentOrgId || ""}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="">No Parent (Top Level)</option>
                        {organizations.filter(org => org.id !== selectedOrg.id).map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="admin@organization.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                        placeholder="+62-xxx-xxxx"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="Organization address"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="https://organization.com"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-slate-50 px-8 py-6 flex justify-end space-x-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "💾 Update Organization"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedOrg && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {selectedOrg.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">📋 Organization Details</h2>
                      <p className="text-indigo-100 text-sm">{selectedOrg.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-indigo-100 hover:text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Organization Name</label>
                        <p className="text-slate-900 font-medium">{selectedOrg.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Type</label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize">
                          {selectedOrg.type}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Level</label>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-800 capitalize">
                          {selectedOrg.level}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedOrg.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedOrg.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                      {selectedOrg.slug && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Slug</label>
                          <p className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-1 rounded">{selectedOrg.slug}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      {selectedOrg.contactInfo?.email && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Email</label>
                          <p className="text-slate-900 font-medium">{selectedOrg.contactInfo.email}</p>
                        </div>
                      )}
                      {selectedOrg.contactInfo?.phone && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Phone</label>
                          <p className="text-slate-900 font-medium">{selectedOrg.contactInfo.phone}</p>
                        </div>
                      )}
                      {selectedOrg.contactInfo?.website && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Website</label>
                          <a 
                            href={selectedOrg.contactInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 font-medium underline"
                          >
                            {selectedOrg.contactInfo.website}
                          </a>
                        </div>
                      )}
                      {selectedOrg.contactInfo?.address && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Address</label>
                          <p className="text-slate-900 font-medium">{selectedOrg.contactInfo.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-slate-50 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      System Information
                    </h3>
                    <div className="space-y-4">
                      {selectedOrg.createdAt && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Created Date</label>
                          <p className="text-slate-900 font-medium">
                            {new Date(selectedOrg.createdAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedOrg.updatedAt && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Last Updated</label>
                          <p className="text-slate-900 font-medium">
                            {new Date(selectedOrg.updatedAt).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      {selectedOrg.parentOrgId && (
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Parent Organization</label>
                          <p className="text-slate-900 font-medium">
                            {organizations.find(org => org.id === selectedOrg.parentOrgId)?.name || 'Unknown'}
                          </p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1">Organization ID</label>
                        <p className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-1 rounded">{selectedOrg.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  {selectedOrg.settings && (
                    <div className="bg-slate-50 rounded-2xl p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Configuration
                      </h3>
                      <div className="space-y-4">
                        {selectedOrg.settings.certificateIdFormat && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1">Certificate ID Format</label>
                            <p className="text-slate-900 font-mono text-sm bg-slate-100 px-3 py-1 rounded">
                              {selectedOrg.settings.certificateIdFormat}
                            </p>
                          </div>
                        )}
                        {selectedOrg.settings.qrCodeTemplate && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1">QR Code Template</label>
                            <p className="text-slate-900 font-medium capitalize">{selectedOrg.settings.qrCodeTemplate}</p>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-slate-600 mb-1">Approval Required</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            selectedOrg.settings.approvalRequired 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedOrg.settings.approvalRequired ? '⚠️ Yes' : '✅ No'}
                          </span>
                        </div>
                        {selectedOrg.settings.allowedCertTypes && (
                          <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-1">Allowed Certificate Types</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedOrg.settings.allowedCertTypes.map((type, index) => (
                                <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 px-8 py-6 flex justify-end space-x-4 border-t border-slate-200">
                <button
                  onClick={() => handleEditOrg(selectedOrg)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Organization</span>
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Organizations List */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">All Organizations</h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading organizations...</p>
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600">No organizations found. Create your first organization!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {organizations.map((org) => (
                <div key={org.id} className="p-6 hover:bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {org.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{org.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <span className="capitalize">{org.type}</span>
                            <span>•</span>
                            <span className="capitalize">{org.level}</span>
                            {org.parentOrgId && (
                              <>
                                <span>•</span>
                                <span>Child Organization</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        {org.contactInfo?.email && (
                          <div>
                            <span className="font-medium text-slate-700">Email:</span>
                            <p className="text-slate-600">{org.contactInfo.email}</p>
                          </div>
                        )}
                        {org.contactInfo?.phone && (
                          <div>
                            <span className="font-medium text-slate-700">Phone:</span>
                            <p className="text-slate-600">{org.contactInfo.phone}</p>
                          </div>
                        )}
                        {org.contactInfo?.website && (
                          <div>
                            <span className="font-medium text-slate-700">Website:</span>
                            <p className="text-slate-600">{org.contactInfo.website}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-slate-700">Status:</span>
                          <p className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            org.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditOrg(org)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button 
                        onClick={() => handleViewDetails(org)}
                        className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}