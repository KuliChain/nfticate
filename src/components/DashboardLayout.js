"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { signOutUser } from "../lib/auth";

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, userProfile, isSuperAdmin, isAdmin, hasBasicAuth } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      router.push("/");
    }
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
    }
  ];

  const adminNavigation = [
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
  const visibleAdminNavigation = adminNavigation.filter(item => item.roles.includes(userRole));

  // Don't render navigation until userProfile is loaded to prevent flickering
  if (!userProfile && user) {
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
          <div className="fixed inset-0 bg-slate-600 bg-opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-slate-200">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="ml-3 text-lg font-bold text-slate-800">NFTicate</span>
          </div>


          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto min-h-0">
            {/* Main Navigation */}
            <div className="space-y-1">
              {visibleNavigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors text-left"
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>

            {/* Admin Navigation */}
            {visibleAdminNavigation.length > 0 && (
              <>
                <div className="pt-4 space-y-1">
                  {visibleAdminNavigation.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className="flex items-center w-full px-3 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors text-left"
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* Bottom section - User Profile & Logout */}
          <div className="border-t border-slate-200 flex-shrink-0 mt-auto">
            {hasBasicAuth && (
              <>
                {/* User Profile */}
                <div className="px-4 py-3">
                  <div className="flex items-center">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {(user.displayName || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-2 flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {userProfile?.role || "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="px-4 pb-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile */}
        <div className="bg-white shadow-sm border-b border-slate-200 lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="ml-2 text-lg font-bold text-slate-800">NFTicate</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}