<<<<<<< HEAD
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
=======
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
>>>>>>> 23e2ce6 (Initial commit)
