# Wakili Pro

Modern full-stack web application built with agile development practices, featuring React frontend, Node.js backend, and comprehensive development tooling.

## 🏗️ Architecture

```
wakili-pro/
├── frontend/           # React.js client application
├── backend/           # Node.js/Express API server
├── shared/            # Common utilities and types
├── docs/              # Project documentation
├── tests/             # Integration and E2E tests
└── .github/           # CI/CD workflows and templates
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL (for production)

### Installation

```bash
# Install all dependencies
npm run setup

# Start development servers
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📋 Available Scripts

### Root Level Commands
```bash
npm run setup              # Install all dependencies
npm run dev               # Start both frontend and backend
npm run build             # Production build
npm run test              # Run all tests
npm run lint              # Lint all packages
npm run clean             # Clean node_modules
```

### Package-specific Commands
```bash
# Frontend
cd frontend
npm run dev               # Vite dev server
npm run build             # Production build
npm run test              # Unit tests with Vitest
npm run lint              # ESLint

# Backend  
cd backend
npm run dev               # Development server with watch
npm run build             # TypeScript compilation
npm run test              # Jest tests
npm run db:migrate        # Run database migrations

# Shared
cd shared
npm run build             # Build shared types/utilities
```

## 🧪 Testing Strategy

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Supertest for API endpoints  
- **E2E Tests**: Cypress for critical user journeys
- **Coverage**: 80% minimum requirement

```bash
npm run test              # All tests
npm run test:coverage     # With coverage report
npm run test:e2e         # End-to-end tests
```

## 🎯 Development Workflow

### Agile Process
- **Sprint Duration**: 2 weeks
- **Branch Naming**: `feature/JIRA-123-feature-name`
- **Code Review**: 2 approvals required
- **Testing**: TDD approach

### Code Conventions
- **TypeScript**: Strict mode enabled
- **React**: Functional components with hooks
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS
- **API Design**: RESTful with OpenAPI docs

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Development Tools
- **Monorepo**: npm workspaces
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

## 🗄️ Database Setup

```bash
# Copy environment variables
cp .env.example .env

# Update database credentials in .env
# Then run migrations
cd backend
npm run db:migrate
npm run db:seed
```

## 🚦 Environment Configuration

Create `.env` files based on `.env.example`:

```bash
# Required environment variables
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/wakili_pro
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
```

## 📈 Deployment

### Staging
```bash
npm run deploy:staging
```

### Production  
```bash
npm run build
npm run deploy:production
```

## 🤖 AI Agent Guidelines

This project includes comprehensive AI agent instructions in `.github/copilot-instructions.md` to guide automated development assistance.

Key conventions for AI agents:
- Follow established file structure and naming patterns
- Run tests after making changes
- Update documentation when modifying APIs
- Implement proper error boundaries and loading states
- Use TypeScript strictly with proper type definitions

## 📚 Documentation

- API Documentation: `/backend/docs/api.md`
- Component Docs: `/frontend/src/components/README.md`
- Database Schema: `/backend/prisma/schema.prisma`
- Deployment Guide: `/docs/deployment.md`

## 🤝 Contributing

1. Clone the repository
2. Create feature branch: `git checkout -b feature/JIRA-123-feature-name`
3. Make changes following code conventions
4. Write/update tests
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using modern development practices and agile methodologies.**