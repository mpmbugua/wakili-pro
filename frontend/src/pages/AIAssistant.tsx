import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'document';
    name: string;
    url: string;
    size?: number;
  }>;
  recommendations?: {
    type: 'lawyer' | 'document';
    title: string;
    description: string;
    price?: string;
    cta: string;
  }[];
  sources?: Array<{
    title: string;
    citation?: string;
    section?: string;
    score: number;
  }>;
}

export const AIAssistant: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Sample AI responses with recommendations (will be replaced with real AI backend)
  const getSampleResponse = (userQuery: string): Message => {
    const query = userQuery.toLowerCase();
    
    // Car/Vehicle Purchase & Transfer
    if (query.includes('car') || query.includes('vehicle') || query.includes('motor') || query.includes('logbook')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🚗 **Vehicle Purchase & Transfer - Kenya**\n\n**STEP-BY-STEP PROCESS:**\n\n**1. Pre-Purchase Verification:**\n• NTSA Search - Verify ownership, encumbrances, accident history\n• Check CRB status if buying on credit\n• Physical inspection (engage AA Kenya or similar)\n\n**2. Legal Documentation Required:**\n• Original Logbook (Certificate of Registration)\n• Seller\'s ID & KRA PIN\n• Sale Agreement (download template or consult lawyer)\n• Motor Vehicle Transfer Form CR12 (from NTSA)\n\n**3. Transfer Process (Traffic Act Cap 403):**\n• Complete CR12 form (both parties sign)\n• Pay transfer fee at NTSA (KES 1,000 for private vehicles)\n• Submit: CR12, logbook, IDs, KRA PINs\n• Processing: 7-14 working days\n• New logbook issued in your name\n\n**4. Costs & Taxes:**\n• Transfer Fee: KES 1,000\n• Stamp Duty: 0.1% of vehicle value (Finance Act)\n• Number plate change (optional): KES 3,000\n• Legal fees (if using lawyer): KES 5,000-15,000\n\n**5. Insurance (Motor Vehicle Insurance Act):**\nCompulsory comprehensive insurance before registration\n\n**⚠️ Red Flags:**\n• No original logbook (potential fraud)\n• Outstanding hire purchase (check with financier)\n• Imported vehicle without duty payment\n\nGet legal assistance:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Vehicle Transfer Lawyer',
            description: 'NTSA procedures, due diligence, and transfer documentation',
            price: 'KES 8,000',
            cta: 'Book Consultation'
          },
          {
            type: 'document',
            title: 'Car Sale Agreement Template',
            description: 'Legally binding template + NTSA transfer checklist',
            price: 'KES 600',
            cta: 'Download Template'
          }
        ]
      };
    }

    // Business Registration & Company Formation
    if (query.includes('business') || query.includes('company') || query.includes('register') || query.includes('startup') || query.includes('llc') || query.includes('limited')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🏢 **Business Registration in Kenya**\n\n**BUSINESS STRUCTURES:**\n\n**1. Sole Proprietorship (Business Name)**\n• Register with BRS (Business Registration Service)\n• Cost: KES 11,050\n• Turnaround: 1-3 days\n• Liability: Unlimited (personal assets at risk)\n\n**2. Limited Liability Company (Ltd)**\n• Companies Act, 2015\n• Minimum 1 director + 1 shareholder\n• Cost: KES 10,100 (CR12 + registration)\n• Turnaround: 7-14 days\n• Liability: Limited to share capital\n\n**3. Limited Liability Partnership (LLP)**\n• Best for professional services\n• Minimum 2 partners\n• Cost: KES 20,000+\n\n**REGISTRATION STEPS (eCitizen):**\n\n**Step 1:** Name Reservation (KES 100)\n• Search availability at BRS\n• Reserve for 30 days\n\n**Step 2:** Prepare Documents\n• CR1 (Particulars of Directors)\n• CR8 (Registered Office)\n• Memorandum & Articles of Association\n• ID copies of directors/shareholders\n\n**Step 3:** Submit via eCitizen\n• Pay filing fees\n• Upload scanned documents\n• Certificate of Incorporation issued\n\n**Step 4:** Post-Registration Compliance\n• KRA PIN (iTax portal - same day)\n• VAT Registration if turnover >KES 5M (VAT Act)\n• NSSF & NHIF registration for employees\n• County trade license (varies by county)\n\n**Tax Obligations (Income Tax Act):**\n• Corporate tax: 30% on profits\n• WHT: 5% on professional fees\n• Monthly returns via iTax\n\n**📌 Important:**\nSection 15, Companies Act requires annual returns filing (CR12) - penalty KES 20,000 if late.\n\nGet expert help:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Corporate Lawyer',
            description: 'Company registration, compliance, and contracts specialist',
            price: 'KES 15,000',
            cta: 'Book Session'
          },
          {
            type: 'document',
            title: 'Business Startup Legal Pack',
            description: 'Memorandum, Articles, contracts, and compliance checklist',
            price: 'KES 2,500',
            cta: 'Purchase Pack'
          }
        ]
      };
    }

    // Debt, Loans & Recovery
    if (query.includes('debt') || query.includes('loan') || query.includes('owe') || query.includes('borrow') || query.includes('repay') || query.includes('default')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '💰 **Debt & Loan Recovery - Kenya**\n\n**YOUR RIGHTS & OPTIONS:**\n\n**If You Borrowed Money:**\n\n**Legal Framework:**\n• Banking Act (for banks/SACCOs)\n• Central Bank Regulations (interest rate capping)\n• Consumer Protection Act, 2012\n• Microfinance Act (for MFIs)\n\n**Your Rights:**\n1. Interest Rate Cap: Maximum 4% above CBR (Section 33B, Banking Act)\n2. Fair Debt Collection: No harassment (Consumer Protection Act)\n3. CRB Listing: Must be notified 30 days before listing\n4. Right to Dispute: Challenge incorrect information\n\n**If You Can\'t Pay:**\n• Negotiate payment plan with lender\n• Apply for debt restructuring\n• Seek credit counseling (Kenya Association of Credit Officers)\n• Last resort: Insolvency (Insolvency Act, 2015)\n\n**If You Lent Money:**\n\n**Recovery Steps:**\n1. **Demand Letter**: Give 7-14 days notice\n2. **Small Claims Court**: For debts <KES 1M (fast-track)\n3. **Civil Suit**: File at Magistrate\'s Court\n4. **Attachment Orders**: Garnish salary/bank account\n\n**Evidence Required:**\n• Written loan agreement (crucial!)\n• Bank transfer records (M-Pesa statements)\n• Correspondence (emails, SMS, WhatsApp)\n• Witness statements if oral agreement\n\n**Time Limit (Limitation of Actions Act):**\n• 6 years for contracts\n• 12 years for land-related debts\n\n**Loan Agreement Must Include:**\n• Principal amount\n• Interest rate (not exceeding legal cap)\n• Repayment schedule\n• Default consequences\n• Dispute resolution mechanism\n\nGet legal help to recover or manage debt:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Debt Recovery Lawyer',
            description: 'Demand letters, court filing, and debt recovery specialist',
            price: 'KES 10,000',
            cta: 'Consult Now'
          },
          {
            type: 'document',
            title: 'Loan Agreement Template',
            description: 'Kenya-compliant with interest caps + repayment schedule',
            price: 'KES 800',
            cta: 'Get Template'
          }
        ]
      };
    }

    // Tenancy & Landlord Issues
    if (query.includes('tenant') || query.includes('landlord') || query.includes('rent') || query.includes('evict') || query.includes('deposit') || query.includes('lease')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🏘️ **Tenancy & Landlord-Tenant Law - Kenya**\n\n**TENANT RIGHTS:**\n\n**Legal Protection:**\n• Rent Restriction Act (Cap 296)\n• Landlord and Tenant (Shops, Hotels & Catering) Act\n• Distress for Rent Act\n\n**Your Rights as Tenant:**\n1. **Security Deposit**: Maximum 2 months rent\n2. **Rent Increase**: Requires 3 months written notice\n3. **Repairs**: Landlord must maintain premises (implied warranty)\n4. **Privacy**: 24-hour notice before landlord entry\n5. **Eviction Protection**: Must go through court (no self-help eviction)\n\n**EVICTION PROCESS (Landlord Must Follow):**\n\n**Step 1:** Serve Quit Notice\n• 1 month for monthly tenancies\n• Must be in writing\n\n**Step 2:** Rent Tribunal/Court Application\n• Cannot evict without court order\n• Tenant can defend\n\n**Step 3:** Warrant of Eviction\n• Only after court judgment\n• Executed by court bailiff\n\n**⚠️ Illegal Actions by Landlord:**\n• Locking you out (illegal eviction)\n• Switching off water/electricity\n• Removing doors/windows\n• Auctioning goods without court order\n\n**Remedy:** Report to OCS, sue for damages, injunction\n\n**DEPOSIT REFUND:**\n• Must be returned within 30 days after lease ends\n• Deductions only for actual damages (with proof)\n• Take photos at move-in and move-out\n\n**LANDLORD RIGHTS:**\n• Distress for unpaid rent (after 7 days default)\n• Eviction through proper legal process\n• Compensation for property damage\n\n**RENT TRIBUNAL:**\nFaster, cheaper alternative to court for rent disputes\n• Location: County offices\n• Fee: KES 500-2,000\n• Decision: 30-60 days\n\nGet tenancy legal help:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Tenancy Lawyer',
            description: 'Eviction defense, deposit recovery, and rent disputes',
            price: 'KES 5,000',
            cta: 'Book Now'
          },
          {
            type: 'document',
            title: 'Tenancy Agreement Template',
            description: 'Landlord-tenant contract compliant with Kenyan law',
            price: 'KES 500',
            cta: 'Download'
          }
        ]
      };
    }

    // Wills, Succession & Inheritance
    if (query.includes('will') || query.includes('inheritance') || query.includes('estate') || query.includes('succession') || query.includes('death') || query.includes('beneficiary')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '📜 **Wills & Succession - Kenya**\n\n**MAKING A VALID WILL:**\n\n**Law of Succession Act (Cap 160)**\n\n**Legal Requirements (Section 5-11):**\n1. **Age**: Must be 18+ years\n2. **Mental Capacity**: Sound mind\n3. **Written**: Must be in writing\n4. **Signed**: By testator (will-maker)\n5. **Witnessed**: 2 independent witnesses (not beneficiaries)\n6. **Date**: Must be dated\n\n**What to Include:**\n• Personal details (ID, KRA PIN)\n• Executor appointment (who implements the will)\n• Guardian for minor children\n• Assets list (land, bank accounts, investments)\n• Beneficiaries and their shares\n• Specific bequests (who gets what)\n• Residuary clause (remaining estate)\n• Burial wishes (optional)\n\n**DYING WITHOUT A WILL (Intestacy):**\n\nDistribution per Law of Succession Act:\n• **Surviving spouse + children**: Spouse gets personal/household items + life interest in land; children inherit remainder\n• **No spouse, only children**: Equal shares\n• **Spouse, no children**: All to spouse\n• **No spouse/children**: To parents, then siblings\n\n**SUCCESSION PROCESS:**\n\n**Step 1:** Death Certificate (from hospital/civil registrar)\n\n**Step 2:** Apply for Grant\n• **Grant of Probate**: If there\'s a will\n• **Letters of Administration**: No will\n• File at High Court or Kadhi Court (for Muslims)\n\n**Step 3:** Documents Required\n• Death certificate\n• Original will (if any)\n• List of assets and liabilities\n• ID copies of beneficiaries\n• Consent from beneficiaries\n\n**Step 4:** Court Process\n• Publish in Kenya Gazette (21 days for objections)\n• Pay court fees (based on estate value)\n• Grant issued (3-6 months)\n\n**Step 5:** Estate Distribution\n• Settle debts and funeral expenses first\n• Pay taxes (if estate >KES 10M)\n• Distribute to beneficiaries\n• Final accounts to court\n\n**INHERITANCE TAX:**\nCurrently NO inheritance tax in Kenya (abolished 1985)\n\n**IMPORTANT:**\n• Will can be revoked/amended anytime\n• Marriage revokes previous will\n• Store will safely (with lawyer or bank vault)\n• Update every 3-5 years or after major life events\n\nPrepare your will or handle succession:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Succession Lawyer',
            description: 'Will drafting, probate, and estate administration expert',
            price: 'KES 12,000',
            cta: 'Book Session'
          },
          {
            type: 'document',
            title: 'Last Will & Testament Template',
            description: 'Kenya-compliant will template + execution guide',
            price: 'KES 1,000',
            cta: 'Get Template'
          }
        ]
      };
    }
    
    // Road Accidents & Personal Injury
    if (query.includes('accident') || query.includes('crash') || query.includes('injury') || query.includes('boda') || query.includes('matatu') || query.includes('hit') || query.includes('compensation')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🚑 **Road Accident Procedures - Kenya**\n\n**IMMEDIATE ACTIONS AT ACCIDENT SCENE:**\n\n**1. Stop & Secure Scene (Traffic Act Sec 67)**\n• MUST stop immediately (failure = criminal offence)\n• Switch on hazard lights\n• Place warning triangle 50m away\n• Call emergency: 999 or 112\n\n**2. Do NOT Move Vehicles** (unless minor)\n• Preserve evidence for police\n• Take photos/videos from multiple angles\n• Note road conditions, weather, time\n\n**3. Exchange Information:**\n• Names, IDs, contacts\n• Vehicle registration numbers\n• Insurance details (Policy No. & Company)\n• Witnesses contact info\n\n**4. Police Report (Compulsory for Insurance):**\n• Call police immediately\n• Get Police Abstract (P3 Form) within 24 hours\n• Report at nearest police station if police don\'t come\n• Abstract required for insurance claim\n\n**INSURANCE CLAIM PROCESS:**\n\n**Third Party Claims (Insurance Act):**\n• Notify your insurer within 24 hours\n• File claim with other party\'s insurer\n• Submit: P3 form, repair estimates, medical bills\n• Timeline: 90 days for decision\n\n**Own Damage (Comprehensive):**\n• Report to your insurer within 24 hours\n• Get assessor\'s report\n• Approved repairs at authorized garages\n\n**BODA BODA ACCIDENTS - Special Considerations:**\n\n⚠️ **Most boda bodas have NO insurance**\n\n**Your Options:**\n1. **Pursue Rider Personally** (often no assets)\n2. **NTSA Motor Vehicle Accident Fund:**\n   • For victims of uninsured vehicles\n   • Apply at NTSA offices\n   • Compensation up to KES 3M (death), KES 1M (injury)\n   • No-fault scheme - even if you caused accident\n\n**PERSONAL INJURY COMPENSATION:**\n\n**What You Can Claim:**\n• Medical expenses (bills, future treatment)\n• Loss of earnings (past & future)\n• Pain & suffering (general damages)\n• Loss of amenities (if permanent disability)\n• Transport costs\n\n**Calculation (Case Law):**\n• Minor injuries: KES 50,000 - 500,000\n• Serious fractures: KES 500,000 - 2M\n• Permanent disability: KES 2M - 10M+\n• Death: KES 3M - 15M (dependents claim)\n\n**Legal Process:**\n1. Obtain medical report (final diagnosis)\n2. Get police abstract (OB number)\n3. File suit within 3 years (Limitation Act)\n4. Serve defendant & insurance company\n5. Trial or settlement negotiation\n6. Timeline: 2-5 years average\n\n**CRIMINAL vs CIVIL:**\n• **Criminal**: Police prosecute for reckless driving\n• **Civil**: You sue for compensation\n• Both can proceed simultaneously\n\n**Hit & Run:**\n• Report immediately to police\n• Apply to NTSA Accident Fund\n• Check dashcam/CCTV footage nearby\n\n**📌 Critical:**\nSeek medical attention IMMEDIATELY even if no visible injury - internal injuries can manifest later. Medical records are evidence.\n\nGet legal help for compensation:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Personal Injury Lawyer',
            description: 'Accident claims, insurance disputes, NTSA fund applications',
            price: 'KES 15,000',
            cta: 'Book Consultation'
          },
          {
            type: 'document',
            title: 'Accident Claim Guide',
            description: 'Step-by-step procedures, required documents, and sample letters',
            price: 'KES 700',
            cta: 'Download Guide'
          }
        ]
      };
    }

    // Police Arrest & Rights
    if (query.includes('arrest') || query.includes('police') || query.includes('custody') || query.includes('detained') || query.includes('rights') || query.includes('bail')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '👮 **Rights of Arrested Persons - Kenya**\n\n**CONSTITUTIONAL RIGHTS (Article 49 & 50):**\n\n**AT TIME OF ARREST:**\n\n**1. Right to be Informed (Article 49(1)):**\n• Reason for arrest (in language you understand)\n• Right to remain silent\n• Consequences of not remaining silent\n• Right to a lawyer\n\n**2. Right to Remain Silent:**\n• You are NOT obliged to answer questions\n• Anything you say can be used against you\n• Request: "I want to speak to my lawyer first"\n\n**3. Right to a Lawyer:**\n• Free legal aid if you cannot afford (Legal Aid Act)\n• Contact: National Legal Aid Service 0800 720 721\n• Lawyer can be present during questioning\n\n**4. Right to Dignity:**\n• No torture or cruel treatment (Article 25)\n• No stripping or degrading treatment\n• Female suspects searched by female officers only\n\n**IN CUSTODY:**\n\n**Time Limits (Article 49(1)(f)):**\n• Maximum 24 hours in police custody\n• MUST be taken to court within 24 hours or released\n• Weekends/holidays: Must be taken to court on next working day\n\n**Rights While Detained:**\n• Right to notify family/friend\n• Access to medical treatment if injured/sick\n• Right to reasonable access to lawyer\n• Right to humane conditions (food, water, sanitation)\n\n**COURT APPEARANCE & BAIL:**\n\n**First Appearance (Article 49(1)(h)):**\n• Must appear in person before court\n• Prosecutor reads charges\n• You plead: guilty or not guilty\n• Bail application can be made\n\n**Right to Bail (Article 49(1)(h)):**\n• Release is the DEFAULT (not exception)\n• Court can deny bail ONLY if:\n  - Flight risk\n  - Likely to interfere with witnesses\n  - Likely to commit similar offence\n  - Serious offence (murder, terrorism, treason)\n\n**Bail Conditions:**\n• Cash deposit or bond\n• Surety (someone to guarantee you appear)\n• Surrender passport\n• Report to police station regularly\n\n**WHAT TO DO IF ARRESTED:**\n\n✅ **DO:**\n• Stay calm and respectful\n• Ask why you\'re being arrested\n• Ask for lawyer immediately\n• Remember officer\'s name & service number\n• Note time & place of arrest\n• Request to inform family\n• Cooperate physically (don\'t resist)\n• Document any injuries (photos, medical exam)\n\n❌ **DON\'T:**\n• Resist arrest (even if unlawful)\n• Answer questions without lawyer\n• Sign anything without lawyer\n• Argue or insult officers\n• Attempt to bribe (separate offence)\n\n**UNLAWFUL ARREST:**\n\nFile at Independent Policing Oversight Authority (IPOA):\n• Online: www.ipoa.go.ke\n• Hotline: 0719 520 000\n• Email: info@ipoa.go.ke\n\n**Remedies:**\n• Habeas corpus application (immediate release)\n• Sue for false imprisonment\n• Criminal complaint against officer\n• Compensation for unlawful detention\n\n**CHILDREN (Under 18):**\n• Must NOT be held with adults (Children Act Sec 186)\n• Parent/guardian must be informed immediately\n• Special protections apply\n\n**TRAFFIC OFFENCES:**\n• Can pay cash bail at police station\n• Alternative: Police bond (no money, just guarantee)\n• Court date issued\n\nGet immediate legal help if arrested:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Criminal Defense Lawyer',
            description: 'Bail applications, rights violations, police misconduct cases',
            price: 'KES 20,000',
            cta: 'Urgent Consultation'
          },
          {
            type: 'document',
            title: 'Know Your Rights Guide',
            description: 'Complete guide on arrest procedures and constitutional rights',
            price: 'KES 500',
            cta: 'Download Now'
          }
        ]
      };
    }

    // Domestic Violence & Gender-Based Violence
    if (query.includes('domestic') || query.includes('violence') || query.includes('abuse') || query.includes('assault') || query.includes('gbv') || query.includes('rape') || query.includes('defilement')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🆘 **Domestic & Gender-Based Violence - Kenya**\n\n**IMMEDIATE SAFETY:**\n\n**Emergency Contacts:**\n• Police: 999 or 112\n• Gender Violence Recovery Centre: 0709 104 000\n• National Gender & Equality Commission: 0800 221 100\n• FIDA Kenya: 0800 720 553 (Free legal aid for women)\n\n**YOUR LEGAL RIGHTS:**\n\n**Protection of Domestic Violence Act, 2015:**\n\n**What is Domestic Violence:**\n• Physical abuse (hitting, slapping, choking)\n• Sexual abuse (forced sex, even in marriage)\n• Emotional abuse (threats, insults, isolation)\n• Economic abuse (controlling money, preventing work)\n• Intimidation, harassment, stalking\n\n**Who is Protected:**\n• Spouses (married or cohabiting)\n• Former spouses\n• Dating partners\n• Family members (parents, children, siblings)\n\n**PROTECTION ORDERS:**\n\n**Types of Orders:**\n\n**1. Protection Order (Immediate):**\n• Prohibits abuser from violent acts\n• Can order abuser to leave home\n• No contact with victim\n• Valid: 6-12 months (renewable)\n\n**2. Occupation Order:**\n• Victim keeps the house\n• Abuser must leave (even if he owns it)\n• Protects your right to safe shelter\n\n**3. Compensation Order:**\n• Abuser pays for:\n  - Medical expenses\n  - Property damage\n  - Lost wages\n  - Counseling costs\n\n**How to Get Protection Order:**\n\n**Step 1:** Go to nearest court (Magistrate\'s Court)\n• NO FILING FEE (it\'s free)\n• Fill application form\n• Can apply without lawyer\n\n**Step 2:** Court hearing (same day or within 7 days)\n• Explain abuse to magistrate\n• Bring evidence: photos, medical reports, witnesses\n• Abuser is summoned\n\n**Step 3:** Interim Order (immediate protection)\n• Issued same day if danger is imminent\n• Valid until full hearing\n\n**Step 4:** Final Order\n• After hearing both sides\n• Enforceable by police\n• Breach = Criminal offence (up to 3 years jail)\n\n**CRIMINAL CHARGES:**\n\n**Offences Under Penal Code:**\n• Assault causing bodily harm (Sec 251)\n• Sexual assault (Sec 5, Sexual Offences Act)\n• Rape (including marital rape - Sec 3)\n• Defilement (sex with child under 18)\n• Attempted murder\n\n**Reporting Process:**\n1. Report at police station (any station, not just your area)\n2. Get P3 Form for medical examination\n3. Go to hospital (within 72 hours for evidence)\n4. Police investigate\n5. File charges in court\n6. Free witness protection if needed\n\n**SEXUAL OFFENCES (Sexual Offences Act, 2006):**\n\n**Evidence Collection:**\n• Do NOT bathe or change clothes\n• Report within 72 hours (for DNA evidence)\n• P3 medical exam at government hospital (free)\n• HIV PEP available within 72 hours\n\n**Consent:**\n• Must be freely given\n• Cannot be given if: drunk, drugged, asleep, underage\n• Marriage does NOT equal automatic consent\n\n**SUPPORT SERVICES:**\n\n**Shelters (Safe Houses):**\n• Coalition on Violence Against Women: 0721 682 637\n• Nairobi Women\'s Hospital Gender Violence Centre: 0720 774 414\n\n**Counseling:**\n• Free at LVCT Health centers\n• Gender-Based Violence Recovery Centres (public hospitals)\n\n**Legal Aid:**\n• FIDA Kenya (free for women)\n• National Legal Aid Service\n• Kituo Cha Sheria: 0202 387 1006\n\n**CHILDREN:**\nIf child is being abused, anyone can report (mandatory reporting). Call Childline: 116\n\n**⚠️ IMPORTANT:**\n• You are NOT to blame\n• Abuse is a CRIME, not a "family matter"\n• You have the RIGHT to safety\n• Orders are FREE - no filing fees\n• Police MUST help you (it\'s their duty)\n\nGet immediate legal protection:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'GBV & Family Protection Lawyer',
            description: 'Protection orders, criminal cases, divorce with abuse - Free for women via FIDA',
            price: 'FREE',
            cta: 'Get Help Now'
          },
          {
            type: 'document',
            title: 'Domestic Violence Survivor Guide',
            description: 'Protection orders, evidence collection, support services directory',
            price: 'FREE',
            cta: 'Download'
          }
        ]
      };
    }

    // Human Rights Violations
    if (query.includes('human rights') || query.includes('discrimination') || query.includes('harassment') || query.includes('freedom') || query.includes('torture')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '✊ **Human Rights Protection - Kenya**\n\n**BILL OF RIGHTS (Constitution Chapter 4):**\n\n**FUNDAMENTAL RIGHTS & FREEDOMS:**\n\n**1. Right to Life (Article 26)**\n• No one shall be deprived of life intentionally\n• Abortion allowed only if mother\'s life in danger\n• Death penalty suspended (commuted to life imprisonment)\n\n**2. Right to Dignity (Article 28)**\n• No torture, cruel, inhuman or degrading treatment\n• Applies to: prisoners, suspects, students, employees\n• Includes psychological torture\n\n**3. Right to Personal Liberty (Article 29)**\n• No arbitrary arrest or detention\n• Must be informed of reason for arrest\n• Must be brought to court within 24 hours\n\n**4. Freedom from Slavery (Article 30)**\n• No slavery, servitude, forced labor\n• Includes human trafficking, forced marriages\n• Counter-Trafficking in Persons Act, 2010\n\n**5. Right to Privacy (Article 31)**\n• Privacy of home, property, possessions\n• No search without warrant\n• Privacy of communications (calls, messages, emails)\n\n**6. Freedom of Expression (Article 33)**\n• Freedom of speech, media, artistic creativity\n• Limitations: hate speech, incitement to violence, propaganda for war\n• Whistleblower Protection Act protects exposing corruption\n\n**7. Freedom of Assembly (Article 37)**\n• Right to peaceful protest, demonstration, picket\n• MUST notify police (not ask permission)\n• Police can only restrict if public safety threat\n\n**8. Freedom of Association (Article 36)**\n• Join or form political parties, unions, societies\n• No one can be forced to join association\n\n**9. Freedom of Movement (Article 39)**\n• Move freely within Kenya\n• Leave and return to Kenya\n• Passport is a RIGHT (cannot be denied arbitrarily)\n\n**10. Freedom from Discrimination (Article 27)**\n• Equal before the law\n• No discrimination based on:\n  - Race, sex, pregnancy, marital status\n  - Ethnic/social origin, color, age\n  - Disability, religion, conscience, belief\n  - Culture, language, birth\n  - HIV status\n• Includes workplace, education, services\n\n**ECONOMIC & SOCIAL RIGHTS:**\n\n**11. Right to Education (Article 43 & 53)**\n• Free and compulsory basic education\n• Further education accessible and affordable\n• No child can be denied education due to fees\n\n**12. Right to Health (Article 43)**\n• Highest attainable standard of health\n• Emergency medical treatment cannot be refused\n\n**13. Right to Housing (Article 43)**\n• Accessible and adequate housing\n• No eviction without court order\n\n**14. Right to Food (Article 43)**\n• Freedom from hunger\n• Adequate food of acceptable quality\n\n**15. Right to Clean Environment (Article 42)**\n• Clean and healthy environment\n• Can sue polluters (public interest litigation)\n\n**ENFORCEMENT:**\n\n**Where to Report Violations:**\n\n**1. Kenya National Commission on Human Rights:**\n• Complaints: 0800 720 627 (toll-free)\n• Online: www.knchr.org\n• Investigates and refers to prosecution\n\n**2. National Gender & Equality Commission:**\n• Discrimination complaints: 0800 221 100\n• Gender, disability, age discrimination\n\n**3. High Court (Constitutional Petition):**\n• File under Article 22 & 23\n• Petition can be filed by:\n  - Victim\n  - Anyone acting on victim\'s behalf\n  - Public interest groups\n• NO FILING FEE for human rights cases\n• Fast-tracked hearings\n\n**4. Independent Policing Oversight Authority (IPOA):**\n• Police brutality, torture by police\n• 0719 520 000\n\n**REMEDIES:**\n• Declaration of rights\n• Injunction (stop violation)\n• Compensation/damages\n• Apology\n• Criminal prosecution of violators\n\n**PUBLIC INTEREST LITIGATION:**\nANYONE can file case on behalf of:\n• Vulnerable groups\n• Public good\n• Constitutional interpretation\n\n**SPECIAL PROTECTIONS:**\n\n**Marginalized Groups:**\n• Women, children, persons with disabilities\n• Minorities, older persons\n• Affirmative action programs required\n\nSeek human rights legal help:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Human Rights Lawyer',
            description: 'Constitutional petitions, discrimination cases, public interest litigation',
            price: 'KES 25,000',
            cta: 'File Petition'
          },
          {
            type: 'document',
            title: 'Bill of Rights Guide',
            description: 'Complete guide to your constitutional rights and how to enforce them',
            price: 'KES 800',
            cta: 'Learn More'
          }
        ]
      };
    }

    // Elections & Electoral Law
    if (query.includes('election') || query.includes('vote') || query.includes('electoral') || query.includes('voter') || query.includes('rigging') || query.includes('campaign')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🗳️ **Electoral Law & Voting Rights - Kenya**\n\n**VOTER REGISTRATION:**\n\n**Eligibility (Constitution Article 83):**\n• Kenyan citizen (by birth or registration)\n• 18 years or older\n• Sound mind\n• NOT serving prison sentence >6 months\n\n**How to Register:**\n• Continuous registration at IEBC offices\n• Mass registration before elections\n• Online via IEBC portal\n• Biometric capture (fingerprints, photo)\n• Bring: Original ID/Passport\n\n**Voter\'s Card:**\n• Issued after registration\n• Required to vote\n• Free of charge\n\n**YOUR VOTING RIGHTS:**\n\n**1. Right to Vote (Article 38):**\n• Free, fair, secret ballot\n• Vote for candidate of your choice\n• No one can force you to vote certain way\n\n**2. Right to Contest (Article 38(2)):**\n• Can run for any elective position if qualified\n• President: 35-75 years, degree holder\n• MP/MCA: 21+ years, degree (MP only)\n\n**3. Right to Campaign Freely:**\n• Support candidate of choice\n• Attend rallies, distribute materials\n• Cannot be victimized for political views\n\n**ELECTION DAY PROCEDURES:**\n\n**Voting Process:**\n1. Arrive with ID & voter\'s card\n2. Queue at your polling station (check via IEBC)\n3. Verification (biometric/manual)\n4. Receive ballot papers (6 for general election)\n5. Mark in SECRET (no phones/cameras)\n6. Fold and cast in ballot boxes\n7. Ink finger (prevent multiple voting)\n\n**Polling Station Rights:**\n• Vote even if in queue at 5pm (closing time)\n• Assistance if illiterate/disabled\n• Peaceful environment (no campaigning within 400m)\n\n**ELECTORAL OFFENCES (Elections Act):**\n\n**Voter Offences:**\n• Vote buying/selling (up to 2 years jail)\n• Multiple voting (up to 3 years jail)\n• Impersonation (up to 5 years jail)\n• Disclosing how you voted (if secrecy violated)\n\n**Candidate Offences:**\n• Bribery (disqualification + jail)\n• Violence/intimidation\n• Hate speech (up to 5 years jail)\n• Exceeding campaign spending limits\n• False information about opponent\n\n**CHALLENGING ELECTION RESULTS:**\n\n**Presidential Election Petition:**\n• File at Supreme Court within 7 days\n• Grounds: non-compliance with Constitution/law\n• Famous case: Raila v IEBC (2017) - election nullified\n• Decision within 14 days\n\n**Other Elections (MP, Governor, Senator, MCA):**\n• File at High Court within 28 days\n• Prove: electoral malpractice affected results\n• Decision within 6 months\n• Can appeal to Court of Appeal\n\n**What You Can Challenge:**\n• Rigging (ballot stuffing, result alteration)\n• Voter bribery\n• Violence/intimidation\n• IEBC non-compliance with procedures\n• Candidate disqualification issues\n\n**Evidence Required:**\n• Polling station results forms (Form 34A/35A)\n• Photos/videos of malpractice\n• Witness statements (agents, voters)\n• Expert evidence (technology, statistics)\n\n**ELECTORAL VIOLENCE:**\n\n**International Crimes Act:**\n• Crimes against humanity during elections\n• ICC (International Criminal Court) jurisdiction\n• No one immune (including politicians)\n\n**Reporting:**\n• National Cohesion & Integration Commission: 0719 026 000\n• DCI: 0800 722 203\n• Ushahidi platform (crowd-sourced reporting)\n\n**INDEPENDENT ELECTORAL & BOUNDARIES COMMISSION (IEBC):**\n\n**IEBC Mandate:**\n• Conduct elections & referendums\n• Register voters\n• Resolve electoral disputes (before election)\n• Demarcate constituencies\n\n**IEBC Contacts:**\n• Toll-free: 1533\n• Email: info@iebc.or.ke\n• Complaints: complaints@iebc.or.ke\n\n**PARTY PRIMARIES:**\n\n**Political Parties Act:**\n• Free, fair, transparent nominations\n• Can challenge at Political Parties Disputes Tribunal\n• Then to High Court if unsatisfied\n• Deadline: Before IEBC clearance\n\n**CAMPAIGN FINANCING:**\n\n**Spending Limits (Election Campaign Financing Act):**\n• Presidential: KES 4.4 billion\n• Gubernatorial: KES 433 million\n• Senator: KES 216 million\n• MP: KES 33 million\n\n**Disclosure Required:**\n• Source of funds\n• Expenditure reports to IEBC\n• Penalties for non-disclosure\n\nGet electoral legal assistance:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Electoral Law Specialist',
            description: 'Election petitions, voter rights, IEBC disputes, party nominations',
            price: 'KES 50,000',
            cta: 'Contest Results'
          },
          {
            type: 'document',
            title: 'Electoral Process Guide',
            description: 'Voting rights, petition procedures, and electoral offences',
            price: 'KES 1,000',
            cta: 'Download'
          }
        ]
      };
    }

    // Criminal Law - Assault, Robbery, Theft, Insults
    if (query.includes('assault') || query.includes('attack') || query.includes('fight') || query.includes('robbery') || query.includes('theft') || query.includes('steal') || query.includes('insult') || query.includes('defamation') || query.includes('criminal') || query.includes('crime')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚖️ **Criminal Law - Kenya (Penal Code Cap 63)**\n\n**COMMON CRIMINAL OFFENCES:**\n\n**1. ASSAULT & BATTERY**\n\n**Simple Assault (Section 251):**\n• Unlawful application of force on another person\n• Examples: Pushing, slapping, punching\n• Penalty: Up to 2 years imprisonment or fine\n• No serious injury required\n\n**Assault Causing Actual Bodily Harm (Section 251):**\n• Assault resulting in injury (bruises, cuts, fractures)\n• Penalty: Up to 5 years imprisonment\n• Medical evidence required (P3 form)\n\n**Grievous Harm (Section 234):**\n• Serious injury: Broken bones, permanent disfigurement, internal injuries\n• Intent to cause serious harm\n• Penalty: Up to life imprisonment\n• Includes: Maiming, acid attacks, severe beatings\n\n**What to Do if Assaulted:**\n1. Seek medical attention immediately (evidence)\n2. Get P3 form from police (free medical exam)\n3. Report at police station (get OB number)\n4. Preserve evidence: Photos, torn clothes, witnesses\n5. File criminal complaint\n6. Can also sue for compensation (civil case)\n\n**2. ROBBERY & THEFT**\n\n**Theft (Section 268):**\n• Taking someone\'s property without consent\n• Intent to permanently deprive owner\n• Penalty: Up to 7 years imprisonment\n• Examples: Pickpocketing, shoplifting, employee theft\n\n**Robbery (Section 296):**\n• Theft using force or threat of force\n• BEFORE or AT TIME of stealing\n• Penalty: Death penalty (commuted to life imprisonment)\n• Examples: Mugging, armed robbery, carjacking\n\n**Robbery with Violence (Section 296(2)):**\n• Robbery while armed OR causing injury\n• Mandatory: Death penalty (commuted to life)\n• No bail for this offence\n• Examples: Armed gang robbery, violent carjacking\n\n**Burglary (Section 304):**\n• Breaking into building to commit crime\n• Penalty: Up to 7 years imprisonment\n• Aggravated burglary (armed): Up to 14 years\n\n**Handling Stolen Property (Section 322):**\n• Receiving/buying goods knowing they\'re stolen\n• Penalty: Up to 3 years imprisonment\n• "I didn\'t know" is NOT a defense if circumstances suspicious\n\n**What to Do if Robbed/Stolen From:**\n1. Report to police immediately (get OB number)\n2. List ALL stolen items with serial numbers\n3. If phone stolen: Report to Safaricom/Airtel (block IMEI)\n4. Cancel bank cards immediately\n5. Request CCTV footage from scene\n6. File insurance claim (if insured)\n\n**3. DEFAMATION & INSULTS**\n\n**Criminal Defamation (Section 194):**\n• Publishing false statement that injures reputation\n• Must be published to third party (not just victim)\n• Penalty: Up to 2 years imprisonment or fine\n• Truth is a defense\n\n**What Qualifies:**\n• Written: Libel (newspaper, social media, SMS)\n• Spoken: Slander (verbal insults to third party)\n• Must damage reputation in community\n\n**Insults/Abusive Language (Section 94):**\n• Using insulting words likely to provoke breach of peace\n• In public place\n• Penalty: Fine or imprisonment up to 6 months\n• Common in bar fights, road rage incidents\n\n**Cyber Harassment (Computer Misuse & Cybercrimes Act, 2018):**\n• Section 27: False publication (online defamation)\n• Section 22: Cyber harassment\n• Penalty: KES 5 million fine or 3 years jail\n• Includes: Revenge porn, cyberbullying, online threats\n\n**4. OTHER COMMON OFFENCES**\n\n**Trespass (Penal Code Section 144):**\n• Entering property without permission\n• Penalty: Fine or up to 3 months imprisonment\n• Landowner can use reasonable force to eject\n\n**Malicious Damage to Property (Section 339):**\n• Intentionally damaging someone\'s property\n• Examples: Slashing tires, breaking windows, destroying crops\n• Penalty: Repair cost + imprisonment up to 5 years\n\n**Obtaining by False Pretences (Section 313):**\n• Fraud - getting property/money by lying\n• Examples: Fake M-Pesa, investment scams, impersonation\n• Penalty: Up to 3 years imprisonment\n\n**Threatening Violence (Section 95):**\n• Threatening to kill/harm someone\n• Even if no intent to actually do it\n• Penalty: Up to 3 years imprisonment\n• Includes: SMS threats, verbal threats\n\n**REPORTING CRIMES:**\n\n**Where to Report:**\n• Any police station (doesn\'t have to be your area)\n• DCI Hotline: 0800 722 203\n• Police Hotline: 999 or 112\n• Online: https://www.crs.nationalpolice.go.ke\n\n**What You Need:**\n• Original ID/Passport\n• Details of incident (date, time, place)\n• Description of suspect (if known)\n• Witnesses\n• Evidence (photos, messages, CCTV)\n\n**Your Statement:**\n• Write in your own words\n• Be accurate and detailed\n• Sign each page\n• Keep a copy (OB number)\n\n**PRIVATE PROSECUTION:**\nIf police refuse to act, you can privately prosecute (Criminal Procedure Code Section 85):\n• Hire lawyer\n• File complaint in Magistrate\'s Court\n• Serve summons on accused\n• Proceed to trial\n\n**COMPENSATION:**\n\n**Restitution Order (Criminal Procedure Code Section 176):**\n• Court can order offender to compensate victim\n• Return stolen property or pay value\n• Part of criminal sentence\n\n**Civil Suit:**\n• Separate from criminal case\n• Sue for damages (medical bills, lost wages, pain & suffering)\n• Lower burden of proof than criminal (balance of probabilities)\n• Can proceed even if criminal case fails\n\n**SELF-DEFENSE:**\n\n**Legal Self-Defense (Section 17):**\n• Reasonable force to protect yourself/others/property\n• Force must be proportionate to threat\n• Cannot continue after threat ends\n• Cannot use deadly force for minor threat\n\n**⚠️ Important:**\n• Citizen\'s arrest allowed ONLY for felonies (serious crimes)\n• Cannot detain suspect beyond reasonable time to hand to police\n• Use of excessive force = assault charge against you\n\nGet criminal law assistance:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Criminal Defense Lawyer',
            description: 'Assault cases, theft/robbery defense, victim representation, private prosecutions',
            price: 'KES 30,000',
            cta: 'Get Legal Help'
          },
          {
            type: 'document',
            title: 'Criminal Procedure Guide',
            description: 'How to report crimes, evidence collection, court procedures',
            price: 'KES 600',
            cta: 'Download'
          }
        ]
      };
    }

    // Employment law scenario
    if (query.includes('employment') || query.includes('fired') || query.includes('dismissal') || query.includes('termination') || query.includes('salary') || query.includes('workplace')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '📋 **Employment Law Analysis - Kenya**\n\nBased on your employment concern, here\'s what Kenyan law says:\n\n**Legal Framework:**\n• Employment Act, 2007 (Section 45) - Governs termination procedures\n• Labour Relations Act, 2007 - Protects workers\' rights\n• Constitution of Kenya, 2010 (Article 41) - Right to fair labour practices\n\n**Your Rights:**\n1. **Notice Period**: Employer must give notice per Section 35(1) - minimum 1 month for monthly-paid employees\n2. **Fair Hearing**: Section 41 requires employer to give reasons and opportunity to respond\n3. **Compensation**: Wrongful dismissal may entitle you to 12+ months salary (precedent: *Mary Mugo v Kenya Commercial Bank*)\n\n**Next Steps:**\nDocument everything - termination letter, employment contract, payslips. The Employment and Labour Relations Court has jurisdiction per Article 162(2) of the Constitution.\n\nI recommend consulting with an employment law specialist:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Employment Law Specialist',
            description: 'Expert in wrongful dismissal cases - familiar with Employment Act 2007 and case law',
            price: 'KES 3,500',
            cta: 'Book Consultation'
          },
          {
            type: 'document',
            title: 'Employment Rights Guide',
            description: 'Complete guide with case citations and ELRC procedures',
            price: 'KES 800',
            cta: 'Purchase Guide'
          }
        ]
      };
    }
    
    // Property/land law scenario
    if (query.includes('property') || query.includes('land') || query.includes('title') || query.includes('rent') || query.includes('lease')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🏡 **Land & Property Law - Kenya**\n\nLet me guide you through the Kenyan legal framework:\n\n**Governing Laws:**\n• Land Act, 2012 - Regulates land ownership and administration\n• Land Registration Act, 2012 - Title procedures and registration\n• National Land Commission Act, 2012 - Disputes and historical injustices\n• Constitution of Kenya, 2010 (Article 40) - Right to property\n\n**Key Legal Requirements:**\n1. **Title Verification**: Search at the Ministry of Lands (Section 24, Land Registration Act)\n2. **Stamp Duty**: 4% for urban, 2% for agricultural land (Stamp Duty Act)\n3. **Consent to Transfer**: Required from Land Control Board (Section 6, Land Control Act)\n4. **Capital Gains Tax**: 5% on transfer (Income Tax Act, Section 34)\n\n**Common Issues:**\n• Double allocation (use Ardhisasa portal for verification)\n• Fraudulent titles (report to DCI under Penal Code Section 320)\n• Boundary disputes (refer Section 13, Land Act)\n\nConsult a conveyancing lawyer for due diligence:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Conveyancing & Property Lawyer',
            description: 'Title searches, transfer procedures, and dispute resolution specialist',
            price: 'KES 5,000',
            cta: 'Book Consultation'
          },
          {
            type: 'document',
            title: 'Land Sale Agreement (Kenya)',
            description: 'Template compliant with Land Act 2012 + transfer checklist',
            price: 'KES 1,500',
            cta: 'Purchase Template'
          }
        ]
      };
    }

    // Family law scenario
    if (query.includes('divorce') || query.includes('custody') || query.includes('marriage') || query.includes('family') || query.includes('child')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: '👨‍👩‍👧 **Family Law Guidance - Kenya**\n\nFamily matters are sensitive. Here\'s what the law provides:\n\n**Legal Framework:**\n• Marriage Act, 2014 - Governs all marriages (civil, customary, Hindu, Islamic)\n• Matrimonial Property Act, 2013 - Division of property\n• Children Act, 2022 - Child custody and welfare\n• Constitution of Kenya, 2010 (Article 45) - Family rights\n\n**Divorce Grounds (Section 66, Marriage Act):**\n1. Adultery\n2. Cruelty (physical/mental)\n3. Desertion for 3+ years\n4. Irretrievable breakdown\n\n**Child Custody (Section 23, Children Act):**\nBest interests of the child paramount - court considers:\n• Child\'s wishes (if mature enough)\n• Parental capability\n• Need for stability\n\n**Property Division:**\nContribution-based under Section 7, Matrimonial Property Act (not automatic 50/50). Include financial AND non-financial contributions.\n\n**Jurisdiction:**\nFile at Chief Magistrate\'s Court (Section 3, Magistrates Courts Act) or Family Division of High Court for complex cases.\n\nSpeak with a family law specialist:',
        timestamp: new Date(),
        recommendations: [
          {
            type: 'lawyer',
            title: 'Family Law Advocate',
            description: 'Expert in divorce, custody, and matrimonial property under Marriage Act 2014',
            price: 'KES 4,000',
            cta: 'Book Consultation'
          },
          {
            type: 'document',
            title: 'Divorce & Custody Guide',
            description: 'Complete procedures, required forms, and case law references',
            price: 'KES 900',
            cta: 'Download Guide'
          }
        ]
      };
    }

    // Default general response
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: '👋 **Hello! I\'m your AI Legal Guide for Kenya**\n\nI can help you with many legal matters. To give you the most accurate information, please describe your situation more specifically.\n\n**For example, tell me about:**\n\n🚗 **Accidents:** "I was in a road accident" or "A boda boda hit my car"\n\n⚖️ **Criminal Issues:** "Someone stole my phone" or "I was assaulted"\n\n👮 **Police Matters:** "I was arrested" or "My rights when detained"\n\n💼 **Employment:** "I was unfairly fired" or "My employer hasn\'t paid salary"\n\n🏡 **Property:** "I want to buy land" or "My landlord locked me out"\n\n👨‍👩‍👧 **Family:** "I want a divorce" or "Child custody dispute"\n\n🚗 **Vehicles:** "How to transfer a car" or "Buying a vehicle"\n\n🏢 **Business:** "Register a company" or "Someone owes me money"\n\n📜 **Inheritance:** "Writing a will" or "Someone died without a will"\n\n🗳️ **Elections:** "Voting rights" or "Challenging election results"\n\n💔 **Abuse:** "Domestic violence" or "Someone is harassing me"\n\n✊ **Rights:** "Human rights violation" or "Discrimination"\n\n**Just type your question in plain language - I\'ll provide specific laws, procedures, costs, and timelines relevant to your situation!**\n\n💡 *The more details you share, the better I can help you.*',
      timestamp: new Date(),
      recommendations: [
        {
          type: 'lawyer',
          title: 'General Practice Lawyer',
          description: 'Book a consultation for personalized legal advice on any matter',
          price: 'KES 3,500',
          cta: 'Book Consultation'
        },
        {
          type: 'document',
          title: 'Legal Templates Library',
          description: 'Browse 50+ Kenya-compliant legal document templates',
          cta: 'View Marketplace'
        }
      ]
    };
  };

  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || '📎 Sent attachments',
      timestamp: new Date(),
      attachments: attachedFiles.map((file, idx) => ({
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: previewUrls[idx] || '',
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    const currentFiles = [...attachedFiles];
    setInput('');
    setIsLoading(true);

    try {
      // Send to backend with attachments
      const formData = new FormData();
      formData.append('question', currentInput);
      currentFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('https://wakili-pro.onrender.com/api/ai/ask', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer,
          timestamp: new Date(),
          sources: data.data.sources
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback to sample response
      const aiResponse = getSampleResponse(currentInput || 'Analyze the attached files');
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setIsLoading(false);
      setAttachedFiles([]);
      setPreviewUrls([]);
    }
  };

  const handleRecommendationClick = (recType: 'lawyer' | 'document', title: string) => {
    if (!isAuthenticated) {
      // Store intended action and redirect to login
      sessionStorage.setItem('pendingAction', JSON.stringify({ type: recType, title }));
      navigate('/login', { state: { from: '/ai', message: 'Please log in to continue' } });
    } else {
      // Handle authenticated user actions
      if (recType === 'lawyer') {
        navigate('/lawyers'); // Will create this page next
      } else {
        navigate('/marketplace'); // Will create this page next
      }
    }
  };

  // Voice recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await sendVoiceQuery(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const sendVoiceQuery = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-query.webm');

      const response = await fetch('https://wakili-pro.onrender.com/api/ai/voice-query', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Voice query failed');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Add user message (transcribed text)
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: data.data.transcription || 'Voice query',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);

        // Add AI response
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.answer || 'I received your voice query.',
          timestamp: new Date(),
          sources: data.data.sources
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Voice query error:', error);
      alert('Failed to process voice query. Please try typing instead.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // File upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Unsupported file type. Please upload images or documents (PDF, DOC, DOCX).`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`${file.name}: File too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setAttachedFiles(prev => [...prev, ...validFiles]);

    // Create preview URLs for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrls(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrls(prev => [...prev, '']);
      }
    });
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setAttachedFiles(prev => [...prev, file]);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrls(prev => [...prev, e.target?.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gradient-secondary">
      {/* Header */}
      <header className="navbar">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
              >
                ← Back to Home
              </button>
              <div className="border-l border-slate-300 h-6"></div>
              <h1 className="text-2xl font-display font-bold text-slate-900">AI Legal Assistant</h1>
            </div>
            {!isAuthenticated && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">Have an account?</span>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-outline text-sm"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        style={{ display: 'none' }}
      />

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-large overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl p-4 shadow-soft ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-slate-50 text-slate-900 border border-slate-200'
                  }`}
                >
                  <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-xs rounded-lg border border-gray-300 cursor-pointer hover:opacity-90"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          ) : (
                            <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-gray-700">{attachment.name}</span>
                              {attachment.size && (
                                <span className="text-xs text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Legal Sources Cited (RAG) */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center">
                        📚 Legal Sources Cited:
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div 
                            key={idx} 
                            className="bg-white rounded-md p-3 border border-gray-200 text-gray-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900">
                                  {idx + 1}. {source.title}
                                </p>
                                {source.citation && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    Citation: {source.citation}
                                  </p>
                                )}
                                {source.section && (
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    {source.section}
                                  </p>
                                )}
                              </div>
                              <span className="ml-3 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                {(source.score * 100).toFixed(0)}% relevant
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {message.recommendations && (
                    <div className="mt-4 space-y-3">
                      {message.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-white rounded-lg p-4 border border-gray-200 text-gray-900"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                  rec.type === 'lawyer' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {rec.type === 'lawyer' ? '👨‍⚖️ Lawyer' : '📄 Document'}
                                </span>
                                {rec.price && (
                                  <span className="text-sm font-bold text-blue-600">{rec.price}</span>
                                )}
                              </div>
                              <h4 className="font-semibold text-sm">{rec.title}</h4>
                              <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                            </div>
                            <button
                              onClick={() => handleRecommendationClick(rec.type, rec.title)}
                              className="ml-4 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
                            >
                              {rec.cta}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Attachment Preview */}
          {attachedFiles.length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Attachments ({attachedFiles.length})
                </p>
                <button
                  onClick={() => {
                    setAttachedFiles([]);
                    setPreviewUrls([]);
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="relative group">
                    {file.type.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={previewUrls[idx]}
                          alt={file.name}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-300 flex flex-col items-center justify-center p-2">
                          <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-xs text-gray-600 text-center truncate w-full">
                            {file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeAttachment(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-end space-x-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me any legal question..."
                className="input-field flex-1 resize-none"
                rows={3}
                disabled={isRecording}
              />
              
              {/* File Upload Button */}
              <button
                onClick={openFileSelector}
                disabled={isLoading || isRecording}
                className="btn-ghost p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload image or document"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              {/* Camera Button */}
              <button
                onClick={openCamera}
                disabled={isLoading || isRecording}
                className="btn-ghost p-3 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Take photo"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              
              {/* Microphone Button */}
              <button
                onClick={toggleRecording}
                disabled={isLoading}
                className={`p-3 rounded-xl font-medium transition-all duration-200 ${
                  isRecording
                    ? 'bg-error text-white hover:bg-red-700 animate-pulse shadow-medium'
                    : 'btn-ghost'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? 'Stop recording' : 'Start voice recording'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isRecording ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  )}
                </svg>
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || isRecording}
                className="btn-primary px-6 py-3 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              💡 {isRecording 
                ? '🎤 Recording... Click the microphone again to stop and send' 
                : attachedFiles.length > 0
                  ? `📎 ${attachedFiles.length} file(s) attached. Type a message or click Send.`
                  : 'Type your question, upload documents/images, use camera, or click the microphone to speak.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
