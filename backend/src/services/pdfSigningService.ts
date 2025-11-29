import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios from 'axios';
import { generateQRCodeDataUrl } from './qrCodeService';
import { uploadCertificate, uploadToCloudinary } from './fileUploadService';

export interface PDFSigningOptions {
  documentUrl: string; // Cloudinary URL instead of local path
  signatureImageUrl?: string; // Cloudinary URL
  stampImageUrl?: string; // Cloudinary URL
  lawyerDetails: {
    name: string;
    licenseNumber: string;
    firmName: string;
    firmAddress?: string;
  };
  certificateId: string;
}

/**
 * Download file from URL to buffer
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

export class PDFSigningService {
  
  /**
   * Sign a PDF document with digital signature and stamp
   */
  async signDocument(options: PDFSigningOptions): Promise<string> {
    try {
      // 1. Download original PDF from Cloudinary
      const pdfBytes = await downloadFile(options.documentUrl);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // 2. Get last page for signature placement
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();
      
      // 3. Embed fonts
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // 4. Add certification box background
      const boxHeight = 150;
      const boxY = 50;
      lastPage.drawRectangle({
        x: 30,
        y: boxY,
        width: width - 60,
        height: boxHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
        color: rgb(0.98, 0.98, 0.98)
      });
      
      // 5. Add certification header
      lastPage.drawText('DIGITALLY CERTIFIED', {
        x: 40,
        y: boxY + boxHeight - 20,
        size: 12,
        font: boldFont,
        color: rgb(0, 0.2, 0.5)
      });
      
      // 6. Add lawyer details
      let textY = boxY + boxHeight - 45;
      const lineHeight = 14;
      
      lastPage.drawText(`Certified by: ${options.lawyerDetails.name}`, {
        x: 40,
        y: textY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      textY -= lineHeight;
      
      lastPage.drawText(`License Number: ${options.lawyerDetails.licenseNumber}`, {
        x: 40,
        y: textY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      textY -= lineHeight;
      
      lastPage.drawText(`Law Firm: ${options.lawyerDetails.firmName}`, {
        x: 40,
        y: textY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0)
      });
      textY -= lineHeight;
      
      if (options.lawyerDetails.firmAddress) {
        lastPage.drawText(`Address: ${options.lawyerDetails.firmAddress}`, {
          x: 40,
          y: textY,
          size: 9,
          font: regularFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        textY -= lineHeight;
      }
      
      lastPage.drawText(`Certificate ID: ${options.certificateId}`, {
        x: 40,
        y: textY,
        size: 10,
        font: boldFont,
        color: rgb(0, 0.2, 0.5)
      });
      textY -= lineHeight;
      
      const certDate = new Date().toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      lastPage.drawText(`Date: ${certDate}`, {
        x: 40,
        y: textY,
        size: 9,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      // 7. Add digital signature (if provided)
      if (options.signatureImageUrl) {
        try {
          const signatureBytes = await downloadFile(options.signatureImageUrl);
          const signatureImage = await pdfDoc.embedPng(signatureBytes);
          
          const signatureWidth = 120;
          const signatureHeight = 60;
          const signatureX = width - signatureWidth - 140;
          const signatureY = boxY + boxHeight - 90;
          
          lastPage.drawImage(signatureImage, {
            x: signatureX,
            y: signatureY,
            width: signatureWidth,
            height: signatureHeight
          });
          
          // Add signature label
          lastPage.drawText('Digital Signature', {
            x: signatureX,
            y: signatureY - 12,
            size: 8,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
          });
        } catch (error) {
          console.error('Error embedding signature:', error);
        }
      }
      
      // 8. Add official stamp (if provided)
      if (options.stampImageUrl) {
        try {
          const stampBytes = await downloadFile(options.stampImageUrl);
          const stampImage = await pdfDoc.embedPng(stampBytes);
          
          const stampSize = 80;
          const stampX = width - stampSize - 40;
          const stampY = boxY + boxHeight - 90;
          
          lastPage.drawImage(stampImage, {
            x: stampX,
            y: stampY,
            width: stampSize,
            height: stampSize,
            opacity: 0.9
          });
          
          // Add stamp label
          lastPage.drawText('Official Stamp', {
            x: stampX,
            y: stampY - 12,
            size: 8,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3)
          });
        } catch (error) {
          console.error('Error embedding stamp:', error);
        }
      }
      
      // 9. Add verification notice
      lastPage.drawText('Verify at: wakili-pro.com/verify/' + options.certificateId.split('-').pop(), {
        x: 40,
        y: boxY + 8,
        size: 8,
        font: regularFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      
      // 10. Save signed PDF to Cloudinary
      const signedPdfBytes = await pdfDoc.save();
      
      const timestamp = Date.now();
      const fileName = `certified-${options.certificateId}-${timestamp}.pdf`;
      
      const uploadResult = await uploadToCloudinary(
        Buffer.from(signedPdfBytes),
        fileName,
        `wakili-pro/certified-documents`
      );
      
      return uploadResult.url;
    } catch (error) {
      console.error('Error signing PDF:', error);
      throw new Error('Failed to sign document');
    }
  }
  
  /**
   * Generate Certificate of Authenticity PDF
   */
  async generateCertificate(options: {
    certificateId: string;
    documentName: string;
    lawyerName: string;
    licenseNumber: string;
    firmName: string;
    firmAddress?: string;
    certificationDate: Date;
  }): Promise<string> {
    try {
      // 1. Create new PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      
      const { width, height } = page.getSize();
      
      // 2. Embed fonts
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // 3. Add decorative header
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: rgb(0, 0.2, 0.5)
      });
      
      // 4. Add title
      page.drawText('CERTIFICATE OF AUTHENTICITY', {
        x: 80,
        y: height - 70,
        size: 24,
        font: titleFont,
        color: rgb(1, 1, 1)
      });
      
      page.drawText('Legal Document Certification', {
        x: 200,
        y: height - 95,
        size: 12,
        font: bodyFont,
        color: rgb(0.9, 0.9, 0.9)
      });
      
      // 5. Add certificate details section
      let currentY = height - 160;
      const leftMargin = 60;
      const lineHeight = 25;
      
      page.drawText('Certificate Information', {
        x: leftMargin,
        y: currentY,
        size: 14,
        font: headingFont,
        color: rgb(0, 0.2, 0.5)
      });
      currentY -= lineHeight + 10;
      
      // Certificate ID (prominent)
      page.drawRectangle({
        x: leftMargin - 10,
        y: currentY - 20,
        width: width - 120,
        height: 35,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0, 0.2, 0.5),
        borderWidth: 1
      });
      
      page.drawText('Certificate ID:', {
        x: leftMargin,
        y: currentY,
        size: 10,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      
      page.drawText(options.certificateId, {
        x: leftMargin + 100,
        y: currentY,
        size: 14,
        font: headingFont,
        color: rgb(0, 0.2, 0.5)
      });
      currentY -= lineHeight + 25;
      
      // Document details
      page.drawText('Document Details', {
        x: leftMargin,
        y: currentY,
        size: 14,
        font: headingFont,
        color: rgb(0, 0.2, 0.5)
      });
      currentY -= lineHeight + 5;
      
      page.drawText(`Document Name: ${options.documentName}`, {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: bodyFont,
        color: rgb(0, 0, 0)
      });
      currentY -= lineHeight;
      
      const dateStr = options.certificationDate.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      page.drawText(`Certification Date: ${dateStr}`, {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: bodyFont,
        color: rgb(0, 0, 0)
      });
      currentY -= lineHeight + 20;
      
      // Lawyer details
      page.drawText('Certified By', {
        x: leftMargin,
        y: currentY,
        size: 14,
        font: headingFont,
        color: rgb(0, 0.2, 0.5)
      });
      currentY -= lineHeight + 5;
      
      page.drawText(`Lawyer: ${options.lawyerName}`, {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: bodyFont,
        color: rgb(0, 0, 0)
      });
      currentY -= lineHeight;
      
      page.drawText(`License Number: ${options.licenseNumber}`, {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: bodyFont,
        color: rgb(0, 0, 0)
      });
      currentY -= lineHeight;
      
      page.drawText(`Law Firm: ${options.firmName}`, {
        x: leftMargin,
        y: currentY,
        size: 11,
        font: bodyFont,
        color: rgb(0, 0, 0)
      });
      currentY -= lineHeight;
      
      if (options.firmAddress) {
        page.drawText(`Address: ${options.firmAddress}`, {
          x: leftMargin,
          y: currentY,
          size: 10,
          font: bodyFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        currentY -= lineHeight;
      }
      
      currentY -= 20;
      
      // QR Code section
      page.drawText('Verification', {
        x: leftMargin,
        y: currentY,
        size: 14,
        font: headingFont,
        color: rgb(0, 0.2, 0.5)
      });
      currentY -= lineHeight + 5;
      
      // Generate and embed QR code
      try {
        const qrCodeDataUrl = await generateQRCodeDataUrl(options.certificateId);
        const qrCodeBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
        const qrCodeImage = await pdfDoc.embedPng(qrCodeBytes);
        
        const qrSize = 150;
        page.drawImage(qrCodeImage, {
          x: leftMargin,
          y: currentY - qrSize - 10,
          width: qrSize,
          height: qrSize
        });
        
        page.drawText('Scan QR code to verify this certificate', {
          x: leftMargin + qrSize + 20,
          y: currentY - 40,
          size: 11,
          font: bodyFont,
          color: rgb(0, 0, 0)
        });
        
        page.drawText('Or visit:', {
          x: leftMargin + qrSize + 20,
          y: currentY - 65,
          size: 10,
          font: bodyFont,
          color: rgb(0.4, 0.4, 0.4)
        });
        
        page.drawText(`wakili-pro.com/verify/${options.certificateId}`, {
          x: leftMargin + qrSize + 20,
          y: currentY - 85,
          size: 9,
          font: bodyFont,
          color: rgb(0, 0.3, 0.8)
        });
        
      } catch (error) {
        console.error('Error embedding QR code:', error);
      }
      
      // Footer with disclaimer
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 80,
        color: rgb(0.95, 0.95, 0.95)
      });
      
      page.drawText('This certificate validates the authenticity of the certified document.', {
        x: leftMargin,
        y: 50,
        size: 9,
        font: bodyFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      page.drawText('© 2024 Wakili Pro - Digital Legal Services Platform', {
        x: leftMargin,
        y: 30,
        size: 8,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4)
      });
      
      // 6. Save certificate PDF to Cloudinary
      const certificatePdfBytes = await pdfDoc.save();
      
      const fileName = `certificate-${options.certificateId}.pdf`;
      
      const uploadResult = await uploadCertificate(
        Buffer.from(certificatePdfBytes),
        fileName,
        options.certificateId
      );
      
      return uploadResult.url;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new Error('Failed to generate certificate');
    }
  }
}

export const pdfSigningService = new PDFSigningService();
