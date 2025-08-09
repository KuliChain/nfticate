"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  getCertificatesByRecipient, 
  getCertificatesByOrganization, 
  getVerificationLogs 
} from "../../lib/database";

export default function Dashboard() {
  const { user, userProfile, loading, isAuthenticated, isSuperAdmin, isAdmin } = useAuth();
  const router = useRouter();
  
  // Recent activity state
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      loadRecentActivities();
    }
  }, [isAuthenticated, userProfile]);

  const loadRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      const activities = [];

      if (userProfile?.role === "student") {
        // For students: show their certificate activities
        const certsResult = await getCertificatesByRecipient(user.email);
        if (certsResult.success) {
          certsResult.data.forEach(cert => {
            activities.push({
              id: `cert-${cert.id}`,
              type: "certificate_issued",
              title: "Certificate received",
              description: cert.certificateInfo?.title || "Certificate",
              timestamp: cert.createdAt,
              icon: "certificate",
              color: "emerald"
            });

            // Add verification activities if available
            if (cert.verificationCount > 0) {
              activities.push({
                id: `verify-${cert.id}`,
                type: "certificate_verified",
                title: "Certificate verified",
                description: `${cert.certificateInfo?.title} verified ${cert.verificationCount} times`,
                timestamp: cert.lastVerificationAt || cert.createdAt,
                icon: "verified",
                color: "green"
              });
            }
          });
        }
      } else if (isAdmin || isSuperAdmin) {
        // For admin/superadmin: show organization certificate activities
        let certsResult;
        if (isSuperAdmin) {
          // TODO: Get recent certificates from all organizations
          // For now, just show profile creation
          activities.push({
            id: "profile-created",
            type: "profile_created",
            title: "Account created",
            description: "Welcome to NFTicate!",
            timestamp: userProfile.createdAt || new Date(),
            icon: "user",
            color: "blue"
          });
        } else {
          certsResult = await getCertificatesByOrganization(userProfile.organizationId);
          if (certsResult.success) {
            certsResult.data.slice(0, 10).forEach(cert => {
              activities.push({
                id: `cert-issued-${cert.id}`,
                type: "certificate_issued",
                title: "Certificate issued",
                description: `${cert.certificateInfo?.title} to ${cert.recipientInfo?.name}`,
                timestamp: cert.createdAt,
                icon: "certificate",
                color: "emerald"
              });
            });
          }
        }
      }

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? new Date(a.timestamp.seconds * 1000) : new Date(a.timestamp);
        const timeB = b.timestamp?.seconds ? new Date(b.timestamp.seconds * 1000) : new Date(b.timestamp);
        return timeB - timeA;
      });

      setRecentActivities(activities.slice(0, 5)); // Show last 5 activities
    } catch (error) {
      console.error("Error loading recent activities:", error);
      // Fallback to showing profile creation
      setRecentActivities([{
        id: "profile-created",
        type: "profile_created", 
        title: "Account created",
        description: "Welcome to NFTicate!",
        timestamp: userProfile?.createdAt || new Date(),
        icon: "user",
        color: "blue"
      }]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Just now";
    
    const date = timestamp?.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type, color) => {
    const baseClasses = `w-6 h-6 text-${color}-600`;
    
    switch (type) {
      case "certificate_issued":
      case "certificate_received":
        return (
          <svg className={baseClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "certificate_verified":
        return (
          <svg className={baseClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case "profile_created":
      default:
        return (
          <svg className={baseClasses} fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 lg:space-y-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Welcome to NFTicate Dashboard
          </h1>
          <p className="text-lg lg:text-xl text-slate-600 max-w-3xl leading-relaxed">
            Manage your certificates and verify authenticity with blockchain security
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">User Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Email
              </label>
              <p className="text-lg text-slate-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Display Name
              </label>
              <p className="text-lg text-slate-900">{user?.displayName || "Not set"}</p>
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                Role
              </label>
              <p className="text-slate-900 capitalize">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                  {userProfile?.role || "student"}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-base font-semibold text-slate-700 mb-2">
                User ID
              </label>
              <p className="text-slate-900 font-mono text-base">{user?.uid}</p>
            </div>
          </div>
        </div>

        {/* Role-specific Quick Actions */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">🔧 SuperAdmin Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => router.push("/admin/organizations")} 
                className="bg-white/10 hover:bg-white/20 rounded-xl p-6 transition-all duration-300 text-left w-full hover:scale-105 hover:shadow-lg"
              >
                <div className="text-xl font-bold mb-2">🏢 Organizations</div>
                <div className="text-base text-blue-100">Create and manage institutions</div>
              </button>
              <button 
                onClick={() => router.push("/admin/users")} 
                className="bg-white/10 hover:bg-white/20 rounded-xl p-6 transition-all duration-300 text-left w-full hover:scale-105 hover:shadow-lg"
              >
                <div className="text-xl font-bold mb-2">👥 Users</div>
                <div className="text-base text-blue-100">Invite admins and manage roles</div>
              </button>
            </div>
          </div>
        )}

        {(isAdmin && !isSuperAdmin) && (
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-2xl">
            <h2 className="text-2xl lg:text-3xl font-bold mb-6">🎓 Admin Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button 
                onClick={() => router.push("/dashboard/issue")} 
                className="bg-white/10 hover:bg-white/20 rounded-xl p-6 transition-all duration-300 text-left w-full hover:scale-105 hover:shadow-lg"
              >
                <div className="text-xl font-bold mb-2">📋 Issue Certificates</div>
                <div className="text-base text-emerald-100">Create new certificates for students</div>
              </button>
              <button 
                onClick={() => router.push("/dashboard/certificates")} 
                className="bg-white/10 hover:bg-white/20 rounded-xl p-6 transition-all duration-300 text-left w-full hover:scale-105 hover:shadow-lg"
              >
                <div className="text-xl font-bold mb-2">🏢 Manage Certificates</div>
                <div className="text-base text-emerald-100">View and manage organization certificates</div>
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions - Role-based */}
        <div className={`grid grid-cols-1 gap-6 ${
          isSuperAdmin ? 'md:grid-cols-3' : 
          isAdmin ? 'md:grid-cols-2' : 
          'md:grid-cols-3'
        }`}>
          {/* Verify Certificate - All users */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-slate-900">Verify Certificate</h3>
            </div>
            <p className="text-slate-600 mb-4">Check the authenticity of any certificate</p>
            <button 
              onClick={() => router.push("/verify")} 
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Start Verification →
            </button>
          </div>

          {/* My Certificates - Only for Students */}
          {userProfile?.role === "student" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-slate-900">My Certificates</h3>
              </div>
              <p className="text-slate-600 mb-4">View all your verified certificates</p>
              <button 
                onClick={() => router.push("/dashboard/certificates")} 
                className="text-emerald-600 font-medium hover:text-emerald-700"
              >
                View Certificates →
              </button>
            </div>
          )}

          {/* Certificate Management - Admin & SuperAdmin */}
          {(isAdmin || isSuperAdmin) && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${isSuperAdmin ? 'bg-purple-100' : 'bg-emerald-100'} rounded-lg flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${isSuperAdmin ? 'text-purple-600' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="ml-4 text-lg font-semibold text-slate-900">
                  {isSuperAdmin ? "Certificate Management" : "Organization Certificates"}
                </h3>
              </div>
              <p className="text-slate-600 mb-4">
                {isSuperAdmin 
                  ? "Manage certificates across all organizations by programs" 
                  : "Manage certificates issued by your organization"
                }
              </p>
              <button 
                onClick={() => router.push("/dashboard/certificates")} 
                className={`font-medium ${isSuperAdmin ? 'text-purple-600 hover:text-purple-700' : 'text-emerald-600 hover:text-emerald-700'}`}
              >
                Manage Certificates →
              </button>
            </div>
          )}

          {/* Profile Settings - All users */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="ml-4 text-lg font-semibold text-slate-900">Profile Settings</h3>
            </div>
            <p className="text-slate-600 mb-4">Manage your account preferences</p>
            <button className="text-amber-600 font-medium hover:text-amber-700">
              Open Settings →
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-6">Recent Activity</h2>
          
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl hover:shadow-md transition-all duration-300">
                  <div className={`w-12 h-12 bg-${activity.color}-100 rounded-xl flex items-center justify-center shadow-md`}>
                    {getActivityIcon(activity.type, activity.color)}
                  </div>
                  <div className="ml-4">
                    <p className="text-base font-semibold text-slate-900">{activity.title}</p>
                    <p className="text-sm text-slate-600 mb-1">{activity.description}</p>
                    <p className="text-sm text-slate-500">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-600">No recent activity</p>
              <p className="text-base text-slate-500 mt-2">Your activities will appear here</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}