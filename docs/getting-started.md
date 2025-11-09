# Getting Started with Wakili Pro

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **npm 9+**: Comes with Node.js
- **Git**: For version control
- **PostgreSQL**: For database (optional for initial development)

## Installation Steps

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd wakili-pro

# Install all dependencies
npm run setup
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, update:
# - JWT_SECRET
# - DATABASE_URL (if using database)
```

### 3. Start Development
```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Frontend at http://localhost:3000
- Backend at http://localhost:5000

## Development Workflow

### VS Code Tasks
Access via `Ctrl+Shift+P` → "Tasks: Run Task":
- **Install Dependencies**: Setup all packages
- **Start Development**: Launch dev servers
- **Build All**: Production build
- **Run Tests**: Execute test suites
- **Lint Code**: Check code quality

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/JIRA-123-feature-name

# Make changes, commit, push
git add .
git commit -m "feat: add feature description"
git push origin feature/JIRA-123-feature-name
```

### Testing
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run specific package tests
cd frontend && npm run test
cd backend && npm run test
```

## Project Structure

```
wakili-pro/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management
│   │   └── services/      # API services
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Helper functions
├── shared/                # Common code
│   ├── src/
│   │   ├── types/         # TypeScript interfaces
│   │   ├── schemas/       # Validation schemas
│   │   └── utils/         # Shared utilities
└── docs/                  # Documentation
```

## Troubleshooting

### Common Issues

**Node.js not found**
- Ensure Node.js is installed and in your PATH
- Restart VS Code after installation

**Port already in use**
- Check if another process is using ports 3000 or 5000
- Update port in package.json scripts if needed

**Package installation fails**
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

**TypeScript errors**
- Ensure all packages are installed
- Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Getting Help

1. Check documentation in `/docs`
2. Review existing issues in the repository
3. Ask team members in development channel
4. Create detailed issue with reproduction steps

## Next Steps

1. Explore the codebase structure
2. Run the test suite to understand functionality
3. Review coding conventions in README
4. Start with a small feature or bug fix
5. Follow the PR process for contributions

Happy coding! 🚀