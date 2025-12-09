import { prisma } from '../utils/prisma';
import { generateDocumentWithAI } from '../utils/aiDocumentGenerator';
// processPayment stub: replace with actual payment integration when available

// Return all active document templates
export async function getAllTemplates() {
  return prisma.documentTemplate.findMany({ where: { isActive: true } });
}

// Generate document content using AI helper and optionally persist as a DocumentVersion or similar
export async function generateDocument(templateId: string, userInput: Record<string, unknown>, userId: string) {
  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Template not found');

  const generatedContent = await generateDocumentWithAI(template as any, userInput); // Cast to any to fix type mismatch

  // Optionally store generated content in a DocumentVersion or update a purchase record later
  // For now return generated content
  return { content: generatedContent };
}

// Purchase a document (creates a DocumentPurchase record and returns payment info)
export async function purchaseDocument(templateId: string, userId: string, aiInput: Record<string, unknown> = {}) {
  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Template not found');

  const purchase = await prisma.documentPurchase.create({
    data: {
      userId,
      // templateId doesn't exist in schema - DocumentPurchase uses different fields
      documentId: templateId,
      amount: template.priceKES,
      status: 'COMPLETED'
    } as any
  });

  // Initiate payment (stub) - replace with real integration
  const paymentInfo = {
    paymentUrl: `https://mock-payment-provider.com/pay/${purchase.id}`,
    purchaseId: purchase.id,
    // No amount or status fields in DocumentPurchase model
  };

  return { purchase, paymentInfo };
}

// Confirm payment for a document purchase and update status
export async function confirmDocumentPurchasePayment(purchaseId: string, paymentStatus: 'PAID' | 'FAILED') {
  // DocumentPurchase has no status field; this is a stub for future payment logic
  const purchase = await prisma.documentPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) throw new Error('Purchase not found');
  // In a real implementation, you would update a payment record or similar here
  return purchase;
}

export async function downloadDocument(purchaseId: string, userId: string) {
  // Validate purchase belongs to user
  const purchase = await prisma.documentPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) throw new Error('Purchase not found');
  if (purchase.userId !== userId) throw new Error('Unauthorized');
  // In a real implementation, check payment status elsewhere

  // TODO: implement actual storage lookup (S3, filesystem, etc.)
  return { path: '/path/to/file', filename: 'document.pdf' };
}
