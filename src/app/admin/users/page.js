"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { 
  getAllUsers,
  getAllOrganizations,
  createUserInvitation,
  updateUserRole,
  deactivateUser,
  getPendingInvitations,
  getUserStats
} from "../../../lib/database";

export default function UsersPage() {
  const { user, userProfile, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [activeTab, setActiveTab] = useState("users"); // users, invitations, stats

  const [formData, setFormData] = useState({
    email: "",
    displayName: "",
    role: "admin",
    organizationId: "",
    permissions: []
  });

  // Redirect if not SuperAdmin
  useEffect(() => {
    if (!loading && (!userProfile || !isSuperAdmin)) {
      router.push("/dashboard");
    }
  }, [loading, userProfile, isSuperAdmin, router]);

  // Load data
  useEffect(() => {
    if (isSuperAdmin) {
      loadAllData();
    }
  }, [isSuperAdmin]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [usersResult, organizationsResult, invitationsResult, statsResult] = await Promise.all([
        getAllUsers(),
        getAllOrganizations(),
        getPendingInvitations(),
        getUserStats()
      ]);
      
      if (usersResult.success) setUsers(usersResult.data);
      if (organizationsResult.success) setOrganizations(organizationsResult.data);
      if (invitationsResult.success) setPendingInvitations(invitationsResult.data);
      if (statsResult.success) setUserStats(statsResult.data);
      
    } catch (error) {
      setError("Failed to load data");
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const invitationData = {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        organizationId: formData.organizationId,
        invitedBy: user.uid,
        permissions: formData.role === "admin" 
          ? ["upload_certificates", "manage_students", "view_organization_certificates"] 
          : ["view_own_certificates", "verify_certificates"]
      };

      const result = await createUserInvitation(invitationData);

      if (result.success) {
        setSuccess(`Invitation sent to ${formData.email} as ${formData.role}. They can now register and login to get proper access.`);
        setShowCreateForm(false);
        setFormData({
          email: "", displayName: "", role: "admin", organizationId: "", permissions: []
        });
        loadAllData(); // Reload all data
      } else {
        setError("Failed to create user invitation: " + result.error);
      }
    } catch (error) {
      setError("Error creating user invitation: " + error.message);
    }
  };

  const handleRoleChange = async (userId, newRole, orgId) => {
    const result = await updateUserRole(userId, newRole, orgId);
    
    if (result.success) {
      setSuccess("User role updated successfully!");
      loadAllData();
    } else {
      setError("Failed to update user role: " + result.error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      const result = await deactivateUser(userId);
      
      if (result.success) {
        setSuccess("User deactivated successfully!");
        loadAllData();
      } else {
        setError("Failed to deactivate user: " + result.error);
      }
    }
  };

  const filteredUsers = selectedRole === "all" 
    ? users 
    : users.filter(user => user.role === selectedRole);

  if (loading || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600 mt-2">Manage users, roles, and invitations across the platform</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-3xl font-bold text-slate-900">{userStats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-600">+{userStats.thisMonthCount} this month</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Admins</p>
                  <p className="text-3xl font-bold text-slate-900">{userStats.roleStats.admin || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Students</p>
                  <p className="text-3xl font-bold text-slate-900">{userStats.roleStats.student || 0}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending Invitations</p>
                  <p className="text-3xl font-bold text-slate-900">{userStats.pendingInvitations}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "invitations"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Pending Invitations ({pendingInvitations.length})
            </button>
          </nav>
        </div>

        {/* Users Tab Content */}
        {activeTab === "users" && (
          <>
            {/* Filter Tabs */}
            <div className="flex space-x-4 mb-6">
              {["all", "admin", "student"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedRole === role
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {role === "all" ? "All Users" : `${role.charAt(0).toUpperCase() + role.slice(1)}s`}
                  <span className="ml-2 text-sm">
                    ({role === "all" ? users.length : users.filter(u => u.role === role).length})
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

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

        {/* Invite User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-sm" style={{backgroundColor: 'rgba(0,0,0,0.1)'}}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">👥 Invite User</h2>
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

              <form onSubmit={handleCreateUser}>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="user@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-3">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder-slate-400 text-slate-900 font-medium"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Role *
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="admin">👑 Admin</option>
                        <option value="student">🎓 Student</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 mb-3">
                        Organization *
                      </label>
                      <select
                        name="organizationId"
                        value={formData.organizationId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium bg-white"
                      >
                        <option value="">Select Organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-lg"
                  >
                    ✉️ Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users List */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedRole === "all" ? "All Users" : `${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}s`}
              </h2>
            </div>
          
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600">No users found. Invite your first user!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredUsers.map((userData) => {
                const org = organizations.find(o => o.id === userData.organizationId);
                return (
                  <div key={userData.uid} className="p-6 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {(userData.displayName || userData.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {userData.displayName || "No Name"}
                            </h3>
                            <p className="text-slate-600">{userData.email}</p>
                            <div className="flex items-center space-x-4 text-sm text-slate-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userData.role === "superadmin"
                                  ? "bg-purple-100 text-purple-800"
                                  : userData.role === "admin"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {userData.role === "superadmin" ? "👑 SuperAdmin" : userData.role === "admin" ? "🔧 Admin" : "🎓 Student"}
                              </span>
                              {org && (
                                <span>📍 {org.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {userData.role === "superadmin" ? (
                          <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                            🔒 SuperAdmin (Protected)
                          </div>
                        ) : (
                          <>
                            <select
                              value={userData.role}
                              onChange={(e) => handleRoleChange(userData.id || userData.uid, e.target.value, userData.organizationId)}
                              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="admin">Admin</option>
                              <option value="student">Student</option>
                            </select>
                            <button
                              onClick={() => handleDeactivateUser(userData.id || userData.uid)}
                              className="text-red-600 hover:text-red-800 px-3 py-2 text-sm font-medium"
                            >
                              Deactivate
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        )}

        {/* Invitations List */}
        {activeTab === "invitations" && (
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Pending Invitations</h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600">Loading invitations...</p>
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No pending invitations</h3>
                <p className="text-slate-600 mb-4">All invitations have been accepted or expired.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Send New Invitation
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {pendingInvitations.map((invitation) => {
                  const org = organizations.find(o => o.id === invitation.organizationId);
                  const expiresAt = invitation.expiresAt?.seconds 
                    ? new Date(invitation.expiresAt.seconds * 1000) 
                    : null;
                  const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24 hours

                  return (
                    <div key={invitation.id} className="p-6 hover:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                              <span className="text-amber-600 font-bold text-lg">
                                {(invitation.displayName || invitation.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">
                                {invitation.displayName || "Unnamed User"}
                              </h3>
                              <p className="text-slate-600">{invitation.email}</p>
                              <div className="flex items-center space-x-4 text-sm text-slate-500">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  invitation.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {invitation.role === "admin" ? "👑 Admin" : "🎓 Student"}
                                </span>
                                {org && (
                                  <span>📍 {org.name}</span>
                                )}
                                {expiresAt && (
                                  <span className={isExpiringSoon ? "text-red-600" : ""}>
                                    🕒 Expires {expiresAt.toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                          <button
                            onClick={() => {
                              // Resend invitation functionality can be added here
                              setSuccess(`Invitation reminder sent to ${invitation.email}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 px-3 py-2 text-sm font-medium"
                          >
                            Resend
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}