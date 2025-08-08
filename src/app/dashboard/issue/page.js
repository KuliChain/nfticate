"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { createCertificate } from "../../../lib/database";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../lib/firebase";

export default function IssueCertificate() {
  const { userProfile, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    // Certificate Info
    certificateTitle: "",
    certificateType: "academic", // academic, achievement, participation, completion
    description: "",
    issueDate: "",
    expiryDate: "",
    
    // Recipient Info
    recipientName: "",
    recipientEmail: "",
    recipientId: "", // Student ID / Employee ID
    
    // Program Info
    programName: "",
    institution: "",
    grade: "",
    credits: "",
    
    // Files
    templateFile: null,
    certificateFile: null,
    
    // Settings
    isPublic: true,
    sendEmail: true,
    generateQR: true
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    } else if (!loading && isAuthenticated && !isAdmin && !isSuperAdmin) {
      router.push("/dashboard"); // Only admin and superadmin can issue certificates
    }
  }, [loading, isAuthenticated, isAdmin, isSuperAdmin, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const uploadFileToStorage = async (file, path) => {
    if (!file) return null;
    
    const storageRef = ref(storage, `certificates/${path}/${Date.now()}_${file.name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    return await getDownloadURL(uploadResult.ref);
  };

  const generateCertificateHash = (certificateData) => {
    // Simple hash generation - in production, use proper cryptographic hash
    const dataString = JSON.stringify({
      title: certificateData.certificateTitle,
      recipient: certificateData.recipientName,
      recipientEmail: certificateData.recipientEmail,
      issueDate: certificateData.issueDate,
      organizationId: userProfile?.organizationId,
      timestamp: Date.now()
    });
    
    // Basic hash (replace with proper crypto hash)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  };

  // Placeholder for blockchain integration
  const submitToBlockchain = async (certificateData, hash) => {
    // TODO: Integrate with smart contract
    // This is where the blockchain developer will integrate
    console.log("🔗 BLOCKCHAIN INTEGRATION PLACEHOLDER");
    console.log("Certificate data:", certificateData);
    console.log("Certificate hash:", hash);
    
    // Simulate blockchain transaction
    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000),
      network: "polygon", // or ethereum, bsc, etc.
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.certificateTitle || !formData.recipientName || !formData.recipientEmail) {
        throw new Error("Please fill in all required fields");
      }

      if (!formData.certificateFile) {
        throw new Error("Please upload a certificate file");
      }

      setUploadProgress(10);

      // Upload files to Firebase Storage
      const certificateFileUrl = await uploadFileToStorage(
        formData.certificateFile, 
        `certificates/${userProfile?.organizationId || 'default'}`
      );

      const templateFileUrl = formData.templateFile ? 
        await uploadFileToStorage(formData.templateFile, `templates/${userProfile?.organizationId || 'default'}`) : 
        null;

      setUploadProgress(40);

      // Prepare certificate data
      const certificateData = {
        // Certificate Info
        certificateInfo: {
          title: formData.certificateTitle,
          type: formData.certificateType,
          description: formData.description,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate || null,
        },
        
        // Recipient Info
        recipientInfo: {
          name: formData.recipientName,
          email: formData.recipientEmail,
          id: formData.recipientId,
        },
        
        // Program Info
        programInfo: {
          name: formData.programName,
          institution: formData.institution,
          grade: formData.grade,
          credits: formData.credits,
        },
        
        // Organization
        organizationId: userProfile?.organizationId,
        issuerId: userProfile?.uid,
        issuerInfo: {
          name: userProfile?.displayName || userProfile?.email,
          role: userProfile?.role,
        },
        
        // Files
        fileUrls: {
          certificate: certificateFileUrl,
          template: templateFileUrl,
        },
        
        // Settings
        settings: {
          isPublic: formData.isPublic,
          sendEmail: formData.sendEmail,
          generateQR: formData.generateQR,
        },
        
        // Status
        status: "pending", // pending, verified, expired
        verificationCount: 0,
      };

      setUploadProgress(60);

      // Generate certificate hash
      const certificateHash = generateCertificateHash(certificateData);

      // Add blockchain data placeholder
      certificateData.blockchain = {
        hash: certificateHash,
        transactionHash: null,
        blockNumber: null,
        network: null,
        status: "pending", // pending, confirmed, failed
      };

      setUploadProgress(70);

      // Save to Firebase first
      const dbResult = await createCertificate(certificateData);
      
      if (!dbResult.success) {
        throw new Error(dbResult.error);
      }

      setUploadProgress(85);

      // Submit to blockchain (placeholder)
      try {
        const blockchainResult = await submitToBlockchain(certificateData, certificateHash);
        
        if (blockchainResult.success) {
          // Update certificate with blockchain info
          certificateData.blockchain = {
            ...certificateData.blockchain,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            network: blockchainResult.network,
            status: "confirmed",
          };
          
          // TODO: Update database with blockchain info
          console.log("✅ Certificate recorded on blockchain:", blockchainResult);
        }
      } catch (blockchainError) {
        console.warn("⚠️  Blockchain submission failed:", blockchainError);
        // Certificate is still valid, just not on blockchain yet
      }

      setUploadProgress(100);

      setSuccess(`Certificate issued successfully! Certificate ID: ${dbResult.id}`);
      
      // Reset form
      setFormData({
        certificateTitle: "",
        certificateType: "academic",
        description: "",
        issueDate: "",
        expiryDate: "",
        recipientName: "",
        recipientEmail: "",
        recipientId: "",
        programName: "",
        institution: "",
        grade: "",
        credits: "",
        templateFile: null,
        certificateFile: null,
        isPublic: true,
        sendEmail: true,
        generateQR: true
      });

      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');

    } catch (error) {
      console.error("Certificate issuance error:", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isAdmin && !isSuperAdmin)) {
    return null; // Will redirect
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Issue New Certificate
          </h1>
          <p className="text-slate-600 mt-2">
            Create and issue a new verified certificate with blockchain security
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isSubmitting && uploadProgress > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Processing Certificate...</span>
              <span className="text-sm text-slate-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Certificate Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Certificate Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Certificate Title *
                </label>
                <input
                  type="text"
                  name="certificateTitle"
                  value={formData.certificateTitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Certificate of Completion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Certificate Type *
                </label>
                <select
                  name="certificateType"
                  value={formData.certificateType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="academic">Academic</option>
                  <option value="achievement">Achievement</option>
                  <option value="participation">Participation</option>
                  <option value="completion">Completion</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Certificate description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Issue Date *
                </label>
                <input
                  type="date"
                  name="issueDate"
                  value={formData.issueDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Recipient Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name of recipient"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="recipient@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Student/Employee ID
                </label>
                <input
                  type="text"
                  name="recipientId"
                  value={formData.recipientId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ID number"
                />
              </div>
            </div>
          </div>

          {/* Program Information */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Program Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  name="programName"
                  value={formData.programName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Web Development Course"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Institution
                </label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Institution name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Grade/Score
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A, 90, Pass"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Credits/Hours
                </label>
                <input
                  type="text"
                  name="credits"
                  value={formData.credits}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3 credits, 40 hours"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">File Upload</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Certificate File *
                </label>
                <input
                  type="file"
                  name="certificateFile"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Accepted: PDF, JPG, PNG (max 10MB)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template File (Optional)
                </label>
                <input
                  type="file"
                  name="templateFile"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Certificate template for future use</p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Certificate Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-700">Make certificate publicly verifiable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="sendEmail"
                  checked={formData.sendEmail}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-700">Send certificate to recipient via email</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="generateQR"
                  checked={formData.generateQR}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-700">Generate QR code for verification</span>
              </label>
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-slate-900">🔗 Blockchain Integration</h3>
            </div>
            <p className="text-sm text-slate-600">
              This certificate will be secured with blockchain technology. A unique hash will be generated 
              and recorded on the blockchain for permanent verification and anti-fraud protection.
            </p>
            <div className="mt-3 text-xs text-purple-600 bg-purple-100 rounded-lg p-2">
              <strong>Developer Note:</strong> Blockchain integration placeholder ready. Smart contract integration point available in submitToBlockchain() function.
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Issue Certificate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}