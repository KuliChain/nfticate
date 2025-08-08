"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import DashboardLayout from "../../../../../components/DashboardLayout";
import { 
  getOrganization,
  getCertificatesByOrganization
} from "../../../../../lib/database";

export default function OrganizationProgramsPage() {
  const { user, userProfile, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.orgId;

  const [organization, setOrganization] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && userProfile && orgId) {
      // Check permission
      if (!isSuperAdmin && (!isAdmin || userProfile.organizationId !== orgId)) {
        router.push("/dashboard");
        return;
      }
      loadOrganizationData();
    }
  }, [isAuthenticated, userProfile, orgId]);

  const loadOrganizationData = async () => {
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
        const certs = certResult.data;
        setCertificates(certs);

        // Group certificates by program/event (using certificateInfo.program or certificateInfo.event)
        const programMap = {};
        
        certs.forEach(cert => {
          const program = cert.certificateInfo?.program || 
                         cert.certificateInfo?.event || 
                         cert.certificateInfo?.type || 
                         "General Program";
          
          if (!programMap[program]) {
            programMap[program] = {
              name: program,
              certificates: [],
              totalCount: 0,
              activeCount: 0,
              expiredCount: 0
            };
          }
          
          programMap[program].certificates.push(cert);
          programMap[program].totalCount++;
          
          // Check if certificate is expired based on expiry date
          if (cert.expiryDate && new Date(cert.expiryDate) < new Date()) {
            programMap[program].expiredCount++;
          } else {
            programMap[program].activeCount++;
          }
        });

        setPrograms(Object.values(programMap));
      } else {
        setError(certResult.error || "Failed to load certificates");
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
      setError("Failed to load organization data");
    } finally {
      setIsLoading(false);
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
                onClick={() => router.push("/dashboard/certificates")}
                className="flex items-center text-slate-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Organizations
              </button>
            </div>
            
            {organization && (
              <>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {organization.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">{organization.name}</h1>
                    <p className="text-slate-600">{organization.type || "Organization"}</p>
                  </div>
                </div>
                
                <p className="text-slate-600 mt-2">
                  Manage certificate programs and events for this organization
                </p>
              </>
            )}
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
                  <p className="text-sm font-medium text-slate-600">Total Certificates</p>
                  <p className="text-3xl font-bold text-slate-900">{certificates.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active</p>
                  <p className="text-3xl font-bold text-green-600">
                    {certificates.filter(c => !c.expiryDate || new Date(c.expiryDate) >= new Date()).length}
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
                  <p className="text-sm font-medium text-slate-600">Expired</p>
                  <p className="text-3xl font-bold text-red-600">
                    {certificates.filter(c => c.expiryDate && new Date(c.expiryDate) < new Date()).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Programs</p>
                  <p className="text-3xl font-bold text-purple-600">{programs.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Programs Grid */}
        {programs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/certificates/org/${orgId}/program/${encodeURIComponent(program.name)}`)}
              >
                {/* Program Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg line-clamp-1">
                          {program.name}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {program.totalCount} certificate{program.totalCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-purple-600">
                      {program.totalCount}
                    </span>
                  </div>
                </div>

                {/* Certificate Statistics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{program.activeCount}</div>
                    <div className="text-xs text-slate-600">Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-600">{program.totalCount}</div>
                    <div className="text-xs text-slate-600">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{program.expiredCount}</div>
                    <div className="text-xs text-slate-600">Expired</div>
                  </div>
                </div>

                {/* Recent Recipients */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Recent Recipients:</p>
                  <div className="space-y-1">
                    {program.certificates.slice(0, 3).map((cert, certIndex) => (
                      <div key={certIndex} className="text-sm text-slate-600 truncate">
                        • {cert.recipientInfo?.name || "Unknown Recipient"}
                      </div>
                    ))}
                    {program.certificates.length > 3 && (
                      <div className="text-sm text-slate-500">
                        +{program.certificates.length - 3} more...
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className="text-sm text-slate-500">
                    View all certificates
                  </span>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No programs found</h3>
            <p className="mt-1 text-sm text-slate-500">
              No certificates have been issued for this organization yet.
            </p>
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}