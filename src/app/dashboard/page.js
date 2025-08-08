"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";

export default function Dashboard() {
  const { user, userProfile, loading, isAuthenticated, isSuperAdmin, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to NFTicate Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your certificates and verify authenticity
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">User Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <p className="text-slate-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <p className="text-slate-900">{user?.displayName || "Not set"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <p className="text-slate-900 capitalize">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {userProfile?.role || "student"}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                User ID
              </label>
              <p className="text-slate-900 font-mono text-sm">{user?.uid}</p>
            </div>
          </div>
        </div>

        {/* Role-specific Quick Actions */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4">🔧 SuperAdmin Controls</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/admin/organizations" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors block">
                <div className="font-semibold">🏢 Organizations</div>
                <div className="text-sm text-blue-100 mt-1">Create and manage institutions</div>
              </a>
              <a href="/admin/users" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors block">
                <div className="font-semibold">👥 Users</div>
                <div className="text-sm text-blue-100 mt-1">Invite admins and manage roles</div>
              </a>
              <a href="/admin" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors block">
                <div className="font-semibold">📊 Analytics</div>
                <div className="text-sm text-blue-100 mt-1">View platform statistics</div>
              </a>
            </div>
          </div>
        )}

        {(isAdmin && !isSuperAdmin) && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl p-6 text-white">
            <h2 className="text-xl font-bold mb-4">🎓 Admin Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/dashboard/issue" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors block">
                <div className="font-semibold">📋 Issue Certificates</div>
                <div className="text-sm text-emerald-100 mt-1">Create new certificates for students</div>
              </a>
              <a href="/dashboard/organization" className="bg-white/10 hover:bg-white/20 rounded-lg p-4 transition-colors block">
                <div className="font-semibold">🏢 Organization</div>
                <div className="text-sm text-emerald-100 mt-1">Manage your institution</div>
              </a>
            </div>
          </div>
        )}

        {/* Quick Actions for all users */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <a href="/verify" className="text-blue-600 font-medium hover:text-blue-700">
              Start Verification →
            </a>
          </div>

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
            <a href="/dashboard/certificates" className="text-emerald-600 font-medium hover:text-emerald-700">
              View Certificates →
            </a>
          </div>

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
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Certificate verified successfully</p>
                <p className="text-xs text-slate-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Profile updated</p>
                <p className="text-xs text-slate-600">1 day ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-900">Welcome to NFTicate!</p>
                <p className="text-xs text-slate-600">Account created</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}