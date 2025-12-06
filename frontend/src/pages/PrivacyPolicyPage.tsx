import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: December 6, 2025</p>
        </div>

        {/* Introduction */}
        <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-lg p-6 mb-8">
          <p className="text-slate-700 leading-relaxed">
            At Wakili Pro, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your information when you use our platform. Please read this policy carefully 
            to understand our views and practices regarding your personal data.
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none space-y-8">
          {/* 1. Information We Collect */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <Database className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">1. Information We Collect</h2>
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.1 Personal Information</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Name, email address, and phone number</li>
              <li>Professional credentials (for lawyers)</li>
              <li>Payment information (processed securely through M-Pesa)</li>
              <li>Legal consultation details and case descriptions</li>
              <li>Profile photos and professional documents</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.2 Usage Data</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We automatically collect certain information when you use our platform:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage patterns and interaction with platform features</li>
              <li>Search queries and preferences</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">1.3 AI Interaction Data</h3>
            <p className="text-slate-700 leading-relaxed">
              When you use our AI legal assistant, we collect and process your questions and the AI's responses 
              to improve our services and provide better legal guidance.
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <Eye className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">2. How We Use Your Information</h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>To provide, maintain, and improve our legal services platform</li>
              <li>To facilitate connections between clients and lawyers</li>
              <li>To process payments and manage transactions</li>
              <li>To send you important notifications about bookings, payments, and account activity</li>
              <li>To provide customer support and respond to your inquiries</li>
              <li>To personalize your experience and recommend relevant services</li>
              <li>To detect, prevent, and address technical issues and fraudulent activity</li>
              <li>To comply with legal obligations and enforce our Terms of Service</li>
              <li>To conduct research and analysis to improve our AI capabilities</li>
            </ul>
          </section>

          {/* 3. Information Sharing and Disclosure */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <UserCheck className="h-6 w-6 text-emerald-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">3. Information Sharing and Disclosure</h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.1 With Lawyers</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              When you book a consultation or request legal services, we share relevant information with the 
              lawyer you select to facilitate the service delivery.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.2 Service Providers</h3>
            <p className="text-slate-700 leading-relaxed mb-4">
              We work with third-party service providers who assist us in:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Payment processing (M-Pesa, Safaricom)</li>
              <li>Cloud hosting and data storage</li>
              <li>Email and SMS notifications</li>
              <li>Analytics and performance monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mt-6 mb-3">3.3 Legal Requirements</h3>
            <p className="text-slate-700 leading-relaxed">
              We may disclose your information if required by law, court order, or governmental request, 
              or to protect our rights, property, or safety.
            </p>
          </section>

          {/* 4. Data Security */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <Lock className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">4. Data Security</h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Employee training on data protection practices</li>
              <li>Compliance with Kenya's Data Protection Act, 2019</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              However, no method of transmission over the internet is 100% secure. While we strive to protect 
              your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 5. Your Rights */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900 m-0">5. Your Privacy Rights</h2>
            </div>
            
            <p className="text-slate-700 leading-relaxed mb-4">
              Under the Kenya Data Protection Act, 2019, you have the following rights:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal obligations)</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Data Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at <a href="mailto:privacy@wakilipro.co.ke" className="text-blue-600 hover:text-blue-700">privacy@wakilipro.co.ke</a>
            </p>
          </section>

          {/* 6. Cookies */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              We use cookies and similar technologies to enhance your experience:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
              <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-4">
              You can control cookies through your browser settings, but disabling certain cookies may 
              affect platform functionality.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
            <p className="text-slate-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide our services and 
              comply with legal obligations. When you delete your account, we will delete or anonymize 
              your personal data within 90 days, except where we are required to retain it for legal 
              or regulatory purposes.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-start mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 m-0 mb-2">8. Children's Privacy</h2>
                <p className="text-slate-700 leading-relaxed">
                  Our platform is not intended for individuals under the age of 18. We do not knowingly 
                  collect personal information from children. If you believe we have collected information 
                  from a child, please contact us immediately.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Changes to Privacy Policy */}
          <section className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-slate-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the "Last updated" date. 
              Your continued use of the platform after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="leading-relaxed mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="space-y-2">
              <p><strong>Email:</strong> <a href="mailto:privacy@wakilipro.co.ke" className="underline hover:text-blue-100">privacy@wakilipro.co.ke</a></p>
              <p><strong>Phone:</strong> +254 700 000 000</p>
              <p><strong>Address:</strong> Westlands, Nairobi, Kenya</p>
            </div>
            <p className="mt-4 text-sm text-blue-100">
              For data protection inquiries, you may also contact the Office of the Data Protection Commissioner: 
              <a href="https://www.odpc.go.ke" className="underline hover:text-white ml-1" target="_blank" rel="noopener noreferrer">www.odpc.go.ke</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
