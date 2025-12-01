# Wakili Pro - AI Agent Instructions

## ⚠️ CRITICAL RULES - READ FIRST

### 1. Payment System Architecture
**ABSOLUTE RULE**: There is ONLY ONE M-Pesa payment endpoint: `/api/payments/mpesa/initiate`
- **NEVER** create new payment endpoints
- **NEVER** duplicate STK Push logic  
- **NEVER** add separate callback URLs
- **ALWAYS** use unified controller for new payment types

### 2. UI Feature Protection
**ABSOLUTE RULE**: DO NOT delete or modify these critical features without explicit user request:
- Landing page "Case Analysis & Review" button with smart routing
- Role-based sidebar navigation (lawyers see "Document Reviews", not "Documents")
- Role-aware page displays (consultations, appointments, messages)
- Authentication-aware routing and button text

### 3. Role-Based Logic
**ABSOLUTE RULE**: Always check `user?.role === 'LAWYER'` before rendering:
- Lawyers see CLIENT names/info (who they're helping)
- Clients see LAWYER names/info (who's helping them)
- Navigation links differ by role
- Different mock data for each role

### 4. Code Safety
**ABSOLUTE RULE**: Before ANY modification:
- Read the FULL file to understand context
- Search for similar patterns in codebase
- Preserve existing authentication/role logic
- Validate TypeScript compilation after changes
- **NEVER** leave orphaned code blocks (e.g., `try/catch` without function wrapper)
- **ALWAYS** verify `async/await` is inside async functions
- Test builds locally before pushing to production

## Project Overview
Wakili Pro is a modern full-stack TypeScript application built with agile development practices. This monorepo follows a clean architecture with React frontend, Node.js backend, and shared utilities.

## Architecture & Structure
```
wakili-pro/
├── frontend/              # React 18 + TypeScript + Vite
│   ├── src/components/    # Reusable UI components  
│   ├── src/pages/         # Route-level components
│   ├── src/hooks/         # Custom React hooks
│   ├── src/store/         # Zustand state management
│   └── src/services/      # API client services
├── backend/               # Node.js + Express + TypeScript
│   ├── src/routes/        # API endpoint definitions
│   ├── src/controllers/   # Request/response handlers
│   ├── src/services/      # Business logic layer
│   ├── src/middleware/    # Express middleware
│   └── src/utils/         # Server utilities
├── shared/                # Cross-platform code
│   ├── src/types/         # TypeScript interfaces
│   ├── src/schemas/       # Zod validation schemas
│   └── src/utils/         # Common utilities
└── .vscode/               # VS Code workspace configuration
```

## Development Workflow
- **Monorepo**: npm workspaces with shared dependencies
- **Branch Strategy**: `feature/JIRA-123-description` naming
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks
- **Testing**: TDD with Jest (backend) + Vitest (frontend)

## Key Commands
```bash
npm run setup             # Install all workspace dependencies
npm run dev              # Start frontend (3000) + backend (5000)
npm run build            # Build all packages for production
npm run test             # Run all test suites with coverage
npm run lint             # ESLint + Prettier check all packages
```

## Technology Stack & Patterns

### Frontend (React + TypeScript)
- **Styling**: Tailwind CSS with utility-first approach
- **State**: Zustand for client state, React Query for server state
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6 with data loading patterns
- **Testing**: Vitest + React Testing Library

### Backend (Node.js + Express)
- **Architecture**: Layered (routes → controllers → services)
- **Database**: Prisma ORM with PostgreSQL (production)
- **Auth**: JWT tokens with bcrypt password hashing
- **Logging**: Winston with structured JSON logging
- **Validation**: Zod schemas shared from `/shared` package
- **Testing**: Jest + Supertest for API integration tests
- **Payments**: **UNIFIED M-Pesa Integration** - ONE endpoint for ALL payment types

### Shared Package
- **Types**: Central TypeScript definitions for API contracts
- **Schemas**: Zod validation schemas used by both frontend/backend
- **Utils**: Common helper functions and constants

## File Organization Conventions

### Component Structure (Frontend)
```typescript
// ComponentName/index.tsx
export { ComponentName } from './ComponentName';

// ComponentName/ComponentName.tsx  
interface ComponentNameProps {
  // Always define prop interfaces
}

export const ComponentName: React.FC<ComponentNameProps> = ({ prop }) => {
  // Functional components with TypeScript
};
```

### API Structure (Backend)
```typescript
// routes/resourceName.ts - Route definitions
// controllers/resourceNameController.ts - Request handlers  
// services/resourceNameService.ts - Business logic
// middleware/authMiddleware.ts - Reusable middleware
```

### Import Conventions
```typescript
// Use path aliases from tsconfig
import { ComponentName } from '@/components';
import { ApiResponse } from '@shared/types';
import { UserSchema } from '@shared/schemas';
```

## Critical Development Patterns

### Error Handling
- Frontend: Error boundaries + React Query error states
- Backend: Custom error classes with `errorHandler` middleware
- Shared: Consistent `ApiResponse<T>` interface

### Data Validation  
- All API endpoints use Zod schemas from `/shared`
- Frontend forms validate with same schemas
- Runtime type safety across the stack

### State Management
- Server state: React Query for API data
- Client state: Zustand stores in `/src/store`
- Form state: React Hook Form with controlled components

### Testing Strategy
- Unit tests: Individual functions and components
- Integration tests: API endpoints with real database
- E2E tests: Critical user flows (when implemented)
- Coverage target: 80% minimum

## VS Code Integration

### Available Tasks (Ctrl+Shift+P → "Tasks: Run Task")
- **Install Dependencies**: Setup all packages
- **Start Development**: Launch dev servers concurrently  
- **Build All**: Production build verification
- **Run Tests**: Execute test suites with watch mode
- **Lint Code**: Fix formatting and code quality issues

### Debugging
- Backend debugging configured with launch.json
- Source maps enabled for TypeScript debugging
- Console logging structured with Winston

## AI Agent Guidelines

### Code Quality
- **Always** run tests after making changes
- Use TypeScript strictly - no `any` types without justification
- Follow existing file naming and structure patterns
- Import from shared package for types/schemas

### Development Flow  
1. Check existing patterns in similar files before creating new ones
2. Update corresponding tests when modifying functionality  
3. Use VS Code tasks instead of manual terminal commands
4. Validate changes compile cleanly across all packages

### API Development
- Define Zod schemas in `/shared` first
- Generate TypeScript types from schemas  
- Implement backend validation before frontend consumption
- Update API documentation when adding endpoints

### Frontend Development
- Use Tailwind utility classes consistently
- Implement loading and error states for all async operations
- Follow React Query patterns for server state
- Create reusable components in `/components` directory

## Payment Integration Architecture

### ⚠️ CRITICAL: Unified M-Pesa Payment System

**RULE: There is ONLY ONE M-Pesa payment endpoint for ALL payment types.**

#### Single Source of Truth
```typescript
// Backend: POST /api/payments/mpesa/initiate
// Controller: backend/src/controllers/mpesaController.ts
// Service: backend/src/services/mpesaDarajaService.ts
```

#### Supported Payment Types (9 Services)
All payments use the **SAME endpoint** with different parameters:

1. **Legal Consultations** → `bookingId`
2. **Marketplace Documents** → `purchaseId`
3. **AI Document Review** → `reviewId` + reviewType='AI_ONLY' (KES 500)
4. **Lawyer Certification** → `reviewId` + reviewType='CERTIFICATION' (KES 2,000)
5. **AI + Certification** → `reviewId` + reviewType='AI_PLUS_CERTIFICATION' (KES 2,200)
6. **Service Request Commitment** → `serviceRequestId` (KES 500 - get 3 lawyer quotes)
7. **Service Request Payment** → `serviceRequestId` + `quoteId` (30% upfront: 20% platform commission, 10% lawyer escrow)
8. **Lawyer Subscription LITE** → `subscriptionId` (KES 2,999)
9. **Lawyer Subscription PRO** → `subscriptionId` (KES 4,999)

**CRITICAL PRICING & DELIVERY**:
- **ALL prices in Kenyan Shillings (KES)** - NEVER use USD ($)
- **ALL document reviews/certifications delivered within 2 hours**
- **NO urgency levels** - standard delivery for all services
- **Service request 30% split**: Client pays 30% upfront (20% platform, 10% lawyer escrow), 70% balance later

#### Payment Request Format
```typescript
// POST /api/payments/mpesa/initiate
{
  phoneNumber: string,        // Required (254XXXXXXXXX)
  amount: number,            // Required (in KES)
  paymentType?: string,      // Optional metadata
  
  // Exactly ONE of these (mutually exclusive):
  bookingId?: string,        // For consultations
  purchaseId?: string,       // For marketplace documents
  reviewId?: string,         // For document reviews/certifications
  serviceRequestId?: string, // For service request commitment/payment
  quoteId?: string,          // Required when serviceRequestId is for 30% payment
  subscriptionId?: string    // For lawyer subscriptions
}
```

#### Payment Status Polling
```typescript
// GET /api/payments/mpesa/status/:paymentId
// Returns: { success: true, data: { status: 'PENDING' | 'COMPLETED' | 'FAILED' } }
```

#### M-Pesa Callback
```typescript
// POST /api/payments/mpesa/callback (Safaricom calls this)
// Automatically updates:
// - Payment status to COMPLETED/FAILED
// - Activates subscriptions
// - Updates lawyer tier
// - Marks bookings/reviews as paid
```

### Frontend Payment Pattern
```typescript
// CRITICAL: Always CREATE resource FIRST, then PAY
// This is the TWO-STEP pattern for ALL payments

// STEP 1: Create resource and get ID + amount
const createResponse = await axiosInstance.post('/api/resource/create', data);
const { resourceId, amount } = createResponse.data.data;

// STEP 2: Initiate M-Pesa payment with resource ID
const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: amount,
  [resourceType + 'Id']: resourceId, // bookingId, purchaseId, reviewId, subscriptionId
  paymentType: 'RESOURCE_TYPE'
});

// STEP 3: Poll for payment status (optional)
const { paymentId } = paymentResponse.data.data;
const pollInterval = setInterval(async () => {
  const status = await axiosInstance.get(`/payments/mpesa/status/${paymentId}`);
  if (status.data.data.status === 'COMPLETED') {
    clearInterval(pollInterval);
    // Payment successful!
  }
}, 3000);
```

### Payment Flow Examples

**1. Document Review Payment**
```typescript
// Step 1: Create review record
const review = await axiosInstance.post('/document-review/create', {
  documentId: '...',
  reviewType: 'AI_ONLY', // or 'CERTIFICATION', 'AI_PLUS_CERTIFICATION'
  urgencyLevel: 'STANDARD'
});
const { reviewId, amount } = review.data.data;

// Step 2: Pay with M-Pesa
await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount,
  reviewId,
  paymentType: 'DOCUMENT_REVIEW'
});
```

**2. Consultation Booking Payment**
```typescript
// Step 1: Create booking
const booking = await axiosInstance.post('/consultations/book', {
  lawyerId: '...',
  date: '...',
  time: '...'
});
const { id: bookingId } = booking.data.data;

// Step 2: Pay with M-Pesa
await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount: lawyerRate,
  bookingId,
  paymentType: 'CONSULTATION'
});
```

**3. Marketplace Purchase Payment**
```typescript
// Step 1: Create purchase record
const purchase = await axiosInstance.post('/documents/marketplace/purchase', {
  templateId: '...',
  documentTitle: '...',
  price: 1000
});
const { id: purchaseId } = purchase.data.data;

// Step 2: Pay with M-Pesa
await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount: price,
  purchaseId,
  paymentType: 'MARKETPLACE_PURCHASE'
});
```

**4. Subscription Payment**
```typescript
// Step 1: Create subscription
const subscription = await axiosInstance.post('/subscriptions/create', {
  tier: 'PRO',
  billingCycle: 'MONTHLY'
});
const { subscriptionId, amount } = subscription.data.data;

// Step 2: Pay with M-Pesa
await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount,
  subscriptionId,
  paymentType: 'SUBSCRIPTION'
});
```

### 🚫 DO NOT:
- Create new M-Pesa payment endpoints
- Duplicate payment initiation logic
- Use different callback URLs per service
- Implement separate STK Push logic
- Create service-specific payment controllers
- **Pay before creating the resource** (always create first!)
- Navigate to old `/payment/:id` pages (use M-Pesa directly)

### ✅ DO:
- Always use `/api/payments/mpesa/initiate`
- **Create resource FIRST** (booking, review, purchase, subscription)
- Get resourceId and amount from creation response
- Use correct parameter (bookingId, purchaseId, reviewId, subscriptionId)
- Poll unified status endpoint
- Let callback handler update resource status
- Prompt user for phone number before payment

### Files to Reference
- **Controller**: `backend/src/controllers/mpesaController.ts`
- **Service**: `backend/src/services/mpesaDarajaService.ts`
- **Routes**: `backend/src/routes/mpesaRoutes.ts`
- **Frontend Examples**:
  - `frontend/src/pages/PaymentPage.tsx`
  - `frontend/src/pages/DocumentsPage.tsx`
  - `frontend/src/components/SubscriptionDashboard.tsx`
  - `frontend/src/components/documents/ServiceSelectionModal.tsx` (document review pricing)

### Document Review Service Selection

**File**: `frontend/src/components/documents/ServiceSelectionModal.tsx`

**CRITICAL SPECIFICATIONS**:
- **2-step flow ONLY**: Service Selection → Review (NO urgency step)
- **All prices in KES**: AI Review (500), Certification (2,000), Combo (2,200)
- **All delivery times**: "Within 2 hours" for ALL services
- **Payment button**: "Proceed to M-Pesa Payment" (not generic "Proceed to Payment")
- **Uses unified M-Pesa endpoint**: `/api/payments/mpesa/initiate`

```typescript
// REQUIRED SERVICE TIERS (KES PRICING)
const serviceTiers: ServiceTier[] = [
  {
    id: 'AI_ONLY',
    name: 'AI Review Only',
    price: 500,  // KES, not USD
    estimatedTime: 'Within 2 hours'
  },
  {
    id: 'CERTIFICATION',
    name: 'Lawyer Certification',
    price: 2000,
    estimatedTime: 'Within 2 hours',
    recommended: true
  },
  {
    id: 'AI_PLUS_CERTIFICATION',
    name: 'AI + Certification',
    price: 2200,
    estimatedTime: 'Within 2 hours'
  }
];

// NO URGENCY LEVELS - Removed completely
// Always return urgencyLevel: 'STANDARD' in onConfirm callback
```

**Why Critical**:
- Urgency multipliers were removed per business requirements
- All services guaranteed 2-hour delivery
- Currency must be KES for Kenya market
- Prevents price confusion with USD conversion

### Service Request Commission Model

**File**: `frontend/src/pages/ServiceRequestPage.tsx`

**CRITICAL BUSINESS MODEL**:
- **NO fee estimation** - Platform does NOT calculate or suggest fees
- **Lawyers quote directly** - Based on case details provided by user
- **Commission-based revenue** - Platform earns 20% commission from 30% upfront payment
- **Three-tier payment split**:
  1. User pays KES 500 commitment fee upfront (to get 3 quotes)
  2. User pays 30% of quoted amount after selecting lawyer
  3. From 30% payment: Platform takes 20% commission, Lawyer receives 10% escrow to start case
  4. Remaining 70% balance handled between user and lawyer (offline or through system)

**Payment Flow**:
```typescript
// STEP 1: User pays KES 500 commitment fee
const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount: 500,
  paymentType: 'SERVICE_REQUEST_COMMITMENT'
});

// STEP 2: Create service request with payment ID
const requestData = {
  ...formData, // Context fields only (no monetary values)
  commitmentFeeTxId: paymentId,
  commitmentFeeAmount: 500
};
const requestResponse = await axiosInstance.post('/service-requests', requestData);

// STEP 3: Wait 24-48 hours for 3 lawyer quotes

// STEP 4: User selects preferred lawyer and pays 30% upfront
const quotedAmount = selectedQuote.amount;
const upfrontAmount = Math.round(quotedAmount * 0.30); // 30% of quoted fee

const agreedFeePayment = await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254...',
  amount: upfrontAmount, // 30% of quoted amount
  serviceRequestId: requestId,
  quoteId: selectedQuoteId,
  paymentType: 'SERVICE_REQUEST_PAYMENT'
});
// Backend automatically splits 30% payment:
// - Platform: 20% commission (66.67% of 30%)
// - Lawyer escrow: 10% to start case (33.33% of 30%)
// - Balance 70%: User pays lawyer directly or through system later
```

**Form Fields - Context Only (NO Monetary Fields)**:
```typescript
// Property Law
propertyLocation: string
titleType: string
hasDisputes: boolean

// Corporate Law
companyType: string
numberOfEmployees: number
industry: string

// Debt Recovery
debtType: string
debtAge: string
hasContract: boolean

// Business Registration
businessType: string
numberOfDirectors: number
hasNameReserved: boolean

// Estate Planning
numberOfBeneficiaries: number
hasInternationalAssets: boolean
hasBusiness: boolean

// Employment Law
includesNonCompete: boolean

// Family Law
hasProperty: boolean
needsCustody: boolean
```

**Backend Changes**:
```typescript
// backend/src/controllers/serviceRequestController.ts

// REMOVED:
// - calculateServiceFee import
// - estimatedFee field
// - tier calculation
// - LawyerTier filtering

// ADDED:
// - Match ALL verified lawyers (filter by specialization only)
// - Lawyers self-select based on their expertise
// - No fee estimation in service request creation
// - Commitment fee validation only
```

**DO NOT**:
- ❌ Calculate or estimate fees for users
- ❌ Add monetary value fields (transactionValue, dealValue, claimAmount, complexity)
- ❌ Filter lawyers by tier (all verified lawyers can quote)
- ❌ Display estimated fees in UI
- ❌ Import or use `serviceFeeCalculator.ts` utility

**DO**:
- ✅ Collect case context only (location, type, has disputes, etc.)
- ✅ Charge KES 500 commitment fee upfront
- ✅ Allow lawyers to quote their own fees
- ✅ Calculate 30% upfront from quoted amount
- ✅ Split 30% payment: 20% platform commission, 10% lawyer escrow
- ✅ Display "How It Works" info box explaining payment model
- ✅ Alert user they'll receive "3 quotes within 24-48 hours"
- ✅ Show clear breakdown: "Pay 30% now, 70% balance later"

**Files to Reference**:
- **Frontend**: `frontend/src/pages/ServiceRequestPage.tsx` (commission model UI)
- **Backend**: `backend/src/controllers/serviceRequestController.ts` (no fee calc)
- **Deprecated**: `frontend/src/utils/serviceFeeCalculator.ts` (DO NOT USE)

**Why Critical**:
- Platform revenue depends on commission (20% of 30% upfront), not connection fees
- Lawyers get immediate 10% escrow to start case work (from 30% payment)
- Users pay only 30% upfront, reducing financial risk for long cases
- Lawyers have flexibility to price based on their expertise
- Users get competitive quotes instead of platform estimates
- Transparent 20%/10% split model builds trust
- Remaining 70% balance gives flexibility for milestone-based payments

### Complete Service Delivery Flow - End to End

**CRITICAL**: This is the complete implementation flow from service request to lawyer-client connection.

#### Phase 1: Service Request Submission (Client Side)
**Page**: `frontend/src/pages/ServiceRequestPage.tsx`

1. **Client submits service request**:
   - Fills service details (category, title, description, timeline)
   - Provides context fields (property location, company type, debt type, etc.)
   - **NO monetary value fields** - lawyers will quote
   - Provides contact info (phone, email)

2. **Commitment fee payment (KES 500)**:
   ```typescript
   // Prompt for M-Pesa phone number
   const phoneNumber = prompt('Enter M-Pesa phone number (254XXXXXXXXX)');
   
   // Step 1: Initiate M-Pesa payment
   const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
     phoneNumber,
     amount: 500,
     paymentType: 'SERVICE_REQUEST_COMMITMENT'
   });
   
   const { paymentId } = paymentResponse.data.data;
   
   // Step 2: Create service request with payment ID
   const requestData = {
     ...formData,
     commitmentFeeTxId: paymentId,
     commitmentFeeAmount: 500
   };
   
   await axiosInstance.post('/service-requests', requestData);
   ```

3. **Backend processing** (`backend/src/controllers/serviceRequestController.ts`):
   - Creates service request with status: `PENDING`
   - Matches ALL verified lawyers (by specialization only, NO tier filtering)
   - Sends notifications to matched lawyers via email/SMS
   - Returns success message: "You will receive 3 quotes within 24-48 hours"

#### Phase 2: Lawyer Quote Submission (Lawyer Side)
**Page**: `frontend/src/pages/LawyerQuoteSubmissionPage.tsx`

1. **Lawyer views service requests**:
   - Navigate to `/lawyer/service-requests`
   - See list of service requests matching their specializations
   - Click to view full request details

2. **Submit quote (FREE - no connection fees)**:
   ```typescript
   const quoteData = {
     proposedFee: Number,        // Lawyer's quoted fee (KES)
     proposedTimeline: string,   // e.g., "2-3 weeks"
     approach: string,           // How they'll handle the case
     offersMilestones: boolean,  // Optional payment stages
     milestones: [               // If offersMilestones = true
       {
         stage: string,          // "Initial Review"
         percentage: number,     // 25
         description: string     // "What will be delivered"
       }
     ]
   };
   
   await axiosInstance.post(`/service-requests/${id}/quotes`, quoteData);
   ```

3. **UI features**:
   - Shows case details (service type, description, context fields)
   - **Real-time 30% calculator**: "Client pays 30% upfront: KES X (You receive 10% = KES Y to start case)"
   - Milestone builder with validation (must total 100%)
   - FREE submission banner: "Submit your best proposal. If selected, client pays 30% upfront"

#### Phase 3: Quote Comparison & Selection (Client Side)
**Page**: `frontend/src/pages/QuoteComparisonPage.tsx`

1. **Client compares quotes**:
   - Navigate to `/service-requests/${id}/quotes`
   - See up to 3 quotes side-by-side
   - View lawyer profiles (rating, experience, specializations)
   - Sort by price, rating, or timeline

2. **Select lawyer & pay 30% upfront**:
   ```typescript
   const handleSelectLawyer = async (quoteId: string) => {
     const upfrontAmount = Math.round(selectedQuote.proposedFee * 0.3);
     
     // Confirmation dialog shows payment breakdown
     const confirmMessage = `Pay 30% upfront via M-Pesa?\n\n` +
       `Total Quote: KES ${selectedQuote.proposedFee.toLocaleString()}\n` +
       `30% Payment: KES ${upfrontAmount.toLocaleString()}\n\n` +
       `Split:\n` +
       `• Platform (20%): KES ${platformCommission.toLocaleString()}\n` +
       `• Lawyer Escrow (10%): KES ${lawyerEscrow.toLocaleString()}\n\n` +
       `Remaining 70% paid as case progresses.`;
     
     if (!confirm(confirmMessage)) return;
     
     // Prompt for M-Pesa phone
     const phoneNumber = prompt('Enter M-Pesa phone number (254XXXXXXXXX)');
     
     // Initiate 30% payment
     const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
       phoneNumber,
       amount: upfrontAmount,
       serviceRequestId: id,
       quoteId,
       paymentType: 'SERVICE_REQUEST_PAYMENT'
     });
     
     // Poll for payment status every 3 seconds
     const pollInterval = setInterval(async () => {
       const status = await axiosInstance.get(`/payments/mpesa/status/${paymentId}`);
       if (status.data.data.status === 'COMPLETED') {
         clearInterval(pollInterval);
         // Show success screen
       }
     }, 3000);
   };
   ```

3. **UI features**:
   - Blue info box: "30% Upfront Payment: KES X,XXX"
   - Payment breakdown: "Platform: 20% • Lawyer Escrow: 10% • Balance: 70%"
   - Button: "Pay 30% & Select Lawyer"
   - During payment: "Processing M-Pesa Payment..."

#### Phase 4: Payment Processing & Auto-Connection (Backend)
**File**: `backend/src/controllers/mpesaController.ts` (callback handler)

1. **M-Pesa callback receives payment confirmation**:
   ```typescript
   if (metadata?.resourceType === 'SERVICE_REQUEST_PAYMENT') {
     const paidAmount = payment.amount; // 30% of quoted amount
     
     // Calculate splits
     const platformCommission = Math.round(paidAmount * 0.6667); // 20% of total
     const lawyerEscrow = Math.round(paidAmount * 0.3333);       // 10% of total
     
     // Update service request status
     await prisma.serviceRequest.update({
       where: { id: metadata.serviceRequestId },
       data: { 
         status: 'IN_PROGRESS',
         selectedLawyerId: quote.lawyerId
       }
     });
     
     // Mark quote as selected
     await prisma.lawyerQuote.update({
       where: { id: metadata.quoteId },
       data: { isSelected: true }
     });
     
     // Credit lawyer escrow to wallet
     await prisma.lawyerWallet.update({
       where: { id: quote.lawyer.lawyerProfile.wallet.id },
       data: { 
         balance: currentBalance + lawyerEscrow,
         availableBalance: currentBalance + lawyerEscrow
       }
     });
     
     // 🔥 AUTO-CREATE CONVERSATION THREAD
     const existingConversation = await prisma.conversation.findFirst({
       where: {
         participants: {
           every: { userId: { in: [serviceRequest.userId, quote.lawyerId] } }
         }
       }
     });
     
     if (!existingConversation) {
       await prisma.conversation.create({
         data: {
           participants: {
             create: [
               { userId: serviceRequest.userId },
               { userId: quote.lawyerId }
             ]
           },
           messages: {
             create: {
               senderId: quote.lawyerId,
               content: `Hello! Thank you for selecting my quote. I'm ready to start working on your ${serviceRequest.serviceCategory} case. The estimated timeline is ${quote.proposedTimeline}. Feel free to ask any questions!`,
               isRead: false
             }
           }
         }
       });
     }
   }
   ```

2. **What happens automatically**:
   - Service request status → `IN_PROGRESS`
   - Quote marked as selected
   - Platform earns 20% commission (66.67% of 30%)
   - Lawyer receives 10% escrow (33.33% of 30%) in wallet
   - **Conversation thread created between client and lawyer**
   - **Welcome message sent from lawyer to client**

#### Phase 5: Success & Connection (Client Side)
**Page**: `frontend/src/pages/QuoteComparisonPage.tsx` (success screen)

1. **Success screen displays**:
   ```typescript
   if (selectedLawyer) {
     return (
       <div className="success-screen">
         <CheckCircle />
         <h1>Lawyer Selected!</h1>
         
         {/* Lawyer contact info */}
         <div className="lawyer-contact">
           <p>Name: {selectedLawyer.name}</p>
           <p>Phone: {selectedLawyer.phone}</p>
           <p>Email: {selectedLawyer.email}</p>
         </div>
         
         {/* Next steps */}
         <div className="next-steps">
           <ol>
             <li>Check your Messages inbox - the lawyer has sent you a message</li>
             <li>Discuss case details and timeline</li>
             <li>Lawyer proceeds with your case</li>
             <li>Pay remaining 70% balance as case progresses</li>
           </ol>
         </div>
         
         {/* Action buttons */}
         <button onClick={() => navigate('/messages')}>
           Open Messages
         </button>
         <button onClick={() => navigate('/dashboard')}>
           Back to Dashboard
         </button>
       </div>
     );
   }
   ```

2. **User can now**:
   - Click "Open Messages" to chat with lawyer
   - View conversation thread in Messages inbox
   - See lawyer's welcome message
   - Communicate directly about case details

#### Phase 6: Ongoing Communication (Both Sides)
**Page**: `frontend/src/pages/MessagesPage.tsx`

1. **Client view**:
   - Navigate to `/messages`
   - See conversation with selected lawyer
   - Read lawyer's welcome message
   - Send/receive messages in real-time

2. **Lawyer view**:
   - Navigate to `/messages`
   - See conversation with client
   - Discuss case details, timelines, deliverables
   - Update client on progress

3. **Messages are linked to**:
   - Service request ID (for context)
   - Quote ID (for fee reference)
   - Payment records (for tracking)

#### Navigation Routes Summary

**Client Routes**:
- `/service-request` - Submit new service request
- `/service-requests/${id}/quotes` - Compare lawyer quotes
- `/messages` - Chat with selected lawyer
- `/dashboard` - View active cases

**Lawyer Routes**:
- `/lawyer/service-requests` - View available service requests
- `/service-requests/${id}/quote` - Submit quote for request
- `/document-reviews` - Document certification dashboard
- `/lawyer/consultations` - Consultation bookings
- `/messages` - Chat with clients
- `/lawyer/wallet` - View escrow balance & withdraw funds
- `/lawyer/dashboard` - Overview of active cases

**Critical Navigation Links** (Lawyer Dashboard):
- **Consultations Card** → `/lawyer/consultations`
- **Documents Card** → `/document-reviews` 
- **Services Card** → `/lawyer/service-requests`
- **Wallet Card** → `/lawyer/wallet`

#### Payment Flow Checklist

When implementing service request payments:

1. ✅ Create service request FIRST (returns `serviceRequestId`)
2. ✅ Pay KES 500 commitment fee via M-Pesa
3. ✅ Lawyers submit quotes (FREE, no connection fees)
4. ✅ Client selects quote (returns `quoteId`)
5. ✅ Calculate 30% of quoted amount
6. ✅ Pay 30% via M-Pesa with `serviceRequestId` + `quoteId`
7. ✅ M-Pesa callback automatically:
   - Updates service request status to `IN_PROGRESS`
   - Marks quote as selected
   - Credits 10% escrow to lawyer wallet
   - **Creates conversation thread**
   - **Sends welcome message**
8. ✅ Direct user to Messages inbox
9. ✅ Lawyer and client communicate via messaging system

#### Files Reference Map

**Service Request Flow**:
- `frontend/src/pages/ServiceRequestPage.tsx` - Client submission
- `backend/src/controllers/serviceRequestController.ts` - Create request, match lawyers
- `frontend/src/pages/LawyerQuoteSubmissionPage.tsx` - Lawyer quote submission
- `backend/src/controllers/serviceRequestController.ts` - Handle quote submission
- `frontend/src/pages/QuoteComparisonPage.tsx` - Client quote comparison & payment
- `backend/src/controllers/mpesaController.ts` - Payment processing & conversation creation
- `frontend/src/pages/MessagesPage.tsx` - Client-lawyer communication
- `backend/src/controllers/chatController.ts` - Message handling

**Key Backend Models** (Prisma):
- `ServiceRequest` - Service request details
- `LawyerQuote` - Lawyer proposals
- `Payment` - M-Pesa payment records
- `LawyerWallet` - Lawyer escrow balances
- `Conversation` - Message threads
- `Message` - Individual messages

## Critical UI/UX Features - DO NOT DELETE

### Landing Page Features
The landing page (`frontend/src/pages/LandingPage.tsx`) contains critical service cards that must be preserved:

#### Case Analysis & Review Button
**Location**: Main services grid on landing page  
**Purpose**: Primary entry point for document review services  
**Behavior**: Smart authentication-aware routing

```typescript
// REQUIRED IMPORTS
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// REQUIRED HANDLER
const handleDocumentReviewClick = (e: React.MouseEvent) => {
  e.preventDefault();
  if (isAuthenticated) {
    navigate('/documents');
  } else {
    navigate('/login', { state: { from: '/documents' } });
  }
};

// REQUIRED CARD (in services grid)
<a 
  href="/documents" 
  onClick={handleDocumentReviewClick}
  className="bg-white rounded border border-slate-300 p-5 hover:shadow-lg transition"
>
  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
    <FileText className="w-6 h-6 text-amber-600" />
  </div>
  <h3 className="text-xl font-semibold mb-2 text-slate-900">Case Analysis & Review</h3>
  <p className="text-slate-600 mb-4">
    Upload documents for AI analysis (KES 500) or lawyer certification (KES 2,000+). 
    Comprehensive legal review with actionable insights.
  </p>
  <span className="text-amber-600 font-medium inline-flex items-center">
    {isAuthenticated ? 'Upload document' : 'Get started'}
    <ArrowRight className="w-4 h-4 ml-1" />
  </span>
</a>
```

**Why Critical**: 
- Primary revenue driver for document review services
- Entry point for 4 payment types (AI review, certification, combo, service request)
- Seamless UX with auth-based routing

### Role-Based Navigation

#### Lawyer Sidebar Navigation
**File**: `frontend/src/components/layout/Sidebar.tsx`  
**CRITICAL**: Lawyers see different navigation than clients

```typescript
// LAWYER-SPECIFIC NAVIGATION (role === 'LAWYER')
{
  name: 'Document Reviews',  // NOT "Documents"
  href: '/document-reviews',  // NOT "/documents"
  icon: FileText
}
```

**Rationale**: 
- Lawyers REVIEW documents (see `/document-reviews` dashboard)
- Clients UPLOAD documents (see `/documents` upload page)
- Same button label would cause confusion

#### Role-Aware Page Display

**Files with Role-Based Logic**:
1. `frontend/src/pages/ConsultationsPage.tsx`
2. `frontend/src/pages/AppointmentsPage.tsx`
3. `frontend/src/pages/MessagesPage.tsx`

**Pattern to Follow**:
```typescript
// ALWAYS check user role
const { user } = useAuthStore();
const isLawyer = user?.role === 'LAWYER';

// Show different data based on role
interface Consultation {
  lawyerName?: string;  // For clients to see
  clientName?: string;  // For lawyers to see
  // ... other fields
}

// Render conditionally
<p className="text-sm text-slate-600">
  {isLawyer ? consultation.clientName : consultation.lawyerName}
</p>
```

**Why Critical**:
- Lawyers need to see CLIENT information (who they're helping)
- Clients need to see LAWYER information (who's helping them)
- Same component serves both user types

### Lawyer Profile Verification

**File**: `frontend/src/components/dashboards/LawyerDashboard.tsx`

**CRITICAL CHECK**:
```typescript
// Accept BOTH verification statuses
const isVerified = 
  profile?.verificationStatus === 'VERIFIED' || 
  profile?.verificationStatus === 'APPROVED';

// Fallback on error to prevent UI blocking
if (error) {
  console.error('Error fetching lawyer profile:', error);
  return true; // Assume verified to prevent blocking UI
}
```

**Why Critical**:
- Database uses both `VERIFIED` and `APPROVED` statuses
- Error should not block verified lawyers from dashboard
- Prevents "Profile Setup Required" false positives

## Authentication & State Management

### Zustand Store Usage
**File**: `frontend/src/store/authStore.ts`

**Critical Exports**:
- `isAuthenticated`: Boolean flag for auth status
- `user`: Current user object with role information
- `token`: JWT token for API requests

**Usage Pattern**:
```typescript
import { useAuthStore } from '../store/authStore';

