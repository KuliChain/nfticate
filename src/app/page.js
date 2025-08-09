"use client";
import { useState, useEffect } from "react";
import { getCertificate, logCertificateVerification } from "../lib/database";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [scannerStatus, setScannerStatus] = useState('idle'); // idle, checking, ready, error

  // Scroll effect untuk parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!certificateId.trim()) {
      setError("Silakan masukkan ID sertifikat");
      return;
    }

    setIsVerifying(true);
    setError("");
    setVerificationResult(null);

    try {
      const result = await getCertificate(certificateId);
      
      if (result.success) {
        const certificate = result.data;
        
        await logCertificateVerification(certificateId, {
          ipAddress: "unknown",
          userAgent: navigator.userAgent,
          location: "unknown"
        }, "public_verify");
        
        setVerificationResult({
          success: true,
          certificate: certificate,
          verifiedAt: new Date().toLocaleString()
        });
        setShowModal(true);
      } else {
        setError("Sertifikat tidak ditemukan atau ID tidak valid");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("Terjadi kesalahan saat memverifikasi sertifikat");
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const handleScannerClick = () => {
    setShowScannerModal(true);
    setScannerStatus('idle');
    setScannerError('');
  };

  const checkCameraAccess = async () => {
    try {
      setScannerStatus('checking');
      setScannerError('');
      
      // Check if browser supports camera API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('UNSUPPORTED_BROWSER');
      }

      // Check camera permissions first
      try {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        if (permissions.state === 'denied') {
          throw new Error('PERMISSION_DENIED');
        }
      } catch (permError) {
        // Some browsers don't support permissions API, continue anyway
        console.log("Permissions API not supported, continuing...");
      }

      // Try to access camera with constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera for QR scanning
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Immediately stop the stream since we're using placeholder implementation
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track:`, track.label);
      });
      
      setScannerStatus('ready');
      
    } catch (error) {
      console.error("Camera access error:", error);
      
      let errorMessage = "Terjadi kesalahan saat mengakses kamera.";
      
      switch (error.name || error.message) {
        case 'NotAllowedError':
        case 'PERMISSION_DENIED':
          errorMessage = "Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.";
          break;
        case 'NotFoundError':
          errorMessage = "Kamera tidak ditemukan. Pastikan device memiliki kamera yang tersedia.";
          break;
        case 'NotReadableError':
          errorMessage = "Kamera sedang digunakan oleh aplikasi lain. Silakan tutup aplikasi lain yang menggunakan kamera.";
          break;
        case 'OverconstrainedError':
          errorMessage = "Kamera tidak mendukung resolusi yang diminta.";
          break;
        case 'NotSupportedError':
        case 'UNSUPPORTED_BROWSER':
          errorMessage = "Browser tidak mendukung akses kamera. Silakan gunakan browser modern seperti Chrome, Firefox, atau Safari.";
          break;
        case 'AbortError':
          errorMessage = "Akses kamera dibatalkan.";
          break;
        default:
          errorMessage = `Gagal mengakses kamera: ${error.message || 'Unknown error'}`;
      }
      
      setScannerError(errorMessage);
      setScannerStatus('error');
    }
  };

  const handleManualInput = (inputValue) => {
    if (inputValue && inputValue.trim()) {
      setCertificateId(inputValue.trim());
      setShowScannerModal(false);
      // Auto-trigger verification
      setTimeout(async () => {
        const fakeEvent = { preventDefault: () => {} };
        await handleVerification(fakeEvent);
      }, 100);
    }
  };

  // Manual Input Form Component
  const ManualInputForm = ({ onSubmit }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(inputValue);
      setInputValue('');
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Masukkan ID sertifikat (contoh: UI-2024-001)"
            className="w-full px-4 py-3 pl-10 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono transition-all duration-200 placeholder-slate-400"
            required
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Verifikasi Sekarang
        </button>
      </form>
    );
  };

  return (
    <div className="relative">
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-6000"></div>
        </div>
      </div>

      {/* Navbar with glassmorphism */}
      <nav className="fixed w-full top-0 z-50 bg-white/10 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-12 transition-all duration-500">
                <span className="text-white font-bold text-base sm:text-lg">N</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 transition-all duration-300">NFTicate</span>
            </div>
            <div className="hidden md:flex space-x-4">
              <a href="/login" className="text-slate-700 hover:text-slate-900 px-4 py-2 text-sm lg:text-base hover:scale-105 transition-all duration-300 hover:bg-white/20 rounded-lg backdrop-blur-sm">
                Masuk
              </a>
              <a href="/register" className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white px-4 lg:px-6 py-2 rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-sm lg:text-base shadow-2xl hover:scale-105 hover:shadow-3xl transition-all duration-300 animate-gradient-xy">
                Daftar
              </a>
            </div>
            <button 
              className="md:hidden p-2 transform hover:scale-125 hover:rotate-180 transition-all duration-500 text-slate-700 hover:text-blue-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          {/* Mobile menu with glassmorphism */}
          {isMenuOpen && (
            <div className="md:hidden mt-3 py-3 border-t border-white/20 bg-white/10 backdrop-blur-xl rounded-xl animate-slide-down">
              <div className="space-y-2">
                <a href="/login" className="block px-4 py-2 text-slate-700 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-105">Masuk</a>
                <a href="/register" className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-center hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105">Daftar</a>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Full Screen dengan Parallax */}
      <section 
        className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      >
        {/* Animated geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 border-4 border-blue-200 rounded-lg transform rotate-45 animate-spin-slow"></div>
          <div className="absolute top-40 right-40 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-bounce-slow"></div>
          <div className="absolute bottom-40 left-40 w-28 h-28 border-4 border-emerald-200 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg transform -rotate-12 animate-float"></div>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 z-10">
          
          {/* Hero Text dengan Animasi Super Mewah */}
          <div className="text-center mb-8 sm:mb-12">
            {/* Floating badge dengan glow effect */}
            <div className="mb-6 sm:mb-8 inline-flex items-center px-4 py-3 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl animate-float-gentle hover:scale-110 transition-all duration-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-slate-700 font-semibold text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 Teknologi Blockchain Terdepan
              </span>
              <div className="w-2 h-2 bg-purple-500 rounded-full ml-2 animate-pulse animation-delay-1000"></div>
            </div>
            
            {/* Super animated heading - TANPA SPARKLE */}
            <div className="relative mb-6 sm:mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight text-slate-900 mb-4 animate-text-reveal">
                Verifikasi Sertifikat dengan{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent animate-gradient-xy bg-300% filter drop-shadow-lg">
                    Blockchain
                  </span>
                  {/* Multiple decorative lines */}
                  <svg className="absolute -bottom-2 left-0 w-full h-4 animate-draw-line-multi" viewBox="0 0 355 20" fill="none">
                    <path d="M3 9C3 9 85 3 177.5 3S352 9 352 9" stroke="url(#gradient1)" strokeWidth="3" strokeLinecap="round"/>
                    <path d="M3 15C3 15 85 9 177.5 9S352 15 352 15" stroke="url(#gradient2)" strokeWidth="2" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06B6D4" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              
              {/* Floating particles around text */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-float-particle"></div>
                <div className="absolute top-20 right-20 w-3 h-3 bg-purple-400 rounded-full animate-float-particle animation-delay-1000"></div>
                <div className="absolute bottom-10 left-1/4 w-2 h-2 bg-pink-400 rounded-full animate-float-particle animation-delay-2000"></div>
                <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-float-particle animation-delay-3000"></div>
              </div>
            </div>
            
            <p className="mx-auto max-w-3xl text-lg sm:text-xl md:text-2xl text-slate-600 mb-8 animate-text-reveal animation-delay-500 leading-relaxed">
              Platform terpercaya untuk verifikasi sertifikat digital menggunakan teknologi blockchain. 
              <span className="font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent"> Anti pemalsuan</span>, tersimpan selamanya.
            </p>
          </div>

          {/* Super Luxurious Input Area - Fixed z-index issues */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12 relative z-20">
            <form onSubmit={handleVerification} className="space-y-6 sm:space-y-8">
              
              {/* Input container tanpa overlay yang mengganggu */}
              <div className="relative group">
                {/* Background glow - di belakang input */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 animate-gradient-xy pointer-events-none"></div>
                
                {/* Input field yang bisa di-interact */}
                <input
                  type="text"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  placeholder="Masukkan ID sertifikat (contoh: UI-2024-001)"
                  className="relative w-full px-6 sm:px-8 py-4 sm:py-6 text-lg sm:text-xl bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all duration-300 shadow-2xl hover:shadow-3xl font-medium placeholder-slate-400 focus:bg-white z-10"
                  disabled={isVerifying}
                />
              </div>

              {/* Luxury buttons with 3D effects */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                
                {/* QR Scanner Button with holographic effect */}
                <button
                  type="button"
                  onClick={handleScannerClick}
                  disabled={isScanning || isVerifying}
                  className="group relative flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl disabled:opacity-50 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 text-lg sm:text-xl font-bold overflow-hidden"
                >
                  {/* Button glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative flex items-center space-x-3">
                    {isScanning ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Membuka Scanner...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h4.01M12 8h-4.01" />
                        </svg>
                        <span>Scan QR Code</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Verify Button with magical effect */}
                <button
                  type="submit"
                  disabled={!certificateId.trim() || isVerifying}
                  className="group relative flex-1 flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-2xl disabled:opacity-50 transition-all duration-500 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover:-translate-y-1 text-lg sm:text-xl font-bold overflow-hidden"
                >
                  {/* Button glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                  
                  {/* Magical shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <div className="relative flex items-center space-x-3">
                    {isVerifying ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Verifikasi</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>


          {/* Error State */}
          {error && (
            <div className="max-w-2xl mx-auto bg-red-50/80 backdrop-blur-xl border border-red-200/50 rounded-2xl p-6 mb-8 animate-shake shadow-2xl relative z-20">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-pulse">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-red-800 font-semibold text-base sm:text-lg">{error}</span>
              </div>
            </div>
          )}

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
            <div className="flex flex-col items-center text-slate-500 hover:text-slate-700 transition-colors duration-300 cursor-pointer">
              <span className="text-sm font-medium mb-2">Scroll untuk melihat lebih banyak</span>
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Sections below - akan muncul saat di-scroll */}
      <section className="py-20 bg-white/80 backdrop-blur-xl border-y border-white/20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cara Kerja NFTicate
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Sistem verifikasi sertifikat yang aman dan mudah digunakan dengan teknologi terdepan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {[
              { 
                icon: '📄', 
                title: 'Upload Sertifikat', 
                desc: 'Institusi mengupload sertifikat digital yang akan disimpan secara aman di blockchain',
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                icon: '🔗', 
                title: 'Generate Hash', 
                desc: 'Sistem membuat hash unik dari sertifikat dan menyimpannya di blockchain untuk keamanan',
                color: 'from-emerald-500 to-teal-500'
              },
              { 
                icon: '✅', 
                title: 'Verifikasi Instant', 
                desc: 'Siapa saja dapat memverifikasi keaslian sertifikat dengan memasukkan ID atau QR code',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((step, index) => (
              <div key={index} className="group text-center relative">
                <div className="absolute -inset-4 bg-gradient-to-r opacity-0 group-hover:opacity-20 rounded-3xl transition-all duration-500 blur from-blue-400 to-purple-400"></div>
                <div className={`relative w-20 h-20 mx-auto mb-8 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                  <span className="text-3xl">{step.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">{step.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section dengan animasi counter */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-float animation-delay-2000"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            {[
              { number: '100%', label: 'Keamanan Terjamin', icon: '🛡️' },
              { number: '<3s', label: 'Waktu Verifikasi', icon: '⚡' },
              { number: '24/7', label: 'Akses Online', icon: '🌍' }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="text-6xl sm:text-7xl font-black mb-4 bg-gradient-to-br from-white to-blue-200 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500">
                  {stat.number}
                </div>
                <div className="text-2xl mb-2 animate-bounce-gentle">{stat.icon}</div>
                <div className="text-slate-300 text-xl font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer dengan glassmorphism */}
      <footer className="bg-slate-900/95 backdrop-blur-xl text-white py-16 border-t border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-xl">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">NFTicate</span>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Platform verifikasi sertifikat digital berbasis blockchain yang aman dan terpercaya untuk masa depan yang lebih baik.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xl mb-6 text-white">Layanan</h4>
              <div className="space-y-3 text-slate-300 text-lg">
                <div className="hover:text-blue-400 transition-colors cursor-pointer">Verifikasi Sertifikat</div>
                <div className="hover:text-blue-400 transition-colors cursor-pointer">Upload Dokumen</div>
                <div className="hover:text-blue-400 transition-colors cursor-pointer">QR Code Scanner</div>
                <div className="hover:text-blue-400 transition-colors cursor-pointer">Blockchain Storage</div>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xl mb-6 text-white">Kontak</h4>
              <div className="space-y-3 text-slate-300 text-lg">
                <div className="hover:text-blue-400 transition-colors cursor-pointer">support@nfticate.com</div>
                <div className="hover:text-blue-400 transition-colors cursor-pointer">+62 123 4567 8900</div>
                <div className="hover:text-blue-400 transition-colors cursor-pointer">Jakarta, Indonesia</div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400 text-lg">
            <p>&copy; 2024 NFTicate. All rights reserved. Built with ❤️ and Blockchain Technology.</p>
          </div>
        </div>
      </footer>

      {/* Modal QR Scanner */}
      {showScannerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowScannerModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 animate-modal-appear bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              {/* Close Button */}
              <button
                onClick={() => setShowScannerModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="text-center p-8 pb-6">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h4.01M12 8h-4.01" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black mb-3 text-slate-900">
                  QR Scanner
                </h2>
                <p className="text-slate-600 font-medium">
                  Scan QR code atau masukkan ID sertifikat manual
                </p>
              </div>

              {/* Scanner Content */}
              <div className="px-8 pb-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-inner space-y-6">
                  
                  {/* Camera Status */}
                  <div className="text-center">
                    {scannerStatus === 'idle' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <button
                          onClick={checkCameraAccess}
                          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Akses Kamera
                        </button>
                      </div>
                    )}

                    {scannerStatus === 'checking' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <p className="text-slate-600 font-medium">Mengakses kamera...</p>
                      </div>
                    )}

                    {scannerStatus === 'ready' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-green-600 font-semibold">Kamera siap!</p>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                          <p className="text-sm text-green-800">
                            ✨ <strong>QR Scanner dalam pengembangan</strong><br/>
                            Untuk saat ini, silakan gunakan input manual di bawah.
                          </p>
                        </div>
                      </div>
                    )}

                    {scannerStatus === 'error' && (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-red-600 font-semibold mb-2">Gagal mengakses kamera</p>
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{scannerError}</p>
                          </div>
                        </div>
                        <button
                          onClick={checkCameraAccess}
                          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Manual Input Section */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-slate-800 mb-3 text-center">Input Manual</h3>
                    <ManualInputForm onSubmit={handleManualInput} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Verifikasi Sertifikat */}
      {showModal && verificationResult && verificationResult.success && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative w-full max-w-2xl transform overflow-hidden rounded-3xl shadow-2xl transition-all duration-300 animate-modal-appear ${
              isExpired(verificationResult.certificate.expiryDate) 
                ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200'
            }`}>
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Header */}
              <div className="text-center p-8 pb-6">
                <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center animate-bounce-success shadow-2xl ${
                  isExpired(verificationResult.certificate.expiryDate) ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : 'bg-gradient-to-br from-green-400 to-emerald-400'
                }`}>
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className={`text-3xl font-black mb-3 ${
                  isExpired(verificationResult.certificate.expiryDate) ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  {isExpired(verificationResult.certificate.expiryDate) ? '✓ Sertifikat Valid (Expired)' : '✓ Sertifikat Valid!'}
                </h2>
                <p className="text-slate-600 text-lg font-medium">
                  Sertifikat telah diverifikasi dan terdaftar dalam blockchain
                </p>
                {isExpired(verificationResult.certificate.expiryDate) && (
                  <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-xl">
                    <p className="text-yellow-800 text-sm font-medium">
                      ⚠️ Sertifikat ini telah kedaluwarsa pada {formatDate(verificationResult.certificate.expiryDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Certificate Details */}
              <div className="px-8 pb-8">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-inner">
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { 
                        label: '🏆 Nama Sertifikat', 
                        value: verificationResult.certificate.certificateInfo?.title || 'N/A',
                        highlight: true 
                      },
                      { 
                        label: '👤 Nama Penerima', 
                        value: verificationResult.certificate.recipientInfo?.name || 'N/A' 
                      },
                      { 
                        label: '📅 Tanggal Terbit', 
                        value: formatDate(verificationResult.certificate.certificateInfo?.issueDate) 
                      },
                      { 
                        label: '🏢 Institusi', 
                        value: verificationResult.certificate.organizationInfo?.name || 'N/A' 
                      },
                      { 
                        label: '🔖 ID Sertifikat', 
                        value: verificationResult.certificate.id || 'N/A',
                        mono: true
                      },
                      { 
                        label: '📊 Status', 
                        value: isExpired(verificationResult.certificate.expiryDate) ? 'Expired' : 'Aktif',
                        status: true
                      }
                    ].map((item, index) => (
                      <div key={index} className={`${item.highlight ? 'border-b border-slate-200 pb-4' : ''}`}>
                        <span className="font-semibold text-slate-700 text-sm block mb-1">{item.label}</span>
                        <p className={`${
                          item.highlight ? 'text-xl font-bold text-slate-900' : 
                          item.mono ? 'text-sm font-mono text-slate-800 bg-slate-100 px-3 py-1 rounded-lg inline-block' :
                          item.status ? `font-bold ${isExpired(verificationResult.certificate.expiryDate) ? 'text-yellow-600' : 'text-green-600'}` :
                          'text-lg text-slate-900'
                        }`}>
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-slate-200">
                    {verificationResult.certificate.fileUrls?.certificate && (
                      <button
                        onClick={() => window.open(verificationResult.certificate.fileUrls.certificate, '_blank')}
                        className="group relative flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                        <span className="relative flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Download Sertifikat</span>
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verificationResult.certificate.id);
                        // You could add a toast notification here
                      }}
                      className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy ID</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Super Luxury CSS Animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes gradient-xy {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }

        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(-10px, -10px); opacity: 0.8; }
          50% { transform: translate(10px, -20px); opacity: 0.6; }
          75% { transform: translate(-5px, -15px); opacity: 0.8; }
        }

        @keyframes text-reveal {
          0% { opacity: 0; transform: translateY(50px) rotateX(90deg); }
          100% { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }

        @keyframes draw-line-multi {
          0% { 
            stroke-dasharray: 0 355;
            opacity: 0;
          }
          50% {
            stroke-dasharray: 355 355;
            opacity: 1;
          }
          100% {
            stroke-dasharray: 355 0;
            opacity: 0.7;
          }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes float-up {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        @keyframes success-reveal {
          0% { opacity: 0; transform: scale(0.8) rotateY(90deg); }
          100% { opacity: 1; transform: scale(1) rotateY(0deg); }
        }

        @keyframes bounce-success {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1) rotateZ(5deg); }
        }

        @keyframes slide-in-detail {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }

        @keyframes modal-appear {
          0% { opacity: 0; transform: scale(0.8) translateY(50px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-gradient-xy {
          animation: gradient-xy 3s ease infinite;
          background-size: 400% 400%;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-gentle {
          animation: float-gentle 4s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle 3s ease-in-out infinite;
        }

        .animate-text-reveal {
          animation: text-reveal 1s ease-out forwards;
        }

        .animate-draw-line-multi {
          animation: draw-line-multi 3s ease-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-success-reveal {
          animation: success-reveal 0.6s ease-out forwards;
        }

        .animate-bounce-success {
          animation: bounce-success 1s ease-in-out infinite;
        }

        .animate-slide-in-detail {
          animation: slide-in-detail 0.5s ease-out forwards;
        }

        .animate-modal-appear {
          animation: modal-appear 0.3s ease-out forwards;
        }

        .animation-delay-100 { animation-delay: 100ms; }
        .animation-delay-200 { animation-delay: 200ms; }
        .animation-delay-300 { animation-delay: 300ms; }
        .animation-delay-400 { animation-delay: 400ms; }
        .animation-delay-500 { animation-delay: 500ms; }
        .animation-delay-1000 { animation-delay: 1000ms; }
        .animation-delay-2000 { animation-delay: 2000ms; }
        .animation-delay-3000 { animation-delay: 3000ms; }
        .animation-delay-4000 { animation-delay: 4000ms; }
        .animation-delay-6000 { animation-delay: 6000ms; }

        .bg-300% { background-size: 300% 300%; }

        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }

        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}