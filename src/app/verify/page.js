"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { getCertificate, logCertificateVerification } from "../../lib/database";
import DashboardLayout from "../../components/DashboardLayout";

export default function VerifyPage() {
  const { user, userProfile, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    setIsVerifying(true);
    setError("");
    setVerificationResult(null);

    try {
      // Get certificate from database
      const result = await getCertificate(certificateId.trim());
      
      if (result.success) {
        const certificate = result.data;
        
        // Log the verification
        await logCertificateVerification(certificateId, {
          ipAddress: "unknown", // In production, get real IP
          userAgent: navigator.userAgent,
          location: "unknown"
        });

        setVerificationResult({
          isValid: true,
          certificate,
          verifiedAt: new Date().toISOString()
        });
      } else {
        setVerificationResult({
          isValid: false,
          error: "Certificate not found or invalid"
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Failed to verify certificate. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Authenticated user - use DashboardLayout
  if (isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Certificate Verification</h1>
              <p className="text-slate-600 mt-2">Enter certificate ID to verify its authenticity and blockchain status</p>
            </div>
            <button 
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <label htmlFor="certificateId" className="block text-sm font-medium text-slate-700 mb-2">
                  Certificate ID
                </label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    id="certificateId"
                    name="certificateId"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    placeholder="Enter certificate ID (e.g., UI-2024-001)"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <button
                    type="submit"
                    disabled={isVerifying || !certificateId.trim()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </form>
          </div>

          {/* Verification Result */}
          {verificationResult && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              {verificationResult.isValid ? (
                <div>
                  {/* Success Header */}
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-green-600 mb-2">✓ Certificate Valid!</h2>
                    <p className="text-slate-600">This certificate has been verified and is authentic</p>
                  </div>

                  {/* Certificate Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Certificate Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Title</label>
                          <p className="text-slate-900">{verificationResult.certificate.certificateInfo?.title || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Type</label>
                          <p className="text-slate-900 capitalize">{verificationResult.certificate.certificateInfo?.type || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Issue Date</label>
                          <p className="text-slate-900">{formatDate(verificationResult.certificate.certificateInfo?.issueDate)}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Recipient Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Name</label>
                          <p className="text-slate-900">{verificationResult.certificate.recipientInfo?.name || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Email</label>
                          <p className="text-slate-900">{verificationResult.certificate.recipientInfo?.email || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Verification Count</label>
                          <p className="text-slate-900">{verificationResult.certificate.verificationCount || 0} times</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate ID */}
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Certificate ID</label>
                      <p className="text-lg font-mono text-slate-900">{verificationResult.certificate.id}</p>
                      <p className="text-xs text-slate-500 mt-1">Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">✗ Certificate Invalid</h2>
                  <p className="text-slate-600 mb-4">{verificationResult.error}</p>
                  <p className="text-sm text-slate-500">Please check the certificate ID and try again, or contact the issuing institution.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Public user - standalone layout
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Simple Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">N</span>
              </div>
              <span className="ml-3 text-xl font-bold text-slate-800">NFTicate</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                Login
              </a>
              <a href="/" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                ← Back to Home
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Certificate Verification
          </h1>
          <p className="text-lg text-slate-600">
            Enter certificate ID to verify its authenticity and blockchain status
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <form onSubmit={handleVerification} className="space-y-6">
            <div>
              <label htmlFor="certificateId" className="block text-sm font-medium text-slate-700 mb-2">
                Certificate ID
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  id="certificateId"
                  name="certificateId"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Enter certificate ID (e.g., UI-2024-001)"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <button
                  type="submit"
                  disabled={isVerifying || !certificateId.trim()}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </form>
        </div>

        {/* Verification Result - same as authenticated version */}
        {verificationResult && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            {verificationResult.isValid ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">✓ Certificate Valid!</h2>
                <p className="text-slate-600">This certificate has been verified and is authentic</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-600 mb-2">✗ Certificate Invalid</h2>
                <p className="text-slate-600 mb-4">{verificationResult.error}</p>
                <p className="text-sm text-slate-500">Please check the certificate ID and try again.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}