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

#### Supported Payment Types (8 Services)
All payments use the **SAME endpoint** with different parameters:

1. **Legal Consultations** → `bookingId`
2. **Marketplace Documents** → `purchaseId`
3. **AI Document Review** → `reviewId` + reviewType='AI_ONLY' (KES 500)
4. **Lawyer Certification** → `reviewId` + reviewType='CERTIFICATION' (KES 2,000)
5. **AI + Certification** → `reviewId` + reviewType='AI_PLUS_CERTIFICATION' (KES 2,200)
6. **Service Request Fee** → `reviewId` (commitment fee)
7. **Lawyer Subscription LITE** → `subscriptionId` (KES 2,999)
8. **Lawyer Subscription PRO** → `subscriptionId` (KES 4,999)

**CRITICAL PRICING & DELIVERY**:
- **ALL prices in Kenyan Shillings (KES)** - NEVER use USD ($)
- **ALL document reviews/certifications delivered within 2 hours**
- **NO urgency levels** - standard delivery for all services

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
// Step 1: Create resource (booking, subscription, etc.)
const createResponse = await axiosInstance.post('/api/resource/create', data);
const { resourceId, amount } = createResponse.data.data;

// Step 2: Initiate M-Pesa payment (UNIFIED ENDPOINT)
const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
  phoneNumber: '254712345678',
  amount: amount,
  [resourceType + 'Id']: resourceId, // bookingId, purchaseId, etc.
  paymentType: 'RESOURCE_TYPE'
});

// Step 3: Poll for payment status
const { paymentId } = paymentResponse.data.data;
const pollInterval = setInterval(async () => {
  const status = await axiosInstance.get(`/payments/mpesa/status/${paymentId}`);
  if (status.data.data.status === 'COMPLETED') {
    clearInterval(pollInterval);
    // Payment successful!
  }
}, 3000);
```

### 🚫 DO NOT:
- Create new M-Pesa payment endpoints
- Duplicate payment initiation logic
- Use different callback URLs per service
- Implement separate STK Push logic
- Create service-specific payment controllers

### ✅ DO:
- Always use `/api/payments/mpesa/initiate`
- Add new payment types by extending mpesaController
- Use correct parameter (bookingId, purchaseId, reviewId, subscriptionId)
- Poll unified status endpoint
- Let callback handler update resource status

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

## Development Rules

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