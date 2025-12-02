import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  content: string;
}

interface GeneratedDocument {
  id: string;
  filePath: string;
  fileName: string;
  content: string;
}

/**
 * Generate document content from template
 */
export async function generateDocumentContent(
  templateId: string,
  userInput: Record<string, any> = {}
): Promise<string> {
  try {
    logger.info(`Generating document from template: ${templateId}`);

    // Get template metadata
    const template = await getTemplateContent(templateId);
    
    // Generate filled content based on template
    const filledContent = fillTemplate(template, userInput);
    
    return filledContent;
  } catch (error) {
    logger.error('Document content generation error:', error);
    throw error;
  }
}

/**
 * Get template content based on template ID
 */
function getTemplateContent(templateId: string): DocumentTemplate {
  // This maps our marketplace template IDs to actual content
  const templates: Record<string, DocumentTemplate> = {
    '1': {
      id: '1',
      title: 'Employment Contract Template',
      category: 'Employment',
      content: `EMPLOYMENT CONTRACT

This Employment Agreement is entered into on {{date}} day of {{month}}, {{year}}

BETWEEN:

Employer: {{employerName}} ("Company")
Address: {{employerAddress}}
Registration No: {{companyReg}}

AND

Employee: {{employeeName}} ("Employee")
ID No: {{employeeId}}
Address: {{employeeAddress}}

1. POSITION AND DUTIES

1.1 The Employee shall serve as {{jobTitle}}
1.2 Reporting to: {{reportingTo}}
1.3 Key Responsibilities:
    - {{responsibility1}}
    - {{responsibility2}}
    - {{responsibility3}}

2. REMUNERATION

2.1 Basic Salary: KES {{salary}} per month
2.2 Benefits:
    - Housing Allowance: KES {{housingAllowance}}
    - Medical Insurance: {{medicalCover}}
    - Transport Allowance: KES {{transport}}

3. WORKING HOURS

3.1 Normal working hours: {{startTime}} to {{endTime}}
3.2 Working days: Monday to Friday
3.3 Lunch break: 1 hour

4. LEAVE ENTITLEMENT

4.1 Annual Leave: 21 working days per year
4.2 Sick Leave: 7 days with full pay, 7 days with half pay
4.3 Maternity Leave: 3 months as per Kenya Employment Act

5. TERMINATION

5.1 Notice Period: {{noticePeriod}} days written notice
5.2 Either party may terminate this contract by giving notice
5.3 Summary dismissal for gross misconduct

6. CONFIDENTIALITY

6.1 Employee shall not disclose Company confidential information
6.2 This obligation continues after termination

7. PROBATION

7.1 Probation Period: {{probationPeriod}} months
7.2 Performance review at end of probation

8. GOVERNING LAW

This agreement shall be governed by the Laws of Kenya.

SIGNED BY:

For the Company: _____________________  Date: __________

Employee: _____________________  Date: __________

Witness: _____________________  Date: __________`
    },
    // Add more templates as needed
  };

  const template = templates[templateId];
  if (!template) {
    // Return generic template for unknown IDs
    return {
      id: templateId,
      title: 'Legal Document',
      category: 'General',
      content: `LEGAL DOCUMENT

This document is created on {{date}} day of {{month}}, {{year}}

BETWEEN:

Party 1: {{party1Name}}
Party 2: {{party2Name}}

TERMS AND CONDITIONS:

{{terms}}

SIGNED BY:

Party 1: _____________________  Date: __________

Party 2: _____________________  Date: __________`
    };
  }

  return template;
}

/**
 * Fill template with user input
 */
function fillTemplate(template: DocumentTemplate, userInput: Record<string, any>): string {
  let content = template.content;
  
  // If no user input, use placeholder values
  const today = new Date();
  const defaultValues: Record<string, string> = {
    date: today.getDate().toString(),
    month: today.toLocaleString('default', { month: 'long' }),
    year: today.getFullYear().toString(),
    employerName: '[Employer Name]',
    employerAddress: '[Employer Address]',
    companyReg: '[Company Registration No]',
    employeeName: '[Employee Name]',
    employeeId: '[ID Number]',
    employeeAddress: '[Employee Address]',
    jobTitle: '[Job Title]',
    reportingTo: '[Reporting Manager]',
    responsibility1: '[Responsibility 1]',
    responsibility2: '[Responsibility 2]',
    responsibility3: '[Responsibility 3]',
    salary: '[Monthly Salary]',
    housingAllowance: '[Housing Allowance]',
    medicalCover: '[Medical Cover Details]',
    transport: '[Transport Allowance]',
    startTime: '8:00 AM',
    endTime: '5:00 PM',
    noticePeriod: '30',
    probationPeriod: '3',
    party1Name: '[Party 1 Name]',
    party2Name: '[Party 2 Name]',
    terms: '[Terms and Conditions]',
  };

  // Merge user input with defaults
  const values = { ...defaultValues, ...userInput };

  // Replace all placeholders
  Object.keys(values).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, values[key]);
  });

  return content;
}

/**
 * Generate PDF from document content
 */
export async function generatePDF(
  content: string,
  documentTitle: string,
  purchaseId: string
): Promise<string> {
  try {
    logger.info(`Generating PDF for purchase: ${purchaseId}`);

    // Ensure storage directory exists
    const storageDir = path.join(process.cwd(), 'storage', 'documents');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }

    const fileName = `${documentTitle.replace(/[^a-z0-9]/gi, '_')}_${purchaseId}.pdf`;
    const filePath = path.join(storageDir, fileName);

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 72, right: 72 }
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text(documentTitle.toUpperCase(), { align: 'center' });
    
    doc.moveDown();
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Generated by Wakili Pro on ${new Date().toLocaleDateString()}`, { align: 'center' });
    
    doc.moveDown(2);

    // Add content
    doc.fontSize(12)
       .font('Helvetica')
       .text(content, {
         align: 'left',
         lineGap: 5
       });

    // Add footer
    doc.fontSize(8)
       .moveDown(3)
       .text('_'.repeat(80), { align: 'center' })
       .moveDown(0.5)
       .text('This document was generated by Wakili Pro - Kenya Legal Services Platform', { align: 'center' })
       .text('For support, visit www.wakilipro.com or email support@wakilipro.com', { align: 'center' });

    doc.end();

    // Wait for file to be written
    await new Promise((resolve, reject) => {
      writeStream.on('finish', () => resolve(undefined));
      writeStream.on('error', reject);
    });

    logger.info(`PDF generated successfully: ${filePath}`);
    return filePath;
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw error;
  }
}

/**
 * Store generated document and update purchase record
 */
export async function storeGeneratedDocument(
  purchaseId: string,
  filePath: string,
  content: string
): Promise<void> {
  try {
    const fileName = path.basename(filePath);

    await prisma.documentPurchase.update({
      where: { id: purchaseId },
      data: {
        content,
        template: fileName,
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    logger.info(`Document stored for purchase: ${purchaseId}`);
  } catch (error) {
    logger.error('Document storage error:', error);
    throw error;
  }
}

/**
 * Complete document generation flow
 */
export async function processDocumentGeneration(
  purchaseId: string,
  templateId: string,
  documentTitle: string,
  userInput: Record<string, any> = {}
): Promise<GeneratedDocument> {
  try {
    logger.info(`Processing document generation for purchase: ${purchaseId}`);

    // 1. Generate content from template
    const content = await generateDocumentContent(templateId, userInput);

    // 2. Generate PDF
    const filePath = await generatePDF(content, documentTitle, purchaseId);

    // 3. Store in database
    await storeGeneratedDocument(purchaseId, filePath, content);

    return {
      id: purchaseId,
      filePath,
      fileName: path.basename(filePath),
      content
    };
  } catch (error) {
    logger.error('Document generation process error:', error);
    throw error;
  }
}
