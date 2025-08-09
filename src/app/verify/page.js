"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { getCertificate, logCertificateVerification, getOrganization } from "../../lib/database";
import DashboardLayout from "../../components/DashboardLayout";
import { useConsistentLoading } from "../../components/SkeletonLoader";

export default function VerifyPage() {
  const { user, userProfile, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isQRReady, setIsQRReady] = useState(false);

  // Use consistent loading hook
  const showLoading = useConsistentLoading(isVerifying);

  // Check for certificate ID in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam) {
      setCertificateId(idParam);
      // Automatically verify if ID is provided in URL
      handleVerificationById(idParam);
    }
  }, []);

  const handleVerificationById = async (id) => {
    if (!id.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    setIsVerifying(true);
    setError("");
    setVerificationResult(null);

    try {
      // Get certificate from database
      const result = await getCertificate(id.trim());
      
      if (result.success) {
        const certificate = result.data;
        
        // Get organization information if organizationId exists
        let organization = null;
        if (certificate.organizationId) {
          const orgResult = await getOrganization(certificate.organizationId);
          if (orgResult.success) {
            organization = orgResult.data;
          }
        }
        
        // Log the verification
        await logCertificateVerification(id, {
          ipAddress: "unknown", // In production, get real IP
          userAgent: navigator.userAgent,
          location: "unknown"
        });
        
        setVerificationResult({
          isValid: true,
          certificate: certificate,
          organization: organization,
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

  const handleVerification = async (e) => {
    e.preventDefault();
    await handleVerificationById(certificateId);
  };


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // QR Scanner functions
  const handleQRScan = (result) => {
    if (result) {
      let scannedId = result;
      
      // Extract certificate ID from URL if it's a full URL
      if (result.includes('/verify/')) {
        scannedId = result.split('/verify/').pop();
      }
      
      // Try to parse as JSON if it's structured data
      try {
        const parsed = JSON.parse(result);
        if (parsed.certificateId) {
          scannedId = parsed.certificateId;
        }
      } catch (e) {
        // Not JSON, use as is
      }
      
      setCertificateId(scannedId.trim());
      setShowQRScanner(false);
      
      // Auto-trigger verification
      setTimeout(async () => {
        const fakeEvent = { preventDefault: () => {} };
        await handleVerification(fakeEvent);
      }, 100);
    }
  };

  const handleQRError = (error) => {
    console.warn("QR Scanner Error:", error);
    setError("Failed to access camera. Please enter certificate ID manually.");
    setShowQRScanner(false);
  };

  const QRScannerModal = () => {
    const [QrScanner, setQrScanner] = useState(null);

    useEffect(() => {
      // Dynamic import untuk QR Scanner
      import('qr-scanner').then((module) => {
        setQrScanner(() => module.default);
        setIsQRReady(true);
      }).catch((err) => {
        console.error("QR Scanner not available:", err);
        setError("QR Scanner not supported on this device");
        setShowQRScanner(false);
      });
    }, []);

    useEffect(() => {
      if (!QrScanner || !showQRScanner) return;

      const videoElement = document.getElementById('qr-video');
      if (!videoElement) return;

      const qrScanner = new QrScanner(
        videoElement,
        (result) => handleQRScan(result.data),
        {
          onDecodeError: (error) => {
            // Silent - just keep scanning
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScanner.start().catch(handleQRError);

      return () => {
        qrScanner.destroy();
      };
    }, [QrScanner, showQRScanner]);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-slate-900">Scan QR Code</h3>
            <p className="text-slate-600">Point your camera at the certificate QR code</p>
          </div>
          
          <div className="relative bg-black rounded-xl overflow-hidden mb-4">
            <video 
              id="qr-video" 
              className="w-full h-64 object-cover"
              playsInline
            />
            {!isQRReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setShowQRScanner(false)}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
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
                    placeholder="Enter certificate ID (e.g., ITERA-2025-001)"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                    title="Scan QR Code"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </button>
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

          {/* Loading State */}
          {showLoading && !verificationResult && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="animate-pulse">
                {/* Loading Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto bg-slate-200 rounded-full mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-48 mx-auto mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
                </div>
                
                {/* Loading Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    </div>
                  </div>
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                      <div className="h-4 bg-slate-200 rounded w-4/5"></div>
                    </div>
                  </div>
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && !showLoading && (
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Issuing Organization</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Organization Name</label>
                          <p className="text-slate-900">{verificationResult.organization?.name || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700">Organization Type</label>
                          <p className="text-slate-900 capitalize">{verificationResult.organization?.type || "N/A"}</p>
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
        
        {/* QR Scanner Modal */}
        {showQRScanner && <QRScannerModal />}
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
              <Link href="/" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                ← Back to Home
              </Link>
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
                  placeholder="Enter certificate ID (e.g., ITERA-2025-001)"
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                />
                <button
                  type="button"
                  onClick={() => setShowQRScanner(true)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  title="Scan QR Code"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </button>
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
        
        {/* QR Scanner Modal */}
        {showQRScanner && <QRScannerModal />}
      </main>
    </div>
  );
}