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

  const generatedContent = await generateDocumentWithAI(template, userInput);

  // Optionally store generated content in a DocumentVersion or update a purchase record later
  // For now return generated content
  return { content: generatedContent };
}

// Purchase a document (creates a DocumentPurchase record and returns payment info)
export async function purchaseDocument(templateId: string, userId: string, aiInput: Record<string, unknown> = {}) {
  const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error('Template not found');

  // Ensure required scalar fields per schema are provided. The schema requires `template` (string) and `documentId` (relation)
  const purchaseData = {
    userId,
    documentId: templateId,
    // Use priceKES (Int?) as amount (Float) - cast to number
    amount: Number(template.priceKES ?? 0),
    // Type is a string in schema
    type: template.type ?? 'CONTRACT',
    // content will be filled after generation; for now keep empty
    content: '',
    status: 'PENDING',
    description: template.description ?? '',
    // The schema requires a `template` string field - use the template content or name snapshot
    template: template.template ?? template.name ?? template.id,
  };

  const purchase = await prisma.documentPurchase.create({ data: purchaseData });

  // Initiate payment (stub) - replace with real integration
  // const paymentResult = await processPayment(userId, purchase.amount, ...aiInput);
  const paymentInfo = {
    paymentUrl: `https://mock-payment-provider.com/pay/${purchase.id}`,
    purchaseId: purchase.id,
    amount: purchase.amount,
    status: 'PENDING',
  };

  return { purchase, paymentInfo };
}

// Confirm payment for a document purchase and update status
export async function confirmDocumentPurchasePayment(purchaseId: string, paymentStatus: 'PAID' | 'FAILED') {
  const purchase = await prisma.documentPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) throw new Error('Purchase not found');

  if (purchase.status !== 'PENDING') {
    throw new Error('Purchase is not pending');
  }

  const newStatus = paymentStatus === 'PAID' ? 'PAID' : 'FAILED';

  const updated = await prisma.documentPurchase.update({
    where: { id: purchaseId },
    data: { status: newStatus },
  });

  return updated;
}

export async function downloadDocument(purchaseId: string, userId: string) {
  // Validate purchase belongs to user and that it's paid
  const purchase = await prisma.documentPurchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) throw new Error('Purchase not found');
  if (purchase.userId !== userId) throw new Error('Unauthorized');
  if (purchase.status !== 'PAID') throw new Error('Purchase not completed');

  // TODO: implement actual storage lookup (S3, filesystem, etc.)
  return { path: '/path/to/file', filename: 'document.pdf' };
}
