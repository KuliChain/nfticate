// QR Code generation utility
// Note: Install qrcode package: npm install qrcode

let QRCode;
try {
  QRCode = require('qrcode');
} catch (error) {
  console.warn('QRCode package not installed. Run: npm install qrcode');
}

/**
 * Generate QR code for certificate verification
 * @param {string} certificateId - Certificate ID
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} Base64 QR code image
 */
export const generateCertificateQR = async (certificateId, options = {}) => {
  if (!QRCode) {
    throw new Error('QRCode package not available. Please install: npm install qrcode');
  }

  try {
    // Construct verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${certificateId}`;

    // QR code generation options
    const qrOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      width: options.size || 256,
      ...options.qrOptions
    };

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, qrOptions);
    
    return {
      success: true,
      qrCodeDataUrl,
      verificationUrl,
      certificateId
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code with custom data (for advanced use cases)
 * @param {string} data - Data to encode in QR code
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} Base64 QR code image
 */
export const generateCustomQR = async (data, options = {}) => {
  if (!QRCode) {
    throw new Error('QRCode package not available. Please install: npm install qrcode');
  }

  try {
    const qrOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      width: options.size || 256,
      ...options.qrOptions
    };

    const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);
    
    return {
      success: true,
      qrCodeDataUrl,
      data
    };
  } catch (error) {
    console.error('Error generating custom QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code with certificate metadata (blockchain integration ready)
 * @param {Object} certificateData - Certificate data object
 * @param {Object} options - QR code generation options
 * @returns {Promise<Object>} QR code result with metadata
 */
export const generateBlockchainQR = async (certificateData, options = {}) => {
  if (!QRCode) {
    throw new Error('QRCode package not available. Please install: npm install qrcode');
  }

  try {
    // Construct verification data with blockchain info
    const qrData = {
      certificateId: certificateData.id,
      recipientName: certificateData.recipientInfo?.name,
      issueDate: certificateData.certificateInfo?.issueDate,
      organizationId: certificateData.organizationId,
      blockchainHash: certificateData.blockchain?.hash,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${certificateData.id}`,
      timestamp: Date.now()
    };

    const qrOptions = {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: options.darkColor || '#1e40af', // Blue for blockchain
        light: options.lightColor || '#FFFFFF'
      },
      width: options.size || 256,
      ...options.qrOptions
    };

    // Encode as JSON string for rich data
    const dataString = JSON.stringify(qrData);
    const qrCodeDataUrl = await QRCode.toDataURL(dataString, qrOptions);
    
    return {
      success: true,
      qrCodeDataUrl,
      qrData,
      dataString
    };
  } catch (error) {
    console.error('Error generating blockchain QR code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate QR code as SVG (for print-quality certificates)
 * @param {string} certificateId - Certificate ID
 * @param {Object} options - QR code generation options
 * @returns {Promise<string>} SVG QR code string
 */
export const generateCertificateQRSVG = async (certificateId, options = {}) => {
  if (!QRCode) {
    throw new Error('QRCode package not available. Please install: npm install qrcode');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${certificateId}`;

    const qrOptions = {
      type: 'svg',
      margin: 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      },
      width: options.size || 256,
      ...options.qrOptions
    };

    const qrCodeSVG = await QRCode.toString(verificationUrl, qrOptions);
    
    return {
      success: true,
      qrCodeSVG,
      verificationUrl,
      certificateId
    };
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Decode QR code data (for verification purposes)
 * @param {string} qrData - QR code data string
 * @returns {Object} Parsed QR data
 */
export const decodeQRData = (qrData) => {
  try {
    // Try to parse as JSON first (rich data)
    const parsed = JSON.parse(qrData);
    return {
      success: true,
      type: 'rich',
      data: parsed
    };
  } catch {
    // If not JSON, treat as simple URL
    if (qrData.includes('/verify/')) {
      const certificateId = qrData.split('/verify/').pop();
      return {
        success: true,
        type: 'simple',
        data: {
          certificateId,
          verificationUrl: qrData
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid QR code data format'
    };
  }
};

// Fallback QR code generation using HTML5 Canvas (if qrcode package not available)
export const generateQRFallback = async (certificateId) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${certificateId}`;
    
    // Simple fallback - return verification URL and let frontend handle QR generation
    return {
      success: true,
      verificationUrl,
      certificateId,
      fallback: true,
      message: 'QR package not available. Use frontend QR generator.'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};