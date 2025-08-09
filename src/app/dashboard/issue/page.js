"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import DashboardLayout from "../../../components/DashboardLayout";
import { 
  SkeletonPage,
  useConsistentLoading 
} from "../../../components/SkeletonLoader";
import { createCertificate, getAllOrganizations } from "../../../lib/database";
import { uploadFile } from "../../../lib/supabase";

export default function IssueCertificate() {
  const { userProfile, loading, isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  // Tab management
  const [activeTab, setActiveTab] = useState("single"); // "single" or "bulk"
  
  // SuperAdmin organization selection
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  // Use consistent loading hook
  const showLoading = useConsistentLoading(loading || loadingOrgs);
  
  // Single upload states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    // Certificate Info
    certificateTitle: "",
    issueDate: "",
    expiryDate: "",
    
    // Recipient Info
    recipientName: "",
    recipientEmail: "",
    
    // File
    certificateFile: null,
    
    // Settings
    generateQR: true,
    qrPosition: "bottom-right" // bottom-right, bottom-left, top-right, top-left
  });

  // Bulk upload states
  const [bulkFiles, setBulkFiles] = useState([]);
  const [bulkSettings, setBulkSettings] = useState({
    certificateTitle: "",
    issueDate: "",
    expiryDate: "",
    generateQR: true,
    qrPosition: "bottom-right"
  });
  const [bulkNames, setBulkNames] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [bulkPreview, setBulkPreview] = useState([]);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    } else if (!loading && isAuthenticated && !isAdmin && !isSuperAdmin) {
      router.push("/dashboard"); // Only admin and superadmin can issue certificates
    }
  }, [loading, isAuthenticated, isAdmin, isSuperAdmin, router]);

  // Load organizations for SuperAdmin
  useEffect(() => {
    if (isSuperAdmin && isAuthenticated) {
      loadOrganizations();
    }
  }, [isSuperAdmin, isAuthenticated]);

  const loadOrganizations = async () => {
    setLoadingOrgs(true);
    try {
      const result = await getAllOrganizations();
      if (result.success) {
        setOrganizations(result.data);
      } else {
        setError("Failed to load organizations");
      }
    } catch (error) {
      console.error("Error loading organizations:", error);
      setError("Failed to load organizations");
    } finally {
      setLoadingOrgs(false);
    }
  };

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

  // Bulk upload handlers
  const handleBulkFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setBulkFiles(files);
    generateBulkPreview(files, bulkNames, bulkEmails);
  };

  const handleBulkSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBulkSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateBulkPreview = (files, namesText, emailsText) => {
    const names = namesText.split('\n').filter(name => name.trim());
    const emails = emailsText.split('\n').filter(email => email.trim());
    
    const preview = files.map((file, index) => {
      const name = names[index] || '';
      const email = emails[index] || '';
      
      // Auto-generate certificate title from filename if not set
      let autoTitle = file.name
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
      
      return {
        file,
        fileName: file.name,
        recipientName: name,
        recipientEmail: email,
        certificateTitle: autoTitle,
        isValid: name.trim() && email.trim() && email.includes('@')
      };
    });
    
    setBulkPreview(preview);
  };

  const handleBulkNamesChange = (e) => {
    setBulkNames(e.target.value);
    generateBulkPreview(bulkFiles, e.target.value, bulkEmails);
  };

  const handleBulkEmailsChange = (e) => {
    setBulkEmails(e.target.value);
    generateBulkPreview(bulkFiles, bulkNames, e.target.value);
  };

  const uploadFileToStorage = async (file, folder = 'certificates') => {
    if (!file) return null;
    
    const uploadResult = await uploadFile(file, folder);
    if (uploadResult.success) {
      return uploadResult.data.publicUrl;
    } else {
      throw new Error(uploadResult.error);
    }
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
      if (!formData.certificateTitle || !formData.recipientName || !formData.recipientEmail || !formData.issueDate) {
        throw new Error("Mohon isi semua field yang wajib");
      }

      if (!formData.certificateFile) {
        throw new Error("Mohon upload file sertifikat");
      }

      if (isSuperAdmin && !selectedOrgId) {
        throw new Error("Mohon pilih organization");
      }

      setUploadProgress(10);

      // Upload certificate file to storage
      const targetOrgId = isSuperAdmin ? selectedOrgId : userProfile?.organizationId;
      const certificateFileUrl = await uploadFileToStorage(
        formData.certificateFile, 
        `certificates/${targetOrgId || 'default'}`
      );

      setUploadProgress(40);

      // Prepare certificate data
      const certificateData = {
        // Certificate Info
        certificateInfo: {
          title: formData.certificateTitle,
          type: "uploaded", // Mark as uploaded certificate
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate || null,
        },
        
        // Recipient Info
        recipientInfo: {
          name: formData.recipientName,
          email: formData.recipientEmail,
        },
        
        // Organization
        organizationId: targetOrgId,
        issuerId: userProfile?.uid,
        issuerInfo: {
          name: userProfile?.displayName || userProfile?.email,
          role: userProfile?.role,
          ...(isSuperAdmin && { actingAsOrganization: organizations.find(org => org.id === selectedOrgId)?.name }),
        },
        
        // Files
        fileUrls: {
          certificate: certificateFileUrl,
        },
        
        // Settings
        settings: {
          isPublic: true, // Public by default for verification
          generateQR: formData.generateQR,
          qrPosition: formData.qrPosition,
        },
        
        // Certificate is verified since it's uploaded as completed document
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
        status: "pending", // pending blockchain confirmation, not certificate approval
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

      setSuccess(`Sertifikat berhasil di-upload dan diamankan! Certificate ID: ${dbResult.id}`);
      
      // Reset form
      setFormData({
        certificateTitle: "",
        issueDate: "",
        expiryDate: "",
        recipientName: "",
        recipientEmail: "",
        certificateFile: null,
        generateQR: true,
        qrPosition: "bottom-right"
      });

      // Reset organization selection for SuperAdmin
      if (isSuperAdmin) {
        setSelectedOrgId("");
      }

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

  // Bulk submit handler
  const handleBulkSubmit = async () => {
    setIsBulkSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (bulkPreview.length === 0) {
        throw new Error("Mohon upload file sertifikat dan isi data recipient");
      }

      if (!bulkSettings.certificateTitle || !bulkSettings.issueDate) {
        throw new Error("Mohon isi pengaturan bulk (judul dan tanggal terbit)");
      }

      if (isSuperAdmin && !selectedOrgId) {
        throw new Error("Mohon pilih organization untuk bulk upload");
      }

      const validItems = bulkPreview.filter(item => item.isValid);
      if (validItems.length === 0) {
        throw new Error("Tidak ada data yang valid untuk diproses");
      }

      setBulkProgress(5);
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Process each certificate
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        
        try {
          // Upload file
          const targetOrgId = isSuperAdmin ? selectedOrgId : userProfile?.organizationId;
          const certificateFileUrl = await uploadFileToStorage(
            item.file, 
            `certificates/${targetOrgId || 'default'}`
          );

          // Prepare certificate data
          const certificateData = {
            certificateInfo: {
              title: bulkSettings.certificateTitle,
              type: "uploaded",
              issueDate: bulkSettings.issueDate,
              expiryDate: bulkSettings.expiryDate || null,
            },
            recipientInfo: {
              name: item.recipientName,
              email: item.recipientEmail,
            },
            organizationId: targetOrgId,
            issuerId: userProfile?.uid,
            issuerInfo: {
              name: userProfile?.displayName || userProfile?.email,
              role: userProfile?.role,
              ...(isSuperAdmin && { actingAsOrganization: organizations.find(org => org.id === selectedOrgId)?.name }),
            },
            fileUrls: {
              certificate: certificateFileUrl,
            },
            settings: {
              isPublic: true,
              generateQR: bulkSettings.generateQR,
              qrPosition: bulkSettings.qrPosition,
            },
            verificationCount: 0,
          };

          // Generate hash and blockchain placeholder
          const certificateHash = generateCertificateHash({
            certificateTitle: bulkSettings.certificateTitle,
            recipientName: item.recipientName,
            recipientEmail: item.recipientEmail,
            issueDate: bulkSettings.issueDate,
            organizationId: targetOrgId
          });

          certificateData.blockchain = {
            hash: certificateHash,
            transactionHash: null,
            blockNumber: null,
            network: null,
            status: "pending",
          };

          // Save to database
          const dbResult = await createCertificate(certificateData);
          
          if (dbResult.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`${item.fileName}: ${dbResult.error}`);
          }

        } catch (error) {
          errorCount++;
          errors.push(`${item.fileName}: ${error.message}`);
        }

        // Update progress
        setBulkProgress(Math.round(((i + 1) / validItems.length) * 90) + 5);
      }

      setBulkProgress(100);

      // Show results
      if (successCount > 0 && errorCount === 0) {
        setSuccess(`🎉 Berhasil upload ${successCount} sertifikat!`);
        // Reset form
        setBulkFiles([]);
        setBulkNames("");
        setBulkEmails("");
        setBulkPreview([]);
        setBulkSettings({
          certificateTitle: "",
          issueDate: "",
          expiryDate: "",
          generateQR: true,
          qrPosition: "bottom-right"
        });

        // Reset organization selection for SuperAdmin
        if (isSuperAdmin) {
          setSelectedOrgId("");
        }
      } else if (successCount > 0 && errorCount > 0) {
        setSuccess(`✅ ${successCount} berhasil, ❌ ${errorCount} gagal`);
        if (errors.length > 0) {
          setError(`Errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
        }
      } else {
        throw new Error(`Semua upload gagal. Errors: ${errors.slice(0, 3).join(', ')}`);
      }

    } catch (error) {
      console.error("Bulk upload error:", error);
      setError(error.message);
    } finally {
      setIsBulkSubmitting(false);
      setBulkProgress(0);
    }
  };

  if (showLoading) {
    return (
      <DashboardLayout>
        <SkeletonPage hasStats={false} hasTable={false} hasCards={false} />
      </DashboardLayout>
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
            Upload & Secure Certificate
          </h1>
          <p className="text-slate-600 mt-2">
            Upload sertifikat yang sudah jadi dan amankan dengan blockchain + QR verification
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="border-b border-slate-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("single")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "single"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📄 Single Upload
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "bulk"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                📁 Bulk Upload
              </button>
            </nav>
          </div>
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
        {((activeTab === "single" && isSubmitting && uploadProgress > 0) || 
          (activeTab === "bulk" && isBulkSubmitting && bulkProgress > 0)) && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {activeTab === "single" ? "Processing Certificate..." : "Processing Bulk Upload..."}
              </span>
              <span className="text-sm text-slate-500">
                {activeTab === "single" ? uploadProgress : bulkProgress}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${activeTab === "single" ? uploadProgress : bulkProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Single Upload Form */}
        {activeTab === "single" && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Selection for SuperAdmin */}
          {isSuperAdmin && (
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">🏢 Select Organization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload atas nama Organization *
                  </label>
                  {loadingOrgs ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-600">Loading organizations...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Pilih Organization</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>{org.name}</option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Sertifikat akan di-upload atas nama organization yang dipilih
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Certificate File */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">📁 Upload Sertifikat</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  File Sertifikat *
                </label>
                <input
                  type="file"
                  name="certificateFile"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Upload sertifikat yang sudah jadi. Format: PDF, JPG, PNG (max 10MB)</p>
              </div>
            </div>
          </div>

          {/* Basic Certificate Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">📋 Informasi Dasar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Judul Sertifikat *
                </label>
                <input
                  type="text"
                  name="certificateTitle"
                  value={formData.certificateTitle}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Sertifikat Pelatihan Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tanggal Terbit *
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
                  Tanggal Kadaluarsa (Opsional)
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
            <h2 className="text-xl font-semibold text-slate-900 mb-4">👤 Penerima Sertifikat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama lengkap penerima sertifikat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Penerima *
                </label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">Email ini penting agar student bisa melihat sertifikat di "My Certificates"</p>
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">📱 QR Code Settings</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="generateQR"
                  checked={formData.generateQR}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <span className="ml-2 text-sm text-slate-700">Generate QR code untuk verifikasi</span>
              </label>

              {formData.generateQR && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Posisi QR Code
                  </label>
                  <select
                    name="qrPosition"
                    value={formData.qrPosition}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bottom-right">Kanan Bawah</option>
                    <option value="bottom-left">Kiri Bawah</option>
                    <option value="top-right">Kanan Atas</option>
                    <option value="top-left">Kiri Atas</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">QR code akan di-overlay pada posisi yang dipilih</p>
                </div>
              )}
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
              <h3 className="ml-3 text-lg font-semibold text-slate-900">🔗 Blockchain Security</h3>
            </div>
            <p className="text-sm text-slate-600">
              Sertifikat Anda akan diamankan dengan teknologi blockchain. Hash unik akan dibuat 
              dan dicatat di blockchain untuk verifikasi permanen dan perlindungan anti-fraud.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Tamper-proof verification</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600">Global accessibility</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Upload & Amankan Sertifikat
                </>
              )}
            </button>
          </div>
        </form>
        )}

        {/* Bulk Upload Form */}
        {activeTab === "bulk" && (
          <div className="space-y-6">
            {/* Organization Selection for SuperAdmin */}
            {isSuperAdmin && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">🏢 Select Organization</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bulk Upload atas nama Organization *
                    </label>
                    {loadingOrgs ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-slate-600">Loading organizations...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Pilih Organization</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Semua sertifikat akan di-upload atas nama organization yang dipilih
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Settings */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">⚙️ Pengaturan Bulk</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Template Judul Sertifikat *
                  </label>
                  <input
                    type="text"
                    name="certificateTitle"
                    value={bulkSettings.certificateTitle}
                    onChange={handleBulkSettingsChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Sertifikat Pelatihan Web Development 2024"
                  />
                  <p className="text-xs text-slate-500 mt-1">Judul ini akan digunakan untuk semua sertifikat</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Terbit *
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={bulkSettings.issueDate}
                    onChange={handleBulkSettingsChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tanggal Kadaluarsa (Opsional)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={bulkSettings.expiryDate}
                    onChange={handleBulkSettingsChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="generateQR"
                        checked={bulkSettings.generateQR}
                        onChange={handleBulkSettingsChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <span className="ml-2 text-sm text-slate-700">Generate QR Code</span>
                    </label>

                    {bulkSettings.generateQR && (
                      <select
                        name="qrPosition"
                        value={bulkSettings.qrPosition}
                        onChange={handleBulkSettingsChange}
                        className="px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="bottom-right">Kanan Bawah</option>
                        <option value="bottom-left">Kiri Bawah</option>
                        <option value="top-right">Kanan Atas</option>
                        <option value="top-left">Kiri Atas</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Multiple Files */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">📁 Upload Multiple Files</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Pilih Semua File Sertifikat *
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleBulkFilesChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Pilih semua file PDF/JPG/PNG sekaligus. Format: PDF, JPG, PNG (max 10MB per file)
                  </p>
                </div>
                
                {bulkFiles.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      ✅ {bulkFiles.length} files selected
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Input Recipients */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">👥 Data Penerima (Bulk Paste)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nama Lengkap (satu per baris) *
                  </label>
                  <textarea
                    value={bulkNames}
                    onChange={handleBulkNamesChange}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Copy-paste dari Excel/Google Sheets:&#10;&#10;Andi Pratama&#10;Budi Santoso&#10;Citra Dewi&#10;..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Copy dari Excel → Paste di sini. Satu nama per baris.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email (satu per baris) *
                  </label>
                  <textarea
                    value={bulkEmails}
                    onChange={handleBulkEmailsChange}
                    rows={10}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Copy-paste dari Excel/Google Sheets:&#10;&#10;andi@email.com&#10;budi@email.com&#10;citra@email.com&#10;..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Copy dari Excel → Paste di sini. Satu email per baris.
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Table */}
            {bulkPreview.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">📊 Preview Data</h2>
                  <div className="text-sm text-slate-600">
                    {bulkPreview.filter(item => item.isValid).length} / {bulkPreview.length} valid
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">File</th>
                        <th className="px-3 py-2 text-left">Nama</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {bulkPreview.map((item, index) => (
                        <tr key={index} className={item.isValid ? "" : "bg-red-50"}>
                          <td className="px-3 py-2 font-mono text-xs">{item.fileName}</td>
                          <td className="px-3 py-2">{item.recipientName || <span className="text-slate-400">Missing</span>}</td>
                          <td className="px-3 py-2">{item.recipientEmail || <span className="text-slate-400">Missing</span>}</td>
                          <td className="px-3 py-2">
                            {item.isValid ? (
                              <span className="text-green-600">✅ Valid</span>
                            ) : (
                              <span className="text-red-600">❌ Invalid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {bulkPreview.some(item => !item.isValid) && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Beberapa data tidak valid. Pastikan setiap file memiliki nama dan email yang valid.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Bulk Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={isBulkSubmitting || bulkPreview.filter(item => item.isValid).length === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isBulkSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing {bulkPreview.filter(item => item.isValid).length} files...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Bulk Upload {bulkPreview.filter(item => item.isValid).length} Certificates
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}