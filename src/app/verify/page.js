"use client";
import { useState } from "react";
import { getCertificate, logCertificateVerification } from "../../lib/database";

export default function VerifyPage() {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "expired":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

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
              <p className="mt-2 text-sm text-slate-500">
                Certificate ID can be found on the certificate document or QR code
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </form>

          {/* QR Scanner Placeholder */}
          <div className="mt-8 pt-8 border-t border-slate-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h4.01M12 8h-4.01" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">QR Code Scanner</h3>
              <p className="text-slate-600 mb-4">Scan QR code from certificate for instant verification</p>
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                Open Scanner
              </button>
            </div>
          </div>
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
                <div className="space-y-6">
                  {/* Basic Information */}
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
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(verificationResult.certificate.status)}`}>
                            {verificationResult.certificate.status}
                          </span>
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
                          <label className="block text-sm font-medium text-slate-700">ID</label>
                          <p className="text-slate-900">{verificationResult.certificate.recipientInfo?.id || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Verification Count</label>
                          <p className="text-slate-900">{verificationResult.certificate.verificationCount || 0} times</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Program Information */}
                  {verificationResult.certificate.programInfo && (
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Program Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Program Name</label>
                          <p className="text-slate-900">{verificationResult.certificate.programInfo.name || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Institution</label>
                          <p className="text-slate-900">{verificationResult.certificate.programInfo.institution || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Grade</label>
                          <p className="text-slate-900">{verificationResult.certificate.programInfo.grade || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Credits</label>
                          <p className="text-slate-900">{verificationResult.certificate.programInfo.credits || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Blockchain Information */}
                  {verificationResult.certificate.blockchain && (
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">🔗 Blockchain Security</h3>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Blockchain Status</label>
                            <div className="flex items-center mt-1">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                verificationResult.certificate.blockchain.status === "confirmed" ? "bg-green-500" :
                                verificationResult.certificate.blockchain.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                              }`}></div>
                              <span className="text-slate-900 capitalize">{verificationResult.certificate.blockchain.status}</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700">Certificate Hash</label>
                            <p className="text-slate-900 font-mono text-sm">{verificationResult.certificate.blockchain.hash || "Generating..."}</p>
                          </div>
                          {verificationResult.certificate.blockchain.transactionHash && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Transaction Hash</label>
                                <p className="text-slate-900 font-mono text-xs">{verificationResult.certificate.blockchain.transactionHash}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700">Block Number</label>
                                <p className="text-slate-900">{verificationResult.certificate.blockchain.blockNumber}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certificate ID */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="bg-slate-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Certificate ID</label>
                      <p className="text-lg font-mono text-slate-900">{verificationResult.certificate.id}</p>
                      <p className="text-xs text-slate-500 mt-1">Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Download Link */}
                  {verificationResult.certificate.fileUrls?.certificate && (
                    <div className="text-center pt-6">
                      <button
                        onClick={() => window.open(verificationResult.certificate.fileUrls.certificate, '_blank')}
                        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Certificate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Invalid Certificate */
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

        {/* Help Section */}
        {!verificationResult && (
          <div className="mt-12 bg-blue-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Need Help?</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Certificate IDs usually follow format: ORG-YYYY-XXX (e.g., UI-2024-001)
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                QR codes contain verification links for instant verification
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Contact the issuing institution if you need assistance
              </li>
            </ul>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Protected by secure blockchain technology
          </div>
        </div>
      </main>
    </div>
  );
}