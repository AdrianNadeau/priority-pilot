# QA Regression Testing Framework Documentation

## Overview

This comprehensive QA regression testing framework provides automated testing capabilities for the Priority Pilot application, ensuring code quality and preventing regressions during deployments.

## Framework Components

### 1. Test Directory Structure

```
tests/
├── unit/                     # Unit tests for individual components
├── integration/              # API and service integration tests
├── e2e/                     # End-to-end tests using Playwright
├── deployment/              # Deployment validation scripts
├── fixtures/                # Test data factories and fixtures
└── helpers/                 # Test utilities and setup helpers
```

### 2. Test Categories

#### Unit Tests (`tests/unit/`)

- **Purpose**: Test individual functions, controllers, and models in isolation
- **Files**:
  - `project.controller.test.js` - Project controller tests
  - `auth.middleware.test.js` - Authentication middleware tests
  - `models.test.js` - Database model tests
- **Features**: Mocking, isolated testing, fast execution

#### Integration Tests (`tests/integration/`)

- **Purpose**: Test API endpoints, database interactions, and service integrations
- **Files**:
  - `api.test.js` - API endpoint tests
  - `database.test.js` - Database integration tests
  - `performance.test.js` - Performance and load tests
- **Features**: Real database connections, API testing, performance monitoring

#### End-to-End Tests (`tests/e2e/`)

- **Purpose**: Test complete user workflows and UI interactions
- **Files**:
  - `auth.spec.js` - Authentication flow tests
  - `projects.spec.js` - Project management tests
  - `dashboard.spec.js` - Dashboard functionality tests
- **Features**: Browser automation, user workflow validation, cross-browser testing

#### Deployment Tests (`tests/deployment/`)

- **Purpose**: Validate deployments and monitor production health
- **Files**:
  - `pre-deployment.js` - Pre-deployment validation
  - `post-deployment.js` - Post-deployment verification
  - `regression.js` - Comprehensive regression testing
  - `performance-monitor.js` - Performance monitoring
- **Features**: Health checks, regression detection, performance monitoring

### 3. Test Data Management

#### Test Data Manager (`tests/helpers/testDataManager.js`)

- Database connection management
- Table cleanup and seeding
- Fixture loading and management
- Transaction support for test isolation

#### Test Data Factory (`tests/fixtures/testDataFactory.js`)

- Generates realistic test data
- Supports multiple scenarios (empty, minimal, large, etc.)
- Provides consistent data across tests
- Sequence management for unique IDs

#### Test Setup Helper (`tests/helpers/testSetup.js`)

- Global test environment setup
- Automated database preparation
- Test isolation and cleanup
- Scenario-based test data loading

## Configuration Files

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Playwright Configuration (`playwright.config.js`)

- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing
- Screenshot and video recording on failures
- Automatic test server startup

### Environment Configuration (`.env.test`)

- Test database settings
- External service mocking
- Test-specific configurations

## CI/CD Integration

### GitHub Actions Workflows

#### QA Regression Workflow (`.github/workflows/qa-regression.yml`)

- **Triggers**: Push to main/develop, pull requests, manual dispatch
- **Stages**:
  1. Backend unit and integration tests
  2. Frontend E2E tests
  3. Pre-deployment validation
  4. Deployment (placeholder)
  5. Post-deployment validation
  6. Rollback on failure

#### Nightly Regression (`.github/workflows/nightly-regression.yml`)

- **Schedule**: Daily at 2 AM UTC
- **Features**: Comprehensive regression testing across environments
- **Monitoring**: Performance tracking and alerting

## Usage Guide

### Running Tests Locally

```bash
# Install dependencies
npm ci

# Run all tests
npm test

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:deployment   # Deployment tests only

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Setting Up Test Environment

```bash
# Setup test database
npm run test:setup

# Reset test data
npm run test:reset

# Run full regression suite
npm run test:regression
```

### Deployment Testing

```bash
# Pre-deployment validation
node tests/deployment/pre-deployment.js

# Post-deployment validation
node tests/deployment/post-deployment.js

# Comprehensive regression testing
node tests/deployment/regression.js

# Performance monitoring
node tests/deployment/performance-monitor.js
```

## Test Data Scenarios

### Available Scenarios

- **empty**: No test data
- **minimal**: Single record per entity
- **default**: Standard test dataset
- **large**: Large dataset for performance testing
- **overdue_projects**: Projects past due date
- **high_priority_projects**: Critical priority projects

### Using Test Scenarios

```javascript
const TestSetupHelper = require("./tests/helpers/testSetup");
const helper = new TestSetupHelper();

// Setup specific scenario
await helper.setupScenario("large");

// Generate custom data
const factory = helper.getFactory();
const projects = factory.createMany(() => factory.project(), 100);
```

## Performance Monitoring

### Performance Thresholds

- **Response Time**: < 2 seconds
- **Error Rate**: < 5%
- **Throughput**: > 10 requests/second
- **Memory Usage**: < 500MB

### Performance Tests Include

- Individual endpoint performance
- Load testing with concurrent requests
- Memory usage monitoring
- Authentication performance
- Database query performance

## Best Practices

### Test Organization

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Mocking**: Mock external services in unit tests
4. **Assertions**: Use meaningful assertions
5. **Documentation**: Document test purposes

### Data Management

1. **Transactions**: Use transactions for test isolation
2. **Fixtures**: Use consistent test data
3. **Scenarios**: Test different data scenarios
4. **Cleanup**: Ensure proper test data cleanup

### CI/CD Integration

1. **Fast Feedback**: Unit tests run quickly
2. **Parallel Execution**: Run tests in parallel when possible
3. **Fail Fast**: Stop on critical failures
4. **Reporting**: Generate comprehensive test reports

## Monitoring and Alerting

### Test Metrics

- Test execution time
- Coverage percentages
- Failure rates
- Performance benchmarks

### Alerting

- Slack notifications for failures
- Email alerts for critical issues
- Dashboard monitoring for trends

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check database status
npm run test:db-status

# Reset database
npm run test:db-reset
```

#### Test Timeouts

- Increase timeout values in configuration
- Check for resource contention
- Optimize slow queries

#### Flaky Tests

- Implement proper waits and retries
- Use test isolation
- Check for race conditions

### Debug Mode

```bash
# Run tests with debugging
DEBUG=* npm test

# Run single test file
npm test -- tests/unit/project.controller.test.js

# Run tests with verbose output
npm test -- --verbose
```

## Maintenance

### Regular Tasks

1. **Update Dependencies**: Keep testing libraries updated
2. **Review Coverage**: Maintain coverage thresholds
3. **Performance Baselines**: Update performance benchmarks
4. **Test Data**: Refresh test datasets

### Monitoring Health

1. **Test Execution Times**: Monitor for performance degradation
2. **Failure Rates**: Track and investigate flaky tests
3. **Coverage Trends**: Ensure coverage doesn't decrease

This framework provides comprehensive testing capabilities to ensure high-quality deployments and catch regressions early in the development cycle.
