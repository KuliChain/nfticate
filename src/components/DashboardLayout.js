"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../lib/auth";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, userProfile, isSuperAdmin, isAdmin, hasBasicAuth, loading } = useAuth();
  const router = useRouter();

  const handleSignOutClick = () => {
    setShowSignOutModal(true);
  };

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      const result = await signOutUser();
      if (result.success) {
        setShowSignOutModal(false);
        setSidebarOpen(false);
        router.push("/");
      }
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCancelSignOut = () => {
    setShowSignOutModal(false);
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
        </svg>
      ),
      roles: ["student", "admin", "superadmin"]
    },
    {
      name: "My Certificates",
      href: "/dashboard/certificates",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      roles: ["student"]
    },
    {
      name: "Certificate Management", 
      href: "/dashboard/certificates",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      roles: ["admin", "superadmin"]
    },
    {
      name: "Verify Certificate",
      href: "/verify",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      roles: ["student", "admin", "superadmin"]
    },
    {
      name: "Manage Organizations",
      href: "/admin/organizations", 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      roles: ["superadmin"]
    },
    {
      name: "Issue Certificates",
      href: "/dashboard/issue",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      roles: ["admin", "superadmin"]
    },
    {
      name: "Manage Users",
      href: "/admin/users",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      roles: ["superadmin"]
    }
  ];

  const userRole = userProfile?.role || "student";
  const visibleNavigation = navigation.filter(item => item.roles.includes(userRole));

  // Show loading if auth is still loading
  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity duration-300"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo - Compact */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NFTicate</span>
            </div>
            
            {/* Close button for mobile */}
            <button
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile - Move to Top */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <div className="flex items-center">
              {user?.photoURL ? (
                <Image 
                  src={user.photoURL} 
                  alt="Profile"
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 
                     user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              )}
              <div className="ml-2 flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.displayName || user?.email || "User"}
                </p>
                <p className="text-xs text-slate-600 truncate capitalize">
                  {userProfile?.role || "Loading..."}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation - Compact */}
          <nav className="flex-1 px-3 py-3 space-y-1 min-h-0">
            {visibleNavigation.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-200 text-left"
              >
                <span className="mr-2.5">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Sign Out Button - Fixed at Bottom */}
          <div className="px-3 pb-3 flex-shrink-0 bg-white border-t border-slate-200">
            <button
              onClick={handleSignOutClick}
              className="flex items-center w-full px-3 py-3 mt-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 hover:text-red-800 transition-all duration-200 border border-red-200 hover:border-red-300 bg-red-25"
            >
              <svg className="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-semibold">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar for mobile - Compact */}
        <div className="bg-white shadow-sm border-b border-slate-200 lg:hidden sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo in mobile header */}
            <div className="flex items-center">
              <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="ml-2 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">NFTicate</span>
            </div>
            
            {/* User avatar + Sign Out Button - ALWAYS VISIBLE */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                {user?.photoURL ? (
                  <Image 
                    src={user.photoURL} 
                    alt="Profile"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 
                       user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </button>
              
              {/* QUICK SIGN OUT - Mobile Header */}
              <button
                onClick={handleSignOutClick}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCancelSignOut}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 animate-modal-appear bg-white">
              
              {/* Header */}
              <div className="text-center px-6 pt-8 pb-6">
                {/* Warning Icon */}
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                
                {/* Title */}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  Konfirmasi Sign Out
                </h3>
                
                {/* Description */}
                <p className="text-slate-600 mb-2">
                  Apakah Anda yakin ingin keluar dari akun Anda?
                </p>
                
                {/* User Info */}
                <div className="flex items-center justify-center space-x-2 mt-4 p-3 bg-slate-50 rounded-lg">
                  {user?.photoURL ? (
                    <Image 
                      src={user.photoURL} 
                      alt="Profile"
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 
                         user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-slate-600">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 px-6 pb-6">
                {/* Cancel Button */}
                <button
                  onClick={handleCancelSignOut}
                  disabled={isSigningOut}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                
                {/* Confirm Sign Out Button */}
                <button
                  onClick={handleConfirmSignOut}
                  disabled={isSigningOut}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSigningOut ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Ya, Sign Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes modal-appear {
          0% { opacity: 0; transform: scale(0.8) translateY(50px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}