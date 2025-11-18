import React from 'react';
import { DocumentTemplateManager } from '@/components/lawyerServices/DocumentTemplateManager';
import { CLECourseCatalog } from '@/components/lawyerServices/CLECourseCatalog';
import { LawyerProfileEditor } from '@/components/lawyerServices/LawyerProfileEditor';
import { LawyerCollaborationHub } from '@/components/lawyerServices/LawyerCollaborationHub';
import { LawyerServicesNav } from '@/components/lawyerServices/LawyerServicesNav';
import { SectionCard } from '@/components/lawyerServices/SectionCard';

const LawyerServicesDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <LawyerServicesNav />
      <main className="max-w-4xl mx-auto py-8 px-2 md:px-0">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center text-blue-800 tracking-tight drop-shadow-sm">
          Lawyer Services Dashboard
        </h1>
        <SectionCard id="document-templates" title="Document Templates">
          <DocumentTemplateManager />
        </SectionCard>
        <SectionCard id="cle-courses" title="CLE Course Catalog">
          <CLECourseCatalog />
        </SectionCard>
        <SectionCard id="profile-branding" title="Profile & Branding">
          <LawyerProfileEditor />
        </SectionCard>
        <SectionCard id="collaboration" title="Collaboration & Networking">
          <LawyerCollaborationHub />
        </SectionCard>
      </main>
    </div>
  );
};

export default LawyerServicesDashboard;
