import React from 'react';
import { Shield, Users, Target, Heart, Award, TrendingUp } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Wakili Pro</h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Democratizing access to legal services across Kenya through technology and innovation
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
              <div className="flex items-center mb-4">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">Our Mission</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                To make quality legal services accessible, affordable, and transparent for every Kenyan. 
                We bridge the gap between legal professionals and clients through cutting-edge technology, 
                ensuring that justice is not a privilege but a right available to all.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-indigo-600">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-slate-900">Our Vision</h2>
              </div>
              <p className="text-slate-700 leading-relaxed">
                To become East Africa's leading legal technology platform, transforming how legal services 
                are delivered and consumed. We envision a future where every individual and business has 
                instant access to expert legal guidance, powered by AI and human expertise.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Integrity</h3>
              <p className="text-slate-600">
                We uphold the highest standards of professional ethics, transparency, and trustworthiness 
                in all our dealings.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Accessibility</h3>
              <p className="text-slate-600">
                Breaking down barriers to legal services, making expert legal help available to everyone, 
                regardless of location or budget.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Client-Centric</h3>
              <p className="text-slate-600">
                Every feature we build, every decision we make, starts with understanding and serving 
                our clients' needs better.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">Our Story</h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-700 leading-relaxed mb-4">
              Wakili Pro was born from a simple observation: while Kenya has thousands of qualified lawyers, 
              millions of Kenyans struggle to access affordable, timely legal services. The traditional model 
              of legal service delivery was broken—opaque pricing, geographical barriers, and limited access 
              to information left many without the legal help they desperately needed.
            </p>
            <p className="text-slate-700 leading-relaxed mb-4">
              Founded in 2024, we set out to change this narrative. By combining cutting-edge artificial 
              intelligence with a network of verified legal professionals, we created a platform that makes 
              legal services as accessible as ordering a ride or booking a hotel room.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Today, Wakili Pro serves thousands of clients and partners with hundreds of lawyers across Kenya, 
              facilitating everything from quick legal consultations to complex corporate transactions. Our AI 
              assistant provides instant answers to common legal questions, while our marketplace offers 
              affordable legal documents and connects clients with the right legal experts for their specific needs.
            </p>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Verified Lawyers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Consultations Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">Legal Documents Provided</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">47</div>
              <div className="text-blue-100">Counties Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Why Choose Wakili Pro?</h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            We're not just another legal directory. We're a comprehensive legal ecosystem designed for modern Kenya.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Verified Professionals</h3>
              <p className="text-slate-600">
                Every lawyer on our platform is verified by the Law Society of Kenya, ensuring you get 
                qualified, licensed legal experts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Transparent Pricing</h3>
              <p className="text-slate-600">
                Know exactly what you'll pay before you commit. No hidden fees, no surprises—just clear, 
                upfront pricing.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">24/7 AI Support</h3>
              <p className="text-slate-600">
                Our AI legal assistant is always available to answer basic legal questions and guide you 
                to the right resources.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Join Thousands of Satisfied Clients</h2>
          <p className="text-xl text-slate-600 mb-8">
            Experience the future of legal services in Kenya today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/lawyers"
              className="btn-primary px-8 py-3 text-lg inline-block"
            >
              Find a Lawyer
            </a>
            <a
              href="/ai"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors inline-block"
            >
              Try AI Assistant
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
