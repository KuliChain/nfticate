"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { getCertificatesByOrganization, getCertificatesByRecipient, getCertificatesByStatus } from "../../../lib/database";

export default function MyCertificates() {
  const { user, userProfile, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, verified, expired
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userProfile) {
      loadCertificates();
    }
  }, [isAuthenticated, userProfile, filter]);

  const loadCertificates = async () => {
    setIsLoading(true);
    setError("");

    try {
      let result;

      if (isSuperAdmin) {
        // SuperAdmin sees all certificates
        if (filter === "all") {
          // Get certificates from all organizations (we need to implement this function)
          result = await getCertificatesByStatus("verified");
          if (result.success) {
            // Also get pending and expired
            const pendingResult = await getCertificatesByStatus("pending");
            const expiredResult = await getCertificatesByStatus("expired");
            
            const allCerts = [
              ...result.data,
              ...(pendingResult.success ? pendingResult.data : []),
              ...(expiredResult.success ? expiredResult.data : [])
            ];
            
            result = { success: true, data: allCerts };
          }
        } else {
          result = await getCertificatesByStatus(filter);
        }
      } else if (isAdmin) {
        // Admin sees certificates from their organization
        if (filter === "all") {
          result = await getCertificatesByOrganization(userProfile.organizationId);
        } else {
          result = await getCertificatesByStatus(filter, userProfile.organizationId);
        }
      } else {
        // Students see only their own certificates
        result = await getCertificatesByRecipient(user.uid);
        
        // Apply filter to student's certificates
        if (filter !== "all" && result.success) {
          result.data = result.data.filter(cert => cert.status === filter);
        }
      }

      if (result.success) {
        setCertificates(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error("Error loading certificates:", error);
      setError("Failed to load certificates");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    let date;
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return date.toLocaleDateString();
  };

  const filteredCertificates = certificates.filter(cert => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      cert.certificateInfo?.title?.toLowerCase().includes(searchLower) ||
      cert.recipientInfo?.name?.toLowerCase().includes(searchLower) ||
      cert.id.toLowerCase().includes(searchLower)
    );
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isSuperAdmin ? "All Certificates" : isAdmin ? "Organization Certificates" : "My Certificates"}
            </h1>
            <p className="text-slate-600 mt-2">
              {isSuperAdmin 
                ? "View and manage all certificates across the platform" 
                : isAdmin 
                  ? "Certificates issued by your organization"
                  : "View your verified certificates and achievements"
              }
            </p>
          </div>

          {(isAdmin || isSuperAdmin) && (
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => router.push('/dashboard/issue')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Issue New Certificate
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {["all", "verified", "pending", "expired"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search certificates..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.length > 0 ? (
            filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/certificates/${certificate.id}`)}
              >
                {/* Certificate Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 text-lg mb-1 line-clamp-2">
                      {certificate.certificateInfo?.title || "Untitled Certificate"}
                    </h3>
                    <p className="text-slate-600 text-sm">
                      {certificate.recipientInfo?.name || "Unknown Recipient"}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                    {certificate.status || "pending"}
                  </span>
                </div>

                {/* Certificate Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Type:</span>
                    <span className="text-slate-900 capitalize">{certificate.certificateInfo?.type || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issue Date:</span>
                    <span className="text-slate-900">{formatDate(certificate.certificateInfo?.issueDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Issued:</span>
                    <span className="text-slate-900">{formatDate(certificate.createdAt)}</span>
                  </div>
                  {certificate.verificationCount !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Verified:</span>
                      <span className="text-slate-900">{certificate.verificationCount} times</span>
                    </div>
                  )}
                </div>

                {/* Blockchain Status */}
                {certificate.blockchain && (
                  <div className="flex items-center space-x-2 mb-4">
                    <div className={`w-2 h-2 rounded-full ${
                      certificate.blockchain.status === "confirmed" ? "bg-green-500" : 
                      certificate.blockchain.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                    }`}></div>
                    <span className="text-xs text-slate-600">
                      Blockchain: {certificate.blockchain.status || "pending"}
                    </span>
                  </div>
                )}

                {/* Certificate ID */}
                <div className="border-t border-slate-100 pt-3 mt-4">
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {certificate.id}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/verify/${certificate.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Verify →
                  </button>
                  
                  {certificate.fileUrls?.certificate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(certificate.fileUrls.certificate, '_blank');
                      }}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No certificates found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchTerm 
                    ? `No certificates match "${searchTerm}"`
                    : filter !== "all" 
                      ? `No ${filter} certificates available`
                      : "No certificates have been issued yet"
                  }
                </p>
                {(isAdmin || isSuperAdmin) && (
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/dashboard/issue')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Issue First Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {filteredCertificates.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{certificates.length}</div>
                <div className="text-sm text-slate-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {certificates.filter(c => c.status === "verified").length}
                </div>
                <div className="text-sm text-slate-600">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {certificates.filter(c => c.status === "pending").length}
                </div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">
                  {certificates.reduce((sum, c) => sum + (c.verificationCount || 0), 0)}
                </div>
                <div className="text-sm text-slate-600">Verifications</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}