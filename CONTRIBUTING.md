# Contributing to Carzino Autos Vehicle Management System

Thank you for your interest in contributing to our project! This document provides guidelines and information for contributors.

## 📋 **Table of Contents**

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Project Structure](#project-structure)

## 🤝 **Code of Conduct**

This project adheres to a code of conduct that we expect all contributors to follow:

- **Be respectful** and inclusive in all interactions
- **Be collaborative** and help others learn and grow
- **Be constructive** when providing feedback
- **Focus on the code**, not the person

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js 18 or higher
- PNPM 8 or higher
- MySQL 8.0 or higher
- Git

### **Fork and Clone**

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/builder-NEW.git
cd builder-NEW

# Add the original repository as upstream
git remote add upstream https://github.com/carzinoautos-setup/builder-NEW.git
```

## 🛠 **Development Setup**

### **Install Dependencies**

```bash
# Install all dependencies
pnpm install

# Verify installation
pnpm typecheck
```

### **Environment Configuration**

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
# Required: VITE_WP_URL for WordPress integration
# Required: Database credentials for MySQL features
```

### **Database Setup**

```bash
# Optional: Generate sample data for development
pnpm tsx server/scripts/generateSampleData.ts
```

### **Start Development Server**

```bash
# Start both client and server in development mode
pnpm dev

# Access the application at http://localhost:8080
```

## 🔄 **Making Changes**

### **Create a Branch**

```bash
# Always create a new branch for your changes
git checkout -b feature/your-feature-name

# Use descriptive branch names:
# feature/payment-calculator-improvements
# fix/mobile-filter-overlay
# docs/api-documentation-update
```

### **Branch Naming Convention**

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Build process or auxiliary tool changes

## 🧪 **Testing**

### **Run Tests**

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run type checking
pnpm typecheck
```

### **Test Requirements**

- All new features must include tests
- Bug fixes should include regression tests
- Maintain or improve test coverage
- All tests must pass before submitting PR

### **Manual Testing**

Test your changes across different scenarios:

- **Payment Calculator**: Test with various APR rates, loan terms
- **Vehicle Filtering**: Test with different filter combinations
- **Mobile Interface**: Test on different screen sizes
- **WordPress Integration**: Test with sample WordPress data
- **Error Handling**: Test with invalid inputs and network errors

## 📝 **Submitting Changes**

### **Commit Guidelines**

Use conventional commit messages:

```bash
# Format: type(scope): description
git commit -m "feat(payments): add bulk payment calculation API"
git commit -m "fix(mobile): resolve filter overlay positioning issue"
git commit -m "docs(readme): update installation instructions"
```

**Commit Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### **Pull Request Process**

1. **Update your branch**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**

   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Go to GitHub and create a PR from your branch
   - Use the PR template (will be created automatically)
   - Provide detailed description of changes
   - Link any related issues

4. **PR Requirements**
   - [ ] All tests pass
   - [ ] Code follows style guidelines
   - [ ] Documentation updated (if needed)
   - [ ] No breaking changes (or clearly documented)
   - [ ] Reviewed by at least one maintainer

## 🎨 **Style Guidelines**

### **TypeScript/JavaScript**

```typescript
// Use TypeScript for all new code
interface VehicleData {
  id: number;
  make: string;
  model: string;
  price: number;
}

// Use descriptive variable names
const calculateMonthlyPayment = (params: PaymentParams): number => {
  // Implementation
};

// Use JSDoc for complex functions
/**
 * Calculate monthly payment using amortization formula
 * @param principal - Loan amount after down payment
 * @param rate - Monthly interest rate (annual rate / 12)
 * @param term - Loan term in months
 * @returns Monthly payment amount
 */
function calculatePayment(
  principal: number,
  rate: number,
  term: number,
): number {
  // Implementation
}
```

### **React Components**

```typescript
// Use functional components with TypeScript
interface VehicleCardProps {
  vehicle: Vehicle;
  onFavorite: (id: number) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onFavorite,
}) => {
  // Component implementation
};

// Use meaningful prop names and types
// Include error boundaries for complex components
// Use React.memo for performance when appropriate
```

### **CSS/Styling**

```css
/* Use TailwindCSS classes primarily */
<div className="bg-white rounded-lg shadow-md p-6">

/* For custom styles, use descriptive class names */
.carzino-vehicle-card {
  /* Custom styles when Tailwind isn't sufficient */
}

/* Follow mobile-first responsive design */
<div className="w-full md:w-1/2 lg:w-1/3">
```

### **Code Formatting**

```bash
# Format code before committing
pnpm format.fix

# Prettier configuration is enforced
# ESLint rules must be followed
```

## 📁 **Project Structure**

### **Adding New Features**

#### **Client-side Components**

```
client/
├── components/
│   ├── ui/           # Base UI components (buttons, inputs, etc.)
│   └── YourComponent.tsx  # Feature-specific components
├── hooks/
│   └── useYourHook.ts     # Custom React hooks
├── lib/
│   └── yourUtility.ts     # Utility functions
└── pages/
    └── YourPage.tsx       # Route components
```

#### **Server-side APIs**

```
server/
├── routes/
│   └── yourApi.ts         # API route handlers
├── services/
│   └── yourService.ts     # Business logic
└── types/
    └── yourTypes.ts       # TypeScript definitions
```

### **File Naming Conventions**

- **React Components**: PascalCase (`VehicleCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`usePaymentFilters.ts`)
- **Utilities**: camelCase (`paymentCalculator.ts`)
- **API Routes**: camelCase (`vehicles.ts`)
- **Types**: camelCase (`vehicle.ts`)

## 🔧 **Development Tools**

### **Useful Commands**

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Testing and Quality
pnpm test             # Run tests
pnpm typecheck        # TypeScript validation
pnpm format.fix       # Format code

# Database
pnpm tsx server/scripts/generateSampleData.ts  # Generate sample data
pnpm tsx server/scripts/testApi.ts             # Test API endpoints
```

### **Debugging**

- Use browser dev tools for frontend debugging
- Use `console.log` sparingly (prefer debugger statements)
- Check network tab for API issues
- Use React Developer Tools for component debugging

## 📚 **Resources**

### **Documentation**

- [README.md](./README.md) - Project overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history
- [API Documentation](./docs/api.md) - API reference
- [WordPress Integration](./WORDPRESS-INTEGRATION-SETUP.md) - WooCommerce setup

### **Tech Stack Documentation**

- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Express.js](https://expressjs.com/)

## ❓ **Questions and Support**

### **Getting Help**

1. **Check Documentation**: Start with README and docs folder
2. **Search Issues**: Look for existing GitHub issues
3. **Create Issue**: If you can't find an answer, create a new issue
4. **Ask Maintainers**: Tag maintainers in discussions

### **Common Issues**

- **Environment Variables**: Check Vite prefix requirements (`VITE_*`)
- **Database Connection**: Verify MySQL credentials and connection
- **WordPress Integration**: Ensure REST API is enabled
- **Build Errors**: Clear `node_modules` and reinstall dependencies

## 🎯 **Contribution Areas**

We welcome contributions in these areas:

### **High Priority**

- 🐛 Bug fixes and error handling improvements
- 📱 Mobile responsiveness enhancements
- 🔧 Performance optimizations
- 📝 Documentation improvements

### **Medium Priority**

- ✨ New filter options and search features
- 🎨 UI/UX improvements
- 🧪 Test coverage expansion
- 🔌 Integration enhancements

### **Future Features**

- 📊 Analytics and reporting
- 👥 User management system
- 🔄 Real-time data synchronization
- 📱 Mobile app development

## 📄 **License**

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Carzino Autos! 🚗✨**
