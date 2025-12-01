# Wakili Pro - AI Agent Instructions

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
3. **AI Document Review** → `reviewId` + reviewType='AI_ONLY'
4. **Lawyer Certification** → `reviewId` + reviewType='CERTIFICATION'
5. **AI + Certification** → `reviewId` + reviewType='AI_PLUS_CERTIFICATION'
6. **Service Request Fee** → `reviewId` (commitment fee)
7. **Lawyer Subscription LITE** → `subscriptionId` (KES 2,999)
8. **Lawyer Subscription PRO** → `subscriptionId` (KES 4,999)

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

This project emphasizes type safety, consistent patterns, and maintainable architecture across the full stack.

- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions
- [x] Compile the Project
- [x] Create and Run Task
- [x] Launch the Project
- [x] Ensure Documentation is Complete

Documentation is complete: README.md and copilot-instructions.md are up to date. Monorepo setup is finished and ready for development.