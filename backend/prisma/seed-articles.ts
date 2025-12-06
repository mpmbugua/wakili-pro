import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting article seeding...');

  // First, ensure we have lawyer users
  const password = await bcrypt.hash('Password123!', 10);
  
  const lawyers = [
    {
      email: 'lucy@wakilipro.com',
      firstName: 'Lucy',
      lastName: 'Wanjiku',
      specialization: 'Corporate Law'
    },
    {
      email: 'james@wakilipro.com',
      firstName: 'James',
      lastName: 'Mwangi',
      specialization: 'Employment Law'
    },
    {
      email: 'grace@wakilipro.com',
      firstName: 'Grace',
      lastName: 'Njeri',
      specialization: 'Property Law'
    }
  ];

  // Create lawyer users if they don't exist
  for (const lawyer of lawyers) {
    try {
      await prisma.user.upsert({
        where: { email: lawyer.email },
        update: {},
        create: {
          email: lawyer.email,
          password,
          firstName: lawyer.firstName,
          lastName: lawyer.lastName,
          role: 'LAWYER',
          phoneNumber: `+254712${Math.floor(Math.random() * 1000000)}`,
        }
      });
      console.log(`✅ Lawyer user ${lawyer.firstName} ${lawyer.lastName} ready`);
    } catch (error) {
      console.error(`Error creating lawyer ${lawyer.email}:`, error);
    }
  }

const articles = [
  {
    id: 'art-data-protection-2025',
    authorEmail: 'lucy@wakilipro.com', // Lucy Wanjiku - Corporate Law expert
    title: 'Understanding the New Data Protection Regulations in Kenya: A Comprehensive Guide for Businesses',
    category: 'Corporate Law',
    content: `
<!--METADATA:{"category":"Corporate Law","tags":["Data Protection","Privacy","Compliance","GDPR","Business"],"aiSummary":"Kenya's Data Protection Act, 2019 has transformed how businesses handle personal information. Learn about compliance requirements, penalties for violations, and best practices for protecting customer data in the digital age.","qualityScore":95,"source":"lawyer","readTime":"12 min read"}-->

<h2>Introduction</h2>

<p>Kenya's Data Protection Act, 2019, which came into force in November 2019, has fundamentally changed how businesses and organizations handle personal data. As a corporate lawyer who has advised hundreds of companies on compliance, I've seen firsthand the challenges and opportunities this legislation presents.</p>

<p>This comprehensive guide will help you understand your obligations, avoid costly penalties, and build trust with your customers through proper data protection practices.</p>

<h2>Key Principles of the Data Protection Act</h2>

<p>The Act is built on several fundamental principles that every business must understand:</p>

<h3>1. Lawfulness, Fairness, and Transparency</h3>
<p>You must process personal data lawfully, fairly, and in a transparent manner. This means:</p>
<ul>
  <li>Having a legitimate legal basis for collecting data</li>
  <li>Being honest about how you'll use the information</li>
  <li>Making your privacy policies clear and accessible</li>
</ul>

<h3>2. Purpose Limitation</h3>
<p>Personal data must be collected for specified, explicit, and legitimate purposes. You cannot collect data "just in case" you might need it later. For example, if you collect email addresses for newsletters, you cannot later use them for marketing campaigns without explicit consent.</p>

<h3>3. Data Minimization</h3>
<p>Only collect data that is adequate, relevant, and limited to what is necessary. Many businesses make the mistake of requesting excessive information. Ask yourself: "Do I really need the customer's date of birth to deliver this service?"</p>

<h3>4. Accuracy</h3>
<p>You must take reasonable steps to ensure personal data is accurate and kept up to date. Implement systems that allow customers to update their information easily.</p>

<h3>5. Storage Limitation</h3>
<p>Don't keep personal data longer than necessary. Establish clear data retention policies. For instance, if you only need transaction data for 7 years for tax purposes, delete it after that period.</p>

<h3>6. Integrity and Confidentiality</h3>
<p>Implement appropriate security measures to protect data against unauthorized access, loss, or damage. This includes both technical measures (encryption, firewalls) and organizational measures (staff training, access controls).</p>

<h2>Who Needs to Register with the Data Commissioner?</h2>

<p>Most businesses processing personal data must register with the Office of the Data Protection Commissioner (ODPC). This includes:</p>

<ul>
  <li>Companies with more than 5 employees</li>
  <li>Organizations processing sensitive personal data</li>
  <li>Businesses engaged in large-scale data processing</li>
  <li>Data processors acting on behalf of others</li>
</ul>

<p><strong>Registration Process:</strong></p>
<ol>
  <li>Visit the ODPC online portal at www.odpc.go.ke</li>
  <li>Complete the registration form detailing your data processing activities</li>
  <li>Pay the registration fee (KES 5,000 - 50,000 depending on business size)</li>
  <li>Maintain annual registration</li>
</ol>

<h2>Consent Requirements</h2>

<p>One of the most misunderstood aspects of the Act is consent. Valid consent must be:</p>

<ul>
  <li><strong>Freely given:</strong> No coercion or bundled conditions</li>
  <li><strong>Specific:</strong> Separate consent for different purposes</li>
  <li><strong>Informed:</strong> Clear explanation of what data is collected and why</li>
  <li><strong>Unambiguous:</strong> Clear affirmative action (pre-ticked boxes don't count)</li>
  <li><strong>Withdrawable:</strong> Easy mechanism to revoke consent</li>
</ul>

<p><strong>Example of Poor Consent:</strong><br>
"By using this website, you agree to our privacy policy." ❌</p>

<p><strong>Example of Good Consent:</strong><br>
"☐ I consent to XYZ Company collecting and processing my email address to send me monthly newsletters. I understand I can unsubscribe at any time." ✅</p>

<h2>Rights of Data Subjects</h2>

<p>Individuals whose data you process have the following rights:</p>

<h3>1. Right to Access</h3>
<p>Data subjects can request copies of their personal data. You must respond within 21 days.</p>

<h3>2. Right to Rectification</h3>
<p>Individuals can request correction of inaccurate data. This must be done within 7 days.</p>

<h3>3. Right to Erasure ("Right to be Forgotten")</h3>
<p>In certain circumstances, individuals can request deletion of their data, such as when:</p>
<ul>
  <li>The data is no longer necessary for its original purpose</li>
  <li>Consent is withdrawn and there's no other legal basis</li>
  <li>The data was unlawfully processed</li>
</ul>

<h3>4. Right to Data Portability</h3>
<p>Data subjects can request their data in a structured, commonly used format to transfer to another controller.</p>

<h3>5. Right to Object</h3>
<p>Individuals can object to data processing based on legitimate interests or for direct marketing.</p>

<h2>Penalties for Non-Compliance</h2>

<p>The Data Protection Act imposes severe penalties for violations:</p>

<table>
  <tr>
    <td><strong>Violation</strong></td>
    <td><strong>Penalty</strong></td>
  </tr>
  <tr>
    <td>Operating without registration</td>
    <td>Fine up to KES 3 million or 1% of annual turnover</td>
  </tr>
  <tr>
    <td>Unauthorized disclosure of personal data</td>
    <td>Fine up to KES 5 million or imprisonment up to 10 years</td>
  </tr>
  <tr>
    <td>Failure to implement security measures</td>
    <td>Fine up to KES 3 million</td>
  </tr>
  <tr>
    <td>Failure to notify data breach</td>
    <td>Fine up to KES 5 million</td>
  </tr>
</table>

<h2>Practical Compliance Steps</h2>

<p>Based on my experience advising businesses, here's a practical 10-step compliance checklist:</p>

<ol>
  <li><strong>Conduct a Data Audit:</strong> Map all personal data you collect, process, store, and share</li>
  <li><strong>Update Privacy Policy:</strong> Ensure it's clear, comprehensive, and easily accessible</li>
  <li><strong>Review Consent Mechanisms:</strong> Implement proper consent capture and management</li>
  <li><strong>Register with ODPC:</strong> Complete registration if required</li>
  <li><strong>Appoint a Data Protection Officer:</strong> Larger organizations must appoint a DPO</li>
  <li><strong>Implement Security Measures:</strong> Both technical (encryption, access controls) and organizational</li>
  <li><strong>Create Data Subject Request Procedures:</strong> Establish processes to handle access, deletion, and correction requests</li>
  <li><strong>Review Third-Party Contracts:</strong> Ensure vendors comply with data protection standards</li>
  <li><strong>Establish Data Breach Response Plan:</strong> Know how to identify, contain, and report breaches</li>
  <li><strong>Train Staff:</strong> Regular training on data protection principles and procedures</li>
</ol>

<h2>Special Considerations for Different Sectors</h2>

<h3>E-Commerce and Online Businesses</h3>
<ul>
  <li>Cookie consent banners must be compliant</li>
  <li>Clear information about payment data processing</li>
  <li>Transparent data sharing with delivery partners</li>
</ul>

<h3>Healthcare Providers</h3>
<ul>
  <li>Patient data is "sensitive personal data" requiring extra protection</li>
  <li>Strict access controls and audit trails</li>
  <li>Special consent requirements for research</li>
</ul>

<h3>Financial Institutions</h3>
<ul>
  <li>Balance data protection with KYC/AML requirements</li>
  <li>Secure processing of financial data</li>
  <li>Clear communication about credit reference checks</li>
</ul>

<h3>Educational Institutions</h3>
<ul>
  <li>Student data is sensitive, especially for minors</li>
  <li>Parental consent for children under 18</li>
  <li>Clear policies on alumni data</li>
</ul>

<h2>Data Breach Management</h2>

<p>When a data breach occurs, you have specific obligations:</p>

<h3>Notification to ODPC</h3>
<p>Report to the Data Commissioner within 72 hours of becoming aware of a breach that poses a risk to individuals.</p>

<h3>Notification to Data Subjects</h3>
<p>Inform affected individuals without undue delay if the breach poses a high risk to their rights and freedoms.</p>

<h3>Breach Response Steps:</h3>
<ol>
  <li>Contain the breach immediately</li>
  <li>Assess the scope and impact</li>
  <li>Document everything</li>
  <li>Notify ODPC and affected individuals</li>
  <li>Implement corrective measures</li>
  <li>Review and update security procedures</li>
</ol>

<h2>International Data Transfers</h2>

<p>If you transfer personal data outside Kenya, you must ensure adequate protection:</p>

<ul>
  <li>Transfer to countries with adequate data protection (EU countries, for example)</li>
  <li>Use Standard Contractual Clauses for other countries</li>
  <li>Obtain explicit consent from data subjects</li>
  <li>Ensure the recipient implements appropriate safeguards</li>
</ul>

<h2>Common Mistakes to Avoid</h2>

<p>From my practice, these are the most frequent compliance errors I see:</p>

<ol>
  <li><strong>Assuming you're too small to comply:</strong> The Act applies to businesses of all sizes</li>
  <li><strong>Using pre-ticked consent boxes:</strong> Consent must be an active choice</li>
  <li><strong>Not updating privacy policies:</strong> Keep policies current with your practices</li>
  <li><strong>Ignoring data subject requests:</strong> You have legal deadlines to respond</li>
  <li><strong>No staff training:</strong> Employees must understand their role in data protection</li>
  <li><strong>Weak passwords and security:</strong> Basic security hygiene is essential</li>
  <li><strong>Keeping data forever:</strong> Implement retention and deletion policies</li>
  <li><strong>Not having a data breach plan:</strong> Hope is not a strategy</li>
</ol>

<h2>Conclusion</h2>

<p>Data protection compliance is not just about avoiding penalties—it's about building trust with your customers and stakeholders. In my experience, businesses that embrace data protection principles gain competitive advantages through enhanced reputation and customer loyalty.</p>

<p>The investment in compliance pays dividends through reduced risk, improved data management, and stronger customer relationships. Don't view data protection as a burden; see it as an opportunity to demonstrate your commitment to privacy and security.</p>

<p><strong>Need Help with Compliance?</strong></p>
<p>At Wakili Pro, I specialize in helping businesses navigate data protection requirements. Whether you need a privacy policy review, data audit, or ongoing compliance support, I can guide you through the process.</p>

<p><em>For personalized advice on your specific data protection needs, book a consultation through my profile.</em></p>

<hr>

<p><strong>About the Author:</strong> Lucy Wanjiku is a corporate law specialist with extensive experience in data protection compliance, helping over 200 Kenyan businesses meet their regulatory obligations under the Data Protection Act.</p>
    `,
    isPremium: false,
    isPublished: true
  },
  {
    id: 'art-employment-law-2025',
    authorEmail: 'james@wakilipro.com', // James Mwangi - Employment Law expert
    title: 'Employment Contracts in Kenya: Essential Clauses Every Employer Must Include',
    category: 'Employment Law',
    content: `
<!--METADATA:{"category":"Employment Law","tags":["Employment Contract","Labour Law","HR","Termination","Benefits"],"aiSummary":"Protect your business and employees with comprehensive employment contracts. Learn about statutory requirements under the Employment Act, probation periods, termination clauses, non-compete agreements, and common pitfalls to avoid.","qualityScore":92,"source":"lawyer","readTime":"10 min read"}-->

<h2>Introduction</h2>

<p>An employment contract is more than just a formality—it's the foundation of the employer-employee relationship. As an employment law practitioner who has handled countless labor disputes, I can tell you that most employment conflicts stem from poorly drafted or incomplete contracts.</p>

<p>This guide will help you create robust employment contracts that protect both parties and comply with Kenyan labor laws.</p>

<h2>Legal Framework</h2>

<p>Employment contracts in Kenya are governed by:</p>
<ul>
  <li>The Employment Act, 2007</li>
  <li>The Labour Relations Act, 2007</li>
  <li>The Labour Institutions Act, 2007</li>
  <li>Relevant Collective Bargaining Agreements (where applicable)</li>
</ul>

<h2>Statutory Requirements</h2>

<p>Under Section 10 of the Employment Act, every contract of service must be in writing and include:</p>

<h3>1. Particulars of Employment</h3>
<p>The contract must specify:</p>
<ul>
  <li>Names and addresses of both employer and employee</li>
  <li>Job title and description of duties</li>
  <li>Date of commencement of employment</li>
  <li>Form and duration of the contract (permanent, fixed-term, casual)</li>
  <li>Place of work or indication that the employee may be required to work at various locations</li>
</ul>

<h3>2. Remuneration Details</h3>
<p>Clearly state:</p>
<ul>
  <li>Basic salary or wage</li>
  <li>Payment frequency (monthly, weekly, etc.)</li>
  <li>Any allowances (housing, transport, medical, etc.)</li>
  <li>Overtime rates if applicable</li>
  <li>Payment method (bank transfer, cash, etc.)</li>
</ul>

<p><strong>Example Clause:</strong><br>
"The Employee shall be paid a gross monthly salary of KES 150,000 (Kenya Shillings One Hundred and Fifty Thousand) comprising: Basic Salary KES 100,000, House Allowance KES 30,000, Transport Allowance KES 20,000. Payment shall be made by the 5th day of each month via bank transfer to the Employee's designated account."</p>

<h3>3. Working Hours and Overtime</h3>
<p>The Employment Act provides that:</p>
<ul>
  <li>Normal working hours should not exceed 52 hours per week</li>
  <li>Daily working hours should not exceed 12 hours</li>
  <li>Overtime must be paid at 1.5 times the normal hourly rate</li>
  <li>Work on public holidays must be paid at 2 times the normal rate</li>
</ul>

<p><strong>Example Clause:</strong><br>
"Normal working hours are Monday to Friday, 8:00 AM to 5:00 PM, with a one-hour lunch break. The Employee may be required to work reasonable overtime, which will be compensated at 150% of the normal hourly rate."</p>

<h3>4. Leave Entitlements</h3>

<p>The Employment Act mandates minimum leave entitlements:</p>

<h4>Annual Leave</h4>
<ul>
  <li>Minimum 21 working days per year after 12 months of continuous service</li>
  <li>Leave should be taken within the year but can be carried forward with employer consent</li>
  <li>Leave pay must be paid in advance</li>
</ul>

<h4>Sick Leave</h4>
<ul>
  <li>With certificate: 7 days at full pay, 7 days at half pay per year</li>
  <li>Without certificate: Maximum 7 days per year</li>
</ul>

<h4>Maternity Leave</h4>
<ul>
  <li>3 months maternity leave</li>
  <li>Mother can choose when to start (before or after delivery)</li>
  <li>Employer is not required to pay during maternity leave but must allow the employee to return to work</li>
</ul>

<h4>Paternity Leave</h4>
<ul>
  <li>2 weeks upon the birth of a child</li>
</ul>

<p><strong>Example Clause:</strong><br>
"The Employee is entitled to 21 working days of paid annual leave per year. Sick leave shall be granted in accordance with the Employment Act. Female employees are entitled to 3 months' maternity leave, and male employees to 2 weeks' paternity leave."</p>

<h2>Probation Period</h2>

<p>Most employers include a probation period to assess suitability:</p>

<ul>
  <li>Maximum 6 months for most positions</li>
  <li>Maximum 12 months for specialized positions requiring unique skills</li>
  <li>During probation, either party can terminate with 7 days' notice (or salary in lieu)</li>
  <li>Performance evaluations should be conducted during and at the end of probation</li>
</ul>

<p><strong>Example Clause:</strong><br>
"The first six (6) months of employment shall be a probationary period. During this period, the Employer will assess the Employee's performance, conduct, and suitability. Either party may terminate this employment with seven (7) days' written notice or payment in lieu of notice. Performance reviews will be conducted at months 3 and 6."</p>

<h2>Termination Provisions</h2>

<p>Clear termination clauses prevent disputes:</p>

<h3>Notice Periods</h3>
<p>Minimum notice periods under the Employment Act:</p>
<table>
  <tr>
    <td><strong>Length of Service</strong></td>
    <td><strong>Notice Period</strong></td>
  </tr>
  <tr>
    <td>Less than 1 year</td>
    <td>1 month or 28 days</td>
  </tr>
  <tr>
    <td>1-5 years</td>
    <td>1 month or 28 days</td>
  </tr>
  <tr>
    <td>5-10 years</td>
    <td>1 month or 28 days</td>
  </tr>
  <tr>
    <td>Over 10 years</td>
    <td>1 month or 28 days</td>
  </tr>
</table>

<p>Contracts can specify longer notice periods (common for senior positions: 3 months).</p>

<h3>Summary Dismissal</h3>
<p>Grounds for summary dismissal (termination without notice):</p>
<ul>
  <li>Gross misconduct</li>
  <li>Theft or fraud</li>
  <li>Violence or threat of violence</li>
  <li>Willful disobedience of lawful orders</li>
  <li>Intoxication at work</li>
  <li>Sexual harassment</li>
</ul>

<p><strong>Important:</strong> Even for summary dismissal, fair procedure must be followed (investigation, opportunity to be heard).</p>

<h3>Redundancy</h3>
<p>If termination is due to redundancy:</p>
<ul>
  <li>Minimum one month's notice required</li>
  <li>Severance pay: 15 days' pay for each completed year of service</li>
  <li>Fair selection criteria must be used</li>
</ul>

<p><strong>Example Clause:</strong><br>
"Either party may terminate this employment upon giving one (1) month's written notice or payment of one month's salary in lieu of notice. The Employer may terminate employment immediately without notice in cases of gross misconduct following fair investigation and hearing procedures."</p>

<h2>Confidentiality and Non-Disclosure</h2>

<p>Protect your business information:</p>

<p><strong>Example Clause:</strong><br>
"The Employee shall not, during or after employment, disclose to any person or use for their own benefit any confidential information belonging to the Company, including but not limited to: client lists, business strategies, financial information, trade secrets, proprietary processes, and any information marked as confidential. This obligation survives termination of employment."</p>

<h2>Intellectual Property Rights</h2>

<p>Clarify ownership of work created during employment:</p>

<p><strong>Example Clause:</strong><br>
"All work products, inventions, designs, software, writings, or other intellectual property created by the Employee in the course of employment shall belong exclusively to the Employer. The Employee hereby assigns all rights, title, and interest in such work to the Employer and agrees to execute any documents necessary to perfect the Employer's ownership."</p>

<h2>Non-Compete and Non-Solicitation Clauses</h2>

<p>While enforceable in Kenya, these clauses must be reasonable:</p>

<h3>Key Principles:</h3>
<ul>
  <li><strong>Reasonable Duration:</strong> 6-12 months is generally acceptable; longer periods may be unenforceable</li>
  <li><strong>Reasonable Scope:</strong> Must be limited to specific geographic area and industry</li>
  <li><strong>Legitimate Interest:</strong> Must protect genuine business interests (client relationships, trade secrets)</li>
  <li><strong>Not Overly Broad:</strong> Cannot prevent employee from earning a livelihood</li>
</ul>

<p><strong>Example Non-Compete Clause:</strong><br>
"For a period of six (6) months following termination of employment, the Employee shall not directly or indirectly engage in any business that competes with the Employer's business within Nairobi County. This restriction applies only to services similar to those the Employee performed for the Employer."</p>

<p><strong>Example Non-Solicitation Clause:</strong><br>
"For twelve (12) months following termination, the Employee shall not solicit or attempt to solicit any client with whom the Employee had direct contact during the last two (2) years of employment, nor shall the Employee solicit any employee of the Company to leave their employment."</p>

<h2>Disciplinary Procedures</h2>

<p>Include reference to disciplinary procedures:</p>

<p><strong>Example Clause:</strong><br>
"The Employee shall be subject to the Company's disciplinary procedures as set out in the Employee Handbook. These procedures comply with principles of natural justice and include the right to be informed of allegations, the right to be heard, and the right to appeal."</p>

<h2>Benefits and Statutory Deductions</h2>

<h3>Required Benefits:</h3>
<ul>
  <li><strong>NSSF:</strong> Employer and employee contributions (currently KES 200 each, but new rates pending)</li>
  <li><strong>NHIF:</strong> Employee contribution based on salary bracket (KES 150 - 1,700)</li>
  <li><strong>PAYE:</strong> Tax deductions based on KRA bands</li>
  <li><strong>Housing Levy:</strong> 1.5% of gross salary (both employer and employee)</li>
</ul>

<h3>Optional Benefits:</h3>
<ul>
  <li>Medical insurance beyond NHIF</li>
  <li>Pension/provident fund</li>
  <li>Life insurance</li>
  <li>Professional development</li>
  <li>Performance bonuses</li>
</ul>

<p><strong>Example Clause:</strong><br>
"The Employer shall register the Employee for NSSF, NHIF, and PAYE and make statutory deductions as required by law. Additionally, the Employer provides comprehensive medical insurance covering the Employee and immediate family (spouse and up to 4 children under 25 years)."</p>

<h2>Common Mistakes to Avoid</h2>

<ol>
  <li><strong>Verbal Agreements:</strong> Always have written contracts, even for casual workers</li>
  <li><strong>Vague Job Descriptions:</strong> Be specific about duties and responsibilities</li>
  <li><strong>No Probation Clause:</strong> Miss opportunity to assess suitability</li>
  <li><strong>Unclear Termination Terms:</strong> Leads to expensive disputes</li>
  <li><strong>Overly Restrictive Non-Competes:</strong> May be unenforceable and create animosity</li>
  <li><strong>No Amendment Clause:</strong> Include provision for mutual written amendments</li>
  <li><strong>Ignoring Collective Agreements:</strong> If your industry has a CBA, comply with it</li>
  <li><strong>No Dispute Resolution Clause:</strong> Specify arbitration or mediation before court</li>
</ol>

<h2>Special Considerations</h2>

<h3>Fixed-Term Contracts</h3>
<ul>
  <li>Must specify exact end date or completion of specific project</li>
  <li>Can be renewed, but multiple renewals may create permanent employment</li>
  <li>Termination before end date requires notice and may trigger compensation</li>
</ul>

<h3>Part-Time and Casual Workers</h3>
<ul>
  <li>Entitled to pro-rata benefits based on hours worked</li>
  <li>Must have written contracts</li>
  <li>Still protected under Employment Act</li>
</ul>

<h3>Remote/Hybrid Work</h3>
<ul>
  <li>Specify work location arrangement clearly</li>
  <li>Define working hours and availability requirements</li>
  <li>Address equipment provision and maintenance</li>
  <li>Clarify data security and confidentiality for remote access</li>
</ul>

<h2>Contract Review Checklist</h2>

<p>Before finalizing any employment contract, verify:</p>

<ol>
  <li>✓ All statutory particulars included</li>
  <li>✓ Clear job description and reporting structure</li>
  <li>✓ Accurate salary and benefits details</li>
  <li>✓ Proper notice periods</li>
  <li>✓ Leave entitlements comply with minimum requirements</li>
  <li>✓ Confidentiality and IP clauses present</li>
  <li>✓ Non-compete clauses are reasonable</li>
  <li>✓ Disciplinary procedures referenced</li>
  <li>✓ Amendment clause included</li>
  <li>✓ Dispute resolution mechanism specified</li>
  <li>✓ Governing law clause (Kenyan law)</li>
  <li>✓ Signature blocks for both parties</li>
</ol>

<h2>Conclusion</h2>

<p>A well-drafted employment contract is your first line of defense against labor disputes. It sets clear expectations, protects both parties' interests, and provides a framework for a productive working relationship.</p>

<p>While templates can be helpful starting points, every employment relationship has unique aspects. I strongly recommend having employment contracts reviewed by a qualified employment lawyer to ensure full compliance and protection of your interests.</p>

<p><strong>Need Employment Contract Review or Drafting?</strong></p>
<p>I specialize in employment law and have helped hundreds of businesses create compliant, fair employment contracts that protect their interests while respecting employee rights.</p>

<p><em>Book a consultation through my profile for personalized employment law advice.</em></p>

<hr>

<p><strong>About the Author:</strong> James Mwangi is an employment law specialist practicing in Nairobi, with extensive experience in labor relations, contract drafting, and employment dispute resolution.</p>
    `,
    isPremium: false,
    isPublished: true
  },
  {
    id: 'art-land-purchase-2025',
    authorEmail: 'grace@wakilipro.com', // Grace Njeri - Property Law expert  
    title: 'Land Ownership Rights in Kenya: What Every Property Buyer Should Know',
    category: 'Property Law',
    content: `
<!--METADATA:{"category":"Property Law","tags":["Land Purchase","Title Deed","Property Rights","Conveyancing","Real Estate"],"aiSummary":"Avoid costly mistakes when purchasing land in Kenya. This comprehensive guide covers title searches, land control board consent, encumbrances, and the complete conveyancing process from offer to registration.","qualityScore":94,"source":"lawyer","readTime":"15 min read"}-->

<h2>Introduction</h2>

<p>Buying land or property is likely the biggest investment most Kenyans will ever make. As a property lawyer who has facilitated over 500 land transactions and helped clients recover from purchasing mistakes, I cannot overemphasize the importance of due diligence.</p>

<p>This comprehensive guide will walk you through everything you need to know about land ownership rights in Kenya, from understanding title documents to completing the registration process.</p>

<h2>Types of Land Tenure in Kenya</h2>

<p>Kenya's land laws recognize three main categories of land tenure:</p>

<h3>1. Freehold Title</h3>
<p>The strongest form of land ownership in Kenya:</p>
<ul>
  <li>Absolute ownership for an unlimited period</li>
  <li>Full rights to use, occupy, and dispose of the property</li>
  <li>Can be inherited, sold, or leased</li>
  <li>Most common in former "White Highlands" areas</li>
</ul>

<h3>2. Leasehold Title</h3>
<p>Ownership for a specific period (typically 99 or 999 years):</p>
<ul>
  <li>Land is held from the government or a freeholder</li>
  <li>Must comply with any conditions in the lease</li>
  <li>Can be extended upon expiry (renewal not automatic)</li>
  <li>Most urban land is leasehold</li>
  <li>Ground rent may be payable annually</li>
</ul>

<h3>3. Community Land</h3>
<p>Held by communities based on customary rights:</p>
<ul>
  <li>Vested in communities identified by ethnicity, culture, or similar interests</li>
  <li>Managed by community land boards</li>
  <li>Can be converted to individual titles through adjudication</li>
</ul>

<h2>Understanding Title Documents</h2>

<p>Title deeds are the primary evidence of land ownership. Modern Kenya has transitioned to digital land records, but understanding the different types is crucial:</p>

<h3>Types of Title Deeds</h3>

<h4>1. Certificate of Title (Old Registry System)</h4>
<p>Still valid but being phased out:</p>
<ul>
  <li>Green card with details of ownership, size, and location</li>
  <li>Entries made manually in the Registry</li>
  <li>Can still be transacted but will be converted to digital eventually</li>
</ul>

<h4>2. Title Deed (New Land Registration Act System)</h4>
<p>Modern digital system:</p>
<ul>
  <li>White A4 paper with security features</li>
  <li>Unique title number in format: NAIROBI/BLOCK/123</li>
  <li>Contains: Owner details, size, encumbrances, restrictions</li>
  <li>All new transactions issued under this system</li>
</ul>

<h4>3. Letter of Allotment</h4>
<p>Interim document:</p>
<ul>
  <li>Issued when land has been allocated but title not yet processed</li>
  <li>Shows intention to grant title</li>
  <li>Not full ownership - cannot be used for mortgages</li>
  <li>Should eventually be converted to title deed</li>
</ul>

<p><strong>Warning:</strong> Never buy land based only on a letter of allotment without verification from the Land Registry!</p>

<h2>The Land Purchase Process: Step-by-Step</h2>

<h3>Step 1: Property Identification and Viewing</h3>
<p>Before making any offers:</p>
<ul>
  <li>Physically visit the land (multiple times, different times of day)</li>
  <li>Check access roads and infrastructure</li>
  <li>Talk to neighbors about the area</li>
  <li>Verify the boundaries match the seller's description</li>
  <li>Check for any visible encroachments or disputes</li>
</ul>

<h3>Step 2: Official Search (Most Critical Step!)</h3>

<p>An official search reveals the true legal position of the property. You must obtain:</p>

<h4>a) Official Search at the Land Registry</h4>
<p>This will show:</p>
<ul>
  <li>Current registered owner</li>
  <li>Size and exact location</li>
  <li>Any encumbrances (mortgages, caveats, cautions)</li>
  <li>Restrictions on use (e.g., agricultural land only)</li>
  <li>History of ownership</li>
</ul>

<p><strong>How to Conduct an Official Search:</strong></p>
<ol>
  <li>Visit the relevant Land Registry or use Ardhi Sasa online portal</li>
  <li>Provide the title number or plot number</li>
  <li>Pay search fee (approximately KES 520)</li>
  <li>Receive official search certificate (valid for 3 months)</li>
</ol>

<p><strong>Red Flags in Search Results:</strong></p>
<ul>
  <li>Name on title doesn't match seller's ID</li>
  <li>Existing mortgage or charge</li>
  <li>Caveat preventing transfer</li>
  <li>Caution warning of dispute</li>
  <li>Size doesn't match what was advertised</li>
  <li>Restrictive covenants limiting use</li>
</ul>

<h4>b) Land Rates Clearance Certificate</h4>
<ul>
  <li>Confirms all property taxes are paid to date</li>
  <li>Obtained from County Government</li>
  <li>Must be current (within 3 months)</li>
  <li>Seller should provide this</li>
</ul>

<h4>c) Land Control Board Consent</h4>
<p>Required for agricultural land transactions:</p>
<ul>
  <li>Board must approve the transaction</li>
  <li>Ensures land remains productive</li>
  <li>Prevents subdivision below minimum acreage</li>
  <li>Application fee varies by location</li>
  <li>Processing takes 60 days (can be extended)</li>
</ul>

<h3>Step 3: Sale Agreement</h3>

<p>Once searches are satisfactory, enter into a written sale agreement:</p>

<p><strong>Essential Clauses:</strong></p>
<ul>
  <li>Full particulars of buyer and seller</li>
  <li>Description of property (title number, size, location)</li>
  <li>Purchase price and payment terms</li>
  <li>Deposit amount (typically 10%)</li>
  <li>Completion date</li>
  <li>Seller's warranties (e.g., no hidden encumbrances)</li>
  <li>Buyer's conditions (e.g., subject to obtaining Land Control Board consent)</li>
  <li>Default provisions</li>
  <li>Who pays what costs (usually buyer pays transfer costs)</li>
</ul>

<p><strong>Deposit Handling:</strong></p>
<p>Deposit should be held by:</p>
<ul>
  <li>A licensed conveyancer in trust account (safest)</li>
  <li>OR agreed escrow agent</li>
  <li>Never pay deposit directly to seller!</li>
</ul>

<h3>Step 4: Land Control Board Application (If Applicable)</h3>

<p>For agricultural land:</p>
<ol>
  <li>File application with Land Control Board</li>
  <li>Submit: Sale agreement, search certificate, rate clearance, IDs, title deed copy</li>
  <li>Pay consent fee (usually 10% of transaction value or land rates, whichever is higher)</li>
  <li>Board may inspect land</li>
  <li>Consent granted if no objections</li>
  <li>Consent is valid for 2 years</li>
</ol>

<p><strong>Important:</strong> Transaction cannot proceed without Land Control Board consent where required!</p>

<h3>Step 5: Transfer Documents Preparation</h3>

<p>Your lawyer will prepare:</p>

<h4>Transfer Form (Form RL 4)</h4>
<ul>
  <li>Legal document transferring ownership</li>
  <li>Signed by both parties</li>
  <li>Contains property description, price, consideration</li>
  <li>Must be stamped at KRA</li>
</ul>

<h4>Consent to Transfer (if mortgaged)</h4>
<ul>
  <li>If property has mortgage, bank must consent</li>
  <li>Usually requires mortgage redemption</li>
</ul>

<h3>Step 6: Stamp Duty Payment</h3>

<p>Transfer documents must be stamped by Kenya Revenue Authority (KRA):</p>

<table>
  <tr>
    <td><strong>Transaction Type</strong></td>
    <td><strong>Stamp Duty Rate</strong></td>
  </tr>
  <tr>
    <td>Sale of property</td>
    <td>4% of value or KRA valuation (whichever is higher)</td>
  </tr>
  <tr>
    <td>Transfer between family members (gift)</td>
    <td>2% of value</td>
  </tr>
  <tr>
    <td>Lease exceeding 1 year</td>
    <td>2% of total rent</td>
  </tr>
</table>

<p><strong>Additional Costs:</strong></p>
<ul>
  <li>KRA valuation fee: 0.1% of property value (minimum KES 5,000)</li>
  <li>Stamping fee: KES 1,000</li>
</ul>

<p><strong>Process:</strong></p>
<ol>
  <li>Submit transfer documents to KRA for valuation</li>
  <li>Pay valuation fee</li>
  <li>KRA issues valuation report (3-5 working days)</li>
  <li>Pay stamp duty based on valuation</li>
  <li>Documents stamped and returned</li>
</ol>

<h3>Step 7: Registration at Land Registry</h3>

<p>Final step to become legal owner:</p>

<ol>
  <li>Lodge stamped transfer documents at Land Registry</li>
  <li>Pay registration fees:
    <ul>
      <li>Registration fee: 1% of value</li>
      <li>Processing fee: KES 1,000</li>
      <li>Search fee: KES 520</li>
    </ul>
  </li>
  <li>Registry processes transfer (7-21 days)</li>
  <li>New title deed issued in buyer's name</li>
  <li>Collect title deed from Registry</li>
</ol>

<h2>Understanding Encumbrances</h2>

<p>Encumbrances are restrictions on the property. Common types:</p>

<h3>1. Mortgage/Charge</h3>
<ul>
  <li>Property used as security for a loan</li>
  <li>Must be cleared before transfer OR assumed by buyer</li>
  <li>Lender's consent required for transfer</li>
</ul>

<h3>2. Caveat</h3>
<ul>
  <li>Warning that someone claims interest in the property</li>
  <li>Prevents registration of any dealings</li>
  <li>Must be removed before transaction</li>
  <li>Can be challenged in court if frivolous</li>
</ul>

<h3>3. Caution</h3>
<ul>
  <li>Warning of pending litigation or dispute</li>
  <li>Similar effect to caveat</li>
  <li>Requires court order to remove</li>
</ul>

<h3>4. Restrictive Covenants</h3>
<ul>
  <li>Conditions limiting property use</li>
  <li>Examples: "For residential use only," "No subdivision below 1 acre"</li>
  <li>Breach can lead to legal action</li>
</ul>

<h3>5. Easements</h3>
<ul>
  <li>Right of others to use part of property</li>
  <li>Examples: Right of way, water pipe access</li>
  <li>Continues even after change of ownership</li>
</ul>

<h2>Common Land Scams to Avoid</h2>

<p>Be aware of these prevalent scams:</p>

<h3>1. Double Allocation/Sale</h3>
<ul>
  <li>Same land sold to multiple buyers</li>
  <li>Fraudsters use fake title deeds</li>
  <li><strong>Protection:</strong> Always conduct official search, never rely on photocopies</li>
</ul>

<h3>2. Forged Documents</h3>
<ul>
  <li>Fake title deeds and transfer documents</li>
  <li><strong>Protection:</strong> Verify all documents at Land Registry</li>
</ul>

<h3>3. Impersonation</h3>
<ul>
  <li>Fraudster pretends to be owner</li>
  <li><strong>Protection:</strong> Verify seller's ID matches title deed, meet at Registry</li>
</ul>

<h3>4. Selling Public/Community Land</h3>
<ul>
  <li>Fraudsters sell road reserves, riparian land, public utilities land</li>
  <li><strong>Protection:</strong> Physical inspection, check approved survey plans</li>
</ul>

<h3>5. Land Buying Companies</h3>
<ul>
  <li>Some companies sell non-existent plots or plots they don't own</li>
  <li><strong>Protection:</strong> Verify company is legitimate, search each plot individually</li>
</ul>

<h2>Due Diligence Checklist</h2>

<p>Before completing any land purchase:</p>

<ol>
  <li>✓ Conducted official search at Land Registry</li>
  <li>✓ Verified seller's identity matches title deed</li>
  <li>✓ Physically inspected property</li>
  <li>✓ Checked boundaries match title deed</li>
  <li>✓ Obtained land rates clearance certificate</li>
  <li>✓ Obtained Land Control Board consent (if applicable)</li>
  <li>✓ Verified no encumbrances or resolved existing ones</li>
  <li>✓ Confirmed property is not public land</li>
  <li>✓ Checked approved survey plan and beacons</li>
  <li>✓ Reviewed restrictive covenants</li>
  <li>✓ Engaged qualified lawyer/conveyancer</li>
  <li>✓ Signed written sale agreement</li>
</ol>

<h2>Cost Summary for Land Purchase</h2>

<p>Budget for these costs (on a KES 5 million property):</p>

<table>
  <tr>
    <td><strong>Cost Item</strong></td>
    <td><strong>Amount (KES)</strong></td>
  </tr>
  <tr>
    <td>Purchase Price</td>
    <td>5,000,000</td>
  </tr>
  <tr>
    <td>Stamp Duty (4%)</td>
    <td>200,000</td>
  </tr>
  <tr>
    <td>KRA Valuation (0.1%)</td>
    <td>5,000</td>
  </tr>
  <tr>
    <td>Registration Fee (1%)</td>
    <td>50,000</td>
  </tr>
  <tr>
    <td>Land Control Board Consent</td>
    <td>~50,000</td>
  </tr>
  <tr>
    <td>Legal Fees</td>
    <td>100,000 - 150,000</td>
  </tr>
  <tr>
    <td>Search Fees</td>
    <td>2,000</td>
  </tr>
  <tr>
    <td><strong>Total Additional Costs</strong></td>
    <td><strong>~407,000 - 457,000</strong></td>
  </tr>
  <tr>
    <td><strong>Total Investment</strong></td>
    <td><strong>~5,407,000 - 5,457,000</strong></td>
  </tr>
</table>

<p><strong>Key Takeaway:</strong> Budget approximately 8-10% above purchase price for transaction costs!</p>

<h2>Post-Purchase Responsibilities</h2>

<p>After registration, you must:</p>

<ol>
  <li><strong>Pay Land Rates:</strong>
    <ul>
      <li>Annual tax to County Government</li>
      <li>Varies by location and size</li>
      <li>Failure to pay can lead to auction</li>
    </ul>
  </li>
  <li><strong>Pay Ground Rent (for leasehold):</strong>
    <ul>
      <li>Annual rent to the government</li>
      <li>Usually nominal amount</li>
      <li>Non-payment can lead to forfeiture</li>
    </ul>
  </li>
  <li><strong>Maintain Property:</strong>
    <ul>
      <li>Comply with any restrictive covenants</li>
      <li>Prevent encroachment</li>
      <li>Follow environmental regulations</li>
    </ul>
  </li>
  <li><strong>Update Address with Land Registry:</strong>
    <ul>
      <li>Ensure you receive important notices</li>
    </ul>
  </li>
</ol>

<h2>Special Considerations</h2>

<h3>Buying Land with Spouse</h3>
<ul>
  <li>Both spouses' consent required (Matrimonial Property Act)</li>
  <li>Can register as joint tenants (right of survivorship) or tenants in common</li>
  <li>Both must sign all transfer documents</li>
</ul>

<h3>Buying Through Power of Attorney</h3>
<ul>
  <li>Ensure power of attorney is registered</li>
  <li>Verify principal's identity and consent</li>
  <li>Check power of attorney hasn't been revoked</li>
  <li><strong>High fraud risk!</strong> Extra caution needed</li>
</ul>

<h3>Buying Off-Plan (Developers)</h3>
<ul>
  <li>Verify developer has title to mother parcel</li>
  <li>Check subdivision approval</li>
  <li>Review development agreement carefully</li>
  <li>Ensure payments go to developer's project account</li>
  <li>Get completion timeline in writing</li>
</ul>

<h2>Dispute Resolution</h2>

<p>If land disputes arise:</p>

<ol>
  <li><strong>Negotiation:</strong> Try to resolve amicably</li>
  <li><strong>Alternative Dispute Resolution:</strong> Mediation or arbitration</li>
  <li><strong>Environment and Land Court:</strong> Specialist court for land matters</li>
</ol>

<p><strong>Prevention is Better:</strong> Proper due diligence prevents most disputes!</p>

<h2>Conclusion</h2>

<p>Purchasing land is a complex process requiring patience, diligence, and professional guidance. While this guide provides comprehensive information, every transaction has unique aspects.</p>

<p>The single most important advice I can give: <strong>Never rush a land transaction.</strong> Take time to conduct thorough searches, verify documents, and engage qualified professionals.</p>

<p>Spending money on proper legal advice upfront can save you millions and years of stress from land fraud or disputes.</p>

<p><strong>Need Help with Property Transaction?</strong></p>
<p>I specialize in property law and conveyancing, having successfully facilitated hundreds of land transactions across Kenya. I can guide you through every step, from search to registration.</p>

<p><em>Book a consultation through my profile for expert property law advice.</em></p>

<hr>

<p><strong>About the Author:</strong> Grace Njeri is a property law specialist with over 10 years of experience in conveyancing, land disputes, and real estate transactions across Kenya.</p>
    `,
    isPremium: false,
    isPublished: true
  }
];

  // Now seed the articles
  for (const article of articles) {
    try {
      // Find the author by email
      const author = await prisma.user.findUnique({
        where: { email: article.authorEmail }
      });

      if (!author) {
        console.log(`⚠️  Author with email ${article.authorEmail} not found. Skipping article: ${article.title}`);
        continue;
      }

      // Create or update the article
      await prisma.article.upsert({
        where: { id: article.id },
        update: {
          title: article.title,
          content: article.content,
          isPremium: article.isPremium,
          isPublished: article.isPublished
        },
        create: {
          id: article.id,
          authorId: author.id,
          title: article.title,
          content: article.content,
          isPremium: article.isPremium,
          isPublished: article.isPublished
        }
      });

      console.log(`✅ Seeded article: ${article.title} by ${author.firstName} ${author.lastName}`);
    } catch (error) {
      console.error(`❌ Error seeding article ${article.title}:`, error);
    }
  }

  console.log('✨ Article seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