const { isAuthenticated, user, token } = useAuthStore();
const isLawyer = user?.role === 'LAWYER';
```

### API Client Configuration
**File**: `frontend/src/services/api.ts`

**Critical**: Use `axiosInstance` for authenticated requests
```typescript
import axiosInstance from '../services/api';

// Automatically includes JWT token
const response = await axiosInstance.post('/api/endpoint', data);
```

## Payment Implementation Checklist

When adding a NEW payment feature:

1. ✅ Create resource endpoint (e.g., `/api/bookings/create`)
2. ✅ Return `resourceId` and `amount` from creation
3. ✅ Call `/api/payments/mpesa/initiate` with correct ID parameter
4. ✅ Poll `/api/payments/mpesa/status/:paymentId`
5. ✅ Update resource status on payment completion
6. ✅ Handle payment in callback (`mpesaController.handleCallback`)

**DO NOT**:
- ❌ Create new payment endpoints
- ❌ Duplicate STK Push logic
- ❌ Add new callback URLs
- ❌ Create payment-specific controllers
- ❌ Leave orphaned code blocks outside functions
- ❌ Use `await` outside async functions

## Development Rules

### Code Quality Checks
1. **BEFORE editing ANY file:**
   - Read the FULL file to understand context
   - Search for similar patterns in codebase
   - Check imports at top of file (especially `axiosInstance` from `../services/api`)
2. **AFTER editing ANY file:**
   - Verify no orphaned code blocks (dangling `try/catch`, loose statements)
   - Check all `await` statements are inside `async` functions
   - Confirm TypeScript compiles without errors
   - Test build locally if possible (`npm run build`)

### Common Anti-Patterns to AVOID
```typescript
// ❌ WRONG: Orphaned async code outside function
  try {
    const data = await someApi();
  } catch (error) {
    console.error(error);
  }

