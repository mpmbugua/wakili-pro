


import React, { useState, useEffect } from 'react';
import { DocumentTemplate } from '@shared/types/ai';
import { useQuery } from '@tanstack/react-query';
import { fetchDocumentTemplates, purchaseDocumentTemplate, getPurchaseStatus, downloadDocument, PurchaseResult } from '../services/documentMarketplace';
import DocumentPurchaseModal from '../components/marketplace/DocumentPurchaseModal';
import { toast } from 'react-hot-toast';


const DocumentMarketplacePage: React.FC = () => {
  const { data, isLoading, error } = useQuery(['document-templates'], fetchDocumentTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PurchaseResult['paymentInfo'] | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [pollingError, setPollingError] = useState<string | null>(null);

  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePurchase = async (template: DocumentTemplate | null, aiInput: import('../services/documentMarketplace').PurchaseAIInput) => {
    if (!template || !aiInput) {
      setSelectedTemplate(null);
      return;
    }
    setIsPurchasing(true);
    try {
      toast.loading('Initiating purchase...');
      const result = await purchaseDocumentTemplate(template.id, aiInput);
      setPaymentInfo(result.paymentInfo);
      setPurchaseId(result.purchase.id);
      setSelectedTemplate(null);
      toast.dismiss();
      toast.success('Purchase initiated. Please complete payment.');
    } catch (e) {
      toast.dismiss();
      let msg = 'Failed to initiate purchase.';
      if (typeof e === 'object' && e && 'response' in e && typeof (e as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
        msg = (e as { response: { data: { message: string } } }).response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsPurchasing(false);
    }
  };

  // Poll for payment status if purchaseId is set and not PAID
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (purchaseId && paymentInfo && paymentInfo.status === 'PENDING' && !downloadUrl) {
      interval = setInterval(async () => {
        try {
          const status = await getPurchaseStatus(purchaseId);
          setPurchaseStatus(status);
          if (status === 'PAID') {
            clearInterval(interval);
            toast.success('Payment confirmed! Document is ready for download.');
            setIsDownloading(true);
            toast.loading('Preparing your document...');
            try {
              const url = await downloadDocument(purchaseId);
              setDownloadUrl(url);
              toast.dismiss();
              toast.success('Download ready!');
              // Auto-trigger download
              const link = document.createElement('a');
              link.href = url;
              link.download = '';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              // Reset state after download
              setTimeout(() => {
                setPaymentInfo(null);
                setPurchaseId(null);
                setPurchaseStatus(null);
                setDownloadUrl(null);
                setPollingError(null);
                setIsDownloading(false);
              }, 2000);
            } catch (downloadErr) {
              toast.dismiss();
              let msg = 'Failed to download document.';
              if (typeof downloadErr === 'object' && downloadErr && 'response' in downloadErr && typeof (downloadErr as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
                msg = (downloadErr as { response: { data: { message: string } } }).response.data.message;
              }
              toast.error(msg);
              setIsDownloading(false);
            }
          } else if (status === 'FAILED') {
            clearInterval(interval);
            toast.error('Payment failed. Please try again.');
            setPollingError('Payment failed.');
          }
        } catch (err) {
          clearInterval(interval);
          let msg = 'Error checking payment status.';
          if (typeof err === 'object' && err && 'response' in err && typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string') {
            msg = (err as { response: { data: { message: string } } }).response.data.message;
          }
          toast.error(msg);
          setPollingError('Error checking payment status.');
        }
      }, 3000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [purchaseId, paymentInfo, downloadUrl]);

  if (isLoading) return <div className="p-8 text-center">Loading templates...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading templates.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">AI Document Marketplace</h1>
      {paymentInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded" role="status" aria-live="polite">
          <div className="font-bold mb-2">Payment Initiated</div>
          <div>Amount: KES {paymentInfo.amount}</div>
          <div>Status: {purchaseStatus || paymentInfo.status}</div>
          <a href={paymentInfo.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline" aria-label="Proceed to Payment">Proceed to Payment</a>
          {pollingError && <div className="mt-2 text-red-600" role="alert">{pollingError}</div>}
          {isDownloading && (
            <div className="mt-4 flex items-center gap-2 text-blue-700">
              <svg className="animate-spin h-5 w-5 mr-2 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Preparing your document...
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.templates?.map((template: DocumentTemplate) => (
          <div key={template.id} className="border rounded-lg p-4 shadow bg-white">
            <h2 className="text-lg font-semibold mb-2">{template.name}</h2>
            <p className="text-gray-600 mb-2">{template.description}</p>
            <div className="mb-2 text-sm text-gray-500">Type: {template.type}</div>
            <div className="mb-2 text-sm text-gray-500">Price: KES {template.priceKES}</div>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setSelectedTemplate(template)}
              aria-label={`Purchase ${template.name}`}
              disabled={isPurchasing || (paymentInfo && paymentInfo.status === 'PENDING')}
            >
              {isPurchasing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                  Processing...
                </span>
              ) : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
      {selectedTemplate && (
        <DocumentPurchaseModal
          template={selectedTemplate}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
};

export default DocumentMarketplacePage;
