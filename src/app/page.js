"use client";
import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [certificateId, setCertificateId] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!certificateId.trim()) return;
    
    // Simulate verification process
    setVerificationResult('loading');
    setTimeout(() => {
      // Mock verification result
      setVerificationResult({
        isValid: true,
        certificateId: certificateId,
        holder: "John Doe",
        issuer: "Universitas ABC",
        issueDate: "2024-01-15",
        program: "Sertifikat Kompeten Teknologi Blockchain"
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="ml-3 text-xl font-bold text-slate-800">NFTicate</span>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Features</a>
                <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">How It Works</a>
                <a href="#verify" className="text-slate-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Verify Certificate</a>
              </div>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="/login" className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                Sign In
              </a>
              <a href="#verify" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Verify Certificate
              </a>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-slate-200">
              <a href="#features" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                Features
              </a>
              <a href="#how-it-works" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                How It Works
              </a>
              <a href="#verify" className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                Verify Certificate
              </a>
              <div className="border-t border-slate-200 pt-4">
                <a href="/login" className="block w-full text-center bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors mb-2">
                  Sign In
                </a>
                <a href="#verify" className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  Verify Certificate
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-slate-900 sm:text-7xl">
            Verifikasi Sertifikat dengan{' '}
            <span className="relative whitespace-nowrap text-blue-600">
              <span className="relative">Blockchain</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Platform terpercaya untuk menerbitkan, menyimpan, dan memverifikasi sertifikat digital 
            menggunakan teknologi blockchain. Anti pemalsuan, tersimpan selamanya.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6">
            <a href="#verify" className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-center">
              Verifikasi Sertifikat Sekarang
            </a>
            <button className="text-slate-600 px-8 py-3 text-lg font-semibold hover:text-blue-600 transition-colors">
              Demo Video →
            </button>
          </div>
          
          {/* Quick Verification Widget */}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 flex items-center justify-center gap-8 opacity-60">
          <div className="text-sm text-slate-600">Trusted by institutions</div>
          <div className="flex items-center gap-6">
            <div className="w-8 h-8 bg-slate-300 rounded"></div>
            <div className="w-8 h-8 bg-slate-300 rounded"></div>
            <div className="w-8 h-8 bg-slate-300 rounded"></div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Mengapa Memilih NFTicate?
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Solusi lengkap untuk keamanan dan autentikasi sertifikat digital dengan teknologi blockchain terdepan
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">Anti Pemalsuan</h3>
              <p className="mt-4 text-slate-600">
                Setiap sertifikat dilindungi dengan hash blockchain yang tidak dapat diubah atau dipalsukan
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">Verifikasi Instan</h3>
              <p className="mt-4 text-slate-600">
                Scan QR code untuk verifikasi sertifikat dalam hitungan detik, kapan saja dan dimana saja
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-amber-100">
                <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h-.75A2.25 2.25 0 004.5 9.75v7.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-7.5a2.25 2.25 0 00-2.25-2.25h-.75m0-3l-3-3m0 0l-3 3m3-3v11.25m6-2.25h.75a2.25 2.25 0 012.25 2.25v7.5a2.25 2.25 0 01-2.25 2.25h-7.5a2.25 2.25 0 01-2.25-2.25v-.75" />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">Bulk Upload</h3>
              <p className="mt-4 text-slate-600">
                Upload ribuan sertifikat sekaligus dengan QR code yang ter-generate otomatis
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="py-24 bg-white rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Cara Kerja NFTicate
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
              Proses sederhana dalam 3 langkah untuk mengamankan sertifikat Anda
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Upload Sertifikat</h3>
              <p className="text-slate-600">
                Admin mengupload sertifikat PDF. Sistem otomatis akan menambahkan QR code pada posisi yang dapat disesuaikan
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Blockchain Storage</h3>
              <p className="text-slate-600">
                Hash sertifikat disimpan di blockchain untuk keamanan permanen. Data tidak dapat diubah atau dihapus
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Verifikasi Mudah</h3>
              <p className="text-slate-600">
                Siapapun dapat memverifikasi keaslian sertifikat dengan scan QR code atau masukkan nomor sertifikat
              </p>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div id="verify" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-6">
              Verifikasi Sertifikat Anda
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Masukkan nomor sertifikat atau scan QR code untuk memverifikasi keaslian sertifikat digital Anda
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Manual Input */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-4 text-center">
                    Input Manual
                  </h3>
                  <form onSubmit={handleVerification} className="space-y-4">
                    <input
                      type="text"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      placeholder="CERT-2024-001"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                    />
                    <button
                      type="submit"
                      disabled={!certificateId.trim() || verificationResult === 'loading'}
                      className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {verificationResult === 'loading' ? 'Memverifikasi...' : 'Verifikasi'}
                    </button>
                  </form>
                </div>
                
                {/* QR Scanner */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">
                    Scan QR Code
                  </h3>
                  <div className="w-24 h-24 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4m6-4h.01M12 8h4.01M12 8h-4.01" />
                    </svg>
                  </div>
                  <p className="text-slate-600 mb-4 text-sm">
                    Gunakan kamera untuk scan QR code pada sertifikat
                  </p>
                  <button className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors">
                    Buka Scanner
                  </button>
                </div>
              </div>
              
              {/* Verification Result */}
              {verificationResult && verificationResult !== 'loading' && (
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-2xl font-bold text-green-800">Sertifikat Valid! ✓</span>
                  </div>
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">ID Sertifikat:</span>
                        <p className="text-slate-600">{verificationResult.certificateId}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Pemegang:</span>
                        <p className="text-slate-600">{verificationResult.holder}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Penerbit:</span>
                        <p className="text-slate-600">{verificationResult.issuer}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Tanggal Terbit:</span>
                        <p className="text-slate-600">{verificationResult.issueDate}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Program:</span>
                      <p className="text-slate-600">{verificationResult.program}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Siap Mengamankan Sertifikat Institusi Anda?
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            Bergabung dengan ribuan institusi yang telah mempercayai NFTicate untuk mengamankan sertifikat mereka
          </p>
          <div className="mt-10">
            <button className="bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-700 transition-colors shadow-lg">
              Daftar Sebagai Institusi
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="ml-3 text-xl font-bold text-white">NFTicate</span>
              </div>
              <p className="text-slate-400 max-w-md">
                Platform verifikasi sertifikat digital terpercaya dengan teknologi blockchain. 
                Melindungi integritas kredensial pendidikan dan profesional.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8">
            <p className="text-center text-slate-400">
              © 2024 NFTicate. All rights reserved. Powered by blockchain technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
