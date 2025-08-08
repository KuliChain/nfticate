"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="ml-3 text-xl font-bold text-slate-800">Admin Panel</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      <button className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-slate-600 hover:text-slate-800 px-3 py-2 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}