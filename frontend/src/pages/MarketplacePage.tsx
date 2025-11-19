import React, { useState } from 'react';
import { MarketplaceFilterBar } from '@/components/marketplace/MarketplaceFilterBar';
import { DocumentReviewSection } from '@/components/marketplace/DocumentReviewSection';
import { DocumentAnalyticsBadge } from '@/components/marketplace/DocumentAnalyticsBadge';
import { DocumentPurchaseFlow } from '@/components/marketplace/DocumentPurchaseFlow';
import { PurchaseLimitNotice } from '@/components/marketplace/PurchaseLimitNotice';
import { AuditLogList } from '@/components/marketplace/AuditLogList';
import { DocumentVersionSelector } from '@/components/marketplace/DocumentVersionSelector';
import { useMarketplaceFilter } from '@/hooks/marketplace/useMarketplaceFilter';
import { useDocumentReviews, useAddReview } from '@/hooks/marketplace/useDocumentReviews';
import { useDocumentAnalytics } from '@/hooks/marketplace/useDocumentAnalytics';
import { useDocumentPurchase } from '@/hooks/marketplace/useDocumentPurchase';
import { usePurchaseLimits } from '@/hooks/marketplace/usePurchaseLimits';
import { useAuditLogs } from '@/hooks/marketplace/useAuditLogs';
import { useDocumentVersions } from '@/hooks/marketplace/useDocumentVersions';

export const MarketplacePage: React.FC = () => {
  const [filters] = useState({});
  const { data: templatesData, isLoading: loadingTemplates } = useMarketplaceFilter(filters);
  const { data: auditLogs } = useAuditLogs();
  const { data: purchaseLimits } = usePurchaseLimits();

  // For demo, pick the first template as selected
  const selectedTemplate = templatesData?.templates?.[0];
  const documentId = selectedTemplate?.id || 'mock-doc';
  // Removed unused variables per lint

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Document Marketplace</h1>
      <MarketplaceFilterBar />
      {loadingTemplates ? (
        <div className="mt-8">Loading documents...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {templatesData?.templates?.map((template: import('@shared/types/ai').DocumentTemplate) => (
            <div key={template.id} className="border rounded-xl p-6 bg-white shadow-md flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg">{template.title}</span>
                {analytics && <DocumentAnalyticsBadge {...analytics} />}
              </div>
              <div className="text-gray-600 mb-2">{template.description}</div>
              <div className="flex-1" />
              {purchaseLimits && <PurchaseLimitNotice used={2} limit={5} period="month" />}
              <DocumentPurchaseFlow documentId={template.id} priceKES={template.priceKES} />
              <DocumentVersionSelector versions={versions || []} onSelect={() => {}} />
              <DocumentReviewSection documentId={template.id} />
            </div>
          ))}
        </div>
      )}
      <div className="mt-12">
        <AuditLogList logs={auditLogs || []} />
      </div>
    </div>
  );
};

export default MarketplacePage;
