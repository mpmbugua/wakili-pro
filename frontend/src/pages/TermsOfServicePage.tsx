import React from 'react';
import { FileText, Scale, AlertTriangle, CheckCircle, XCircle, DollarSign } from 'lucide-react';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Terms of Service</h1>
          <p className="text-slate-600">Last updated: December 6, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-indigo-50 border-l-4 border-indigo-600 rounded-r-lg p-6 mb-8">
          <p className="text-slate-700 leading-relaxed">
            Welcome to Wakili Pro. By accessing or using our platform, you agree to be bound by these Terms of Service. 
            Please read them carefully before using our services. If you do not agree with these terms, please do not use our platform.
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none space-y-8">
          {/* 1. Definitions */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <FileText className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">1. Definitions</h2>
            </div>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>"Platform"</strong> refers to the Wakili Pro website, mobile applications, and all associated services</li>
              <li><strong>"User"</strong> means any person who accesses or uses the Platform</li>
              <li><strong>"Client"</strong> means a User who seeks legal services through the Platform</li>
              <li><strong>"Lawyer"</strong> means a verified legal professional registered on the Platform</li>
              <li><strong>"Services"</strong> include legal consultations, document reviews, AI assistance, and marketplace offerings</li>
              <li><strong>"Content"</strong> includes text, images, documents, and other materials on the Platform</li>
            </ul>
          </section>

          {/* 2. Acceptance of Terms */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Acceptance of Terms</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              By creating an account or using any part of the Platform, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms of Service and our Privacy Policy. These terms constitute a legally 
              binding agreement between you and Wakili Pro.
            </p>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the Platform after changes 
              constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">3. User Accounts</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.1 Registration</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              To use certain features, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information as necessary</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.2 Account Termination</h3>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent 
              activity, or are inactive for extended periods.
            </p>
          </section>

          {/* 4. Lawyer Verification */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Lawyer Verification and Obligations</h2>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-3">4.1 Verification Process</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              All lawyers on the Platform must:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Be licensed to practice law in Kenya by the Law Society of Kenya</li>
              <li>Provide valid practicing certificates and identification</li>
              <li>Maintain professional indemnity insurance</li>
              <li>Comply with the Advocates Act and professional conduct rules</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">4.2 Professional Responsibilities</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Lawyers agree to:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Provide competent and professional legal services</li>
              <li>Maintain client confidentiality per legal ethics requirements</li>
              <li>Respond to client inquiries within reasonable timeframes</li>
              <li>Disclose any conflicts of interest</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>
          </section>

          {/* 5. Services and Limitations */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">5. Services and Limitations</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-3">5.1 Platform Role</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Wakili Pro is a technology platform that facilitates connections between clients and lawyers. We:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Do not</strong> provide legal advice or practice law</li>
              <li><strong>Do not</strong> guarantee specific legal outcomes</li>
              <li><strong>Are not</strong> responsible for the quality of legal services provided by lawyers</li>
              <li><strong>Act as</strong> an intermediary to facilitate legal service delivery</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">5.2 AI Legal Assistant</h3>
            <p className="text-slate-700 leading-relaxed">
              Our AI assistant provides general legal information only. It does not constitute legal advice and 
              should not be relied upon as a substitute for consultation with a qualified lawyer. For specific 
              legal matters, always consult a licensed attorney.
            </p>
          </section>

          {/* 6. Payments and Refunds */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <DollarSign className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">6. Payments and Refunds</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-3">6.1 Payment Processing</h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>All payments are processed securely through M-Pesa or other approved payment methods</li>
              <li>Prices are displayed in Kenyan Shillings (KES) and include applicable taxes</li>
              <li>Payment must be made upfront before services are rendered</li>
              <li>We reserve the right to change pricing with reasonable notice</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">6.2 Refund Policy</h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Consultations:</strong> If a lawyer doesn't respond within 30 minutes, you'll receive 3 alternative lawyer recommendations and can rebook for free. Refunds available upon request if you prefer not to use recommended alternatives</li>
              <li><strong>Document Reviews:</strong> Refund available before review begins; partial refund if service is unsatisfactory</li>
              <li><strong>Marketplace Documents:</strong> No refunds after download, unless document is defective</li>
              <li><strong>Service Requests:</strong> Commitment fee non-refundable after quotes are received; 30% upfront payment non-refundable after work begins</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">6.3 Platform Fees</h3>
            <p className="text-slate-700 leading-relaxed">
              Wakili Pro charges a platform fee (typically 20% of transaction value) to maintain and improve our services. 
              This fee is included in displayed prices for clients and deducted from lawyer payments.
            </p>
          </section>

          {/* 7. Prohibited Activities */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">7. Prohibited Activities</h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              Users must not:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Circumvent the Platform to conduct transactions directly with lawyers (for first 6 months)</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate others or provide false information</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Scrape, data mine, or copy Platform content without permission</li>
              <li>Use the Platform for unlawful purposes</li>
              <li>Attempt to gain unauthorized access to systems or user accounts</li>
            </ul>
          </section>

          {/* 8. Intellectual Property */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Intellectual Property</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              All Platform content, features, and functionality (including but not limited to text, graphics, logos, 
              icons, images, audio clips, and software) are owned by Wakili Pro or its licensors and are protected 
              by Kenyan and international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-slate-700 leading-relaxed">
              You may not reproduce, distribute, modify, create derivative works from, or publicly display any 
              content from the Platform without our express written permission.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 mr-3 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 m-0 mb-2">9. Limitation of Liability</h2>
                <p className="text-slate-700 leading-relaxed mb-4">
                  To the fullest extent permitted by law:
                </p>
                <ul className="list-disc pl-6 text-slate-700 space-y-2">
                  <li>We are not liable for the actions, errors, or omissions of lawyers on the Platform</li>
                  <li>We do not guarantee uninterrupted or error-free Platform operation</li>
                  <li>Our total liability for any claim is limited to the amount you paid us in the 12 months prior</li>
                  <li>We are not liable for indirect, incidental, or consequential damages</li>
                  <li>The Platform is provided "as is" without warranties of any kind</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 10. Dispute Resolution */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-4 mb-3">10.1 Client-Lawyer Disputes</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              Disputes between clients and lawyers should first be resolved directly. If unresolved, either party 
              may request Platform mediation. We are not obligated to intervene but may do so at our discretion.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">10.2 Governing Law</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              These Terms are governed by the laws of Kenya. Any disputes arising from these Terms or use of the 
              Platform shall be subject to the exclusive jurisdiction of the courts in Nairobi, Kenya.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">10.3 Arbitration</h3>
            <p className="text-slate-700 leading-relaxed">
              For disputes exceeding KES 100,000, parties agree to attempt resolution through arbitration under 
              the Arbitration Act, 1995, before pursuing litigation.
            </p>
          </section>

          {/* 11. Termination */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">11. Termination</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We may suspend or terminate your account and access to the Platform at any time, with or without 
              cause or notice, for conduct that we believe:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Violates these Terms or our policies</li>
              <li>Harms other users, third parties, or our business interests</li>
              <li>Exposes us or others to legal liability</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              Upon termination, your right to use the Platform will immediately cease. Sections of these Terms 
              that by their nature should survive termination will remain in effect.
            </p>
          </section>

          {/* 12. Changes to Terms */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">12. Changes to These Terms</h2>
            <p className="text-slate-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be communicated via 
              email or Platform notification at least 30 days before taking effect. Your continued use of the 
              Platform after changes become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
            <p className="leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> <a href="mailto:legal@wakilipro.co.ke" className="underline hover:text-indigo-100">legal@wakilipro.co.ke</a></p>
              <p><strong>Phone:</strong> +254 700 000 000</p>
              <p><strong>Address:</strong> Westlands, Nairobi, Kenya</p>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="bg-slate-100 border-l-4 border-slate-600 rounded-r-lg p-6">
            <p className="text-slate-700 leading-relaxed">
              <strong>By using Wakili Pro, you acknowledge that you have read, understood, and agree to be bound 
              by these Terms of Service.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
