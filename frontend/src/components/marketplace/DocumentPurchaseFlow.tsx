import React from 'react';

import { useDocumentPurchase } from '@/hooks/marketplace/useDocumentPurchase';
import { useState } from 'react';

interface DocumentPurchaseFlowProps {
  documentId: string;
  priceKES: number;
}

export const DocumentPurchaseFlow: React.FC<DocumentPurchaseFlowProps> = ({ documentId, priceKES }) => {
  const purchaseMutation = useDocumentPurchase();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const handlePurchase = async () => {
    setShowSuccess(false);
    setShowError(false);
    purchaseMutation.mutate(
      { documentId },
      {
        onSuccess: () => setShowSuccess(true),
        onError: () => setShowError(true),
      }
    );
  };

  return (
    <div className="mt-4">
      <button
        className="bg-green-600 text-white px-4 py-2 rounded font-semibold"
        onClick={handlePurchase}
        disabled={purchaseMutation.isLoading}
      >
        {purchaseMutation.isLoading ? 'Processing...' : `Purchase for KES ${priceKES}`}
      </button>
      {showSuccess && <div className="text-green-700 mt-2">Purchase successful!</div>}
      {showError && <div className="text-red-700 mt-2">Purchase failed. Please try again.</div>}
    </div>
  );
};