// ✅ CORRECT: Inside async function
const handleSubmit = async () => {
  try {
    const data = await someApi();
  } catch (error) {
    console.error(error);
  }
};

// ❌ WRONG: Dynamic import with await outside async context
const axiosInstance = (await import('../lib/axios')).default;

// ✅ CORRECT: Static import at top of file
import axiosInstance from '../services/api';
```

### UI Feature Protection
1. **NEVER** delete buttons or cards without explicit user request
2. **ALWAYS** check existing navigation before modifying
3. **PRESERVE** role-based logic when updating pages
4. **VERIFY** authentication-aware components maintain smart routing

### Code Modification Safety
1. **READ** the full file before making changes
2. **SEARCH** for similar patterns in codebase
3. **VALIDATE** TypeScript compilation after edits
4. **TEST** role-based features for both user types

### Architecture Consistency
1. **ONE** M-Pesa endpoint for all payments
2. **ROLE-AWARE** navigation and data display
3. **AUTH-AWARE** routing and UI elements
4. **TYPE-SAFE** across frontend/backend boundary

This project emphasizes type safety, consistent patterns, maintainable architecture, and user role-based experiences across the full stack.

- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

Documentation is complete: README.md and copilot-instructions.md are up to date. Monorepo setup is finished and ready for development.