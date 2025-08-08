"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../../../contexts/AuthContext";
import DashboardLayout from "../../../../../../../components/DashboardLayout";
import { 
  getOrganization,
  getCertificatesByOrganization
} from "../../../../../../../lib/database";

export default function ProgramCertificatesPage() {
  const { user, userProfile, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId;
  const programName = decodeURIComponent(params.programName);

  const [organization, setOrganization] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [filteredCertificates, setFilteredCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userProfile && orgId && programName) {
      // Check permission
      if (!isSuperAdmin && (!isAdmin || userProfile.organizationId !== orgId)) {
        router.push("/dashboard");
        return;
      }
      loadProgramCertificates();
    }
  }, [isAuthenticated, userProfile, orgId, programName]);

  useEffect(() => {
    filterCertificates();
  }, [certificates, filter, searchTerm]);

  const loadProgramCertificates = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load organization details
      const orgResult = await getOrganization(orgId);
      if (!orgResult.success) {
        setError("Organization not found");
        return;
      }
      setOrganization(orgResult.data);

      // Load certificates for this organization
      const certResult = await getCertificatesByOrganization(orgId);
      if (certResult.success) {
        // Filter certificates for this specific program
        const programCertificates = certResult.data.filter(cert => {
          const certProgram = cert.certificateInfo?.program || 
                            cert.certificateInfo?.event || 
                            cert.certificateInfo?.type || 
                            "General Program";
          return certProgram === programName;
        });

        setCertificates(programCertificates);
      } else {
        setError(certResult.error || "Failed to load certificates");
      }
    } catch (error) {
      console.error("Error loading program certificates:", error);
      setError("Failed to load program certificates");
    } finally {
      setIsLoading(false);
    }
  };

  const filterCertificates = () => {
    let filtered = certificates;

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(cert => cert.status === filter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.recipientInfo?.name?.toLowerCase().includes(searchLower) ||
        cert.recipientInfo?.email?.toLowerCase().includes(searchLower) ||
        cert.id.toLowerCase().includes(searchLower) ||
        cert.certificateInfo?.title?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredCertificates(filtered);
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
            <div className="flex items-center space-x-4 mb-2">
              <button 
                onClick={() => router.push(`/dashboard/certificates/org/${orgId}`)}
                className="flex items-center text-slate-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {organization?.name || "Organization"}
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{programName}</h1>
                <p className="text-slate-600">
                  {organization?.name} • {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <p className="text-slate-600 mt-2">
              View and manage individual certificates issued under this program
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={() => router.push('/dashboard/issue')}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Issue Certificate
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics Overview */}
        {certificates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{certificates.length}</p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Verified</p>
                  <p className="text-3xl font-bold text-green-600">
                    {certificates.filter(c => c.status === "verified").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {certificates.filter(c => c.status === "pending").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Verifications</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {certificates.reduce((sum, c) => sum + (c.verificationCount || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Certificates List */}
        {filteredCertificates.length > 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Certificate Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Issue Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Verifications
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredCertificates.map((certificate) => (
                    <tr key={certificate.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {(certificate.recipientInfo?.name || certificate.recipientInfo?.email || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">
                              {certificate.recipientInfo?.name || "Unknown Recipient"}
                            </div>
                            <div className="text-sm text-slate-500">
                              {certificate.recipientInfo?.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          {certificate.certificateInfo?.title || "Untitled Certificate"}
                        </div>
                        <div className="text-sm text-slate-500 font-mono">
                          ID: {certificate.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(certificate.status)}`}>
                          {certificate.status || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatDate(certificate.certificateInfo?.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {certificate.verificationCount || 0} times
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => router.push(`/verify/${certificate.id}`)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/certificates/${certificate.id}`)}
                          className="text-green-600 hover:text-green-700"
                        >
                          View
                        </button>
                        {certificate.fileUrls?.certificate && (
                          <button
                            onClick={() => window.open(certificate.fileUrls.certificate, '_blank')}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            Download
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No certificates found</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm 
                ? `No certificates match "${searchTerm}"${filter !== "all" ? ` with status "${filter}"` : ""}`
                : filter !== "all" 
                  ? `No ${filter} certificates found for this program`
                  : "No certificates have been issued for this program yet"
              }
            </p>
            <div className="mt-6">
              <button
                onClick={() => router.push('/dashboard/issue')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Issue Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}