#!/bin/bash

# Analytics Module Test Runner
# This script runs all tests for the analytics module

echo "🧪 Running Analytics Module Tests"
echo "=================================="

# Set test environment
export NODE_ENV=test
export DATABASE_URL="sqlite::memory:"

# Run unit tests
echo "📋 Running Unit Tests..."
npm test -- --testPathPattern="src/modules/analytics" --testNamePattern="\.spec\.ts$" --verbose

# Run integration tests
echo "🔗 Running Integration Tests..."
npm test -- --testPathPattern="src/modules/analytics" --testNamePattern="\.integration\.spec\.ts$" --verbose

# Run all analytics tests with coverage
echo "📊 Running Tests with Coverage..."
npm run test:cov -- --testPathPattern="src/modules/analytics" --collectCoverageFrom="src/modules/analytics/**/*.ts" --coverageDirectory="coverage/analytics"

echo "✅ Analytics Module Tests Complete!"
echo "📈 Coverage report available in coverage/analytics/"

# Optional: Run specific test files
# echo "🎯 Running Specific Test Files..."
# npm test -- analytics-data.service.spec.ts
# npm test -- dashboard.service.spec.ts
# npm test -- report.service.spec.ts
# npm test -- performance.service.spec.ts
# npm test -- analytics.service.spec.ts
# npm test -- analytics.controller.spec.ts
# npm test -- analytics.integration.spec.ts 