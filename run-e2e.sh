#!/bin/sh
# Run full E2E flow for Wakili Pro

# 1. Start backend and frontend in the background
npm run dev &
DEV_PID=$!

# 2. Wait for frontend to be ready (port 3000)
echo "Waiting for frontend to be ready..."
while ! nc -z localhost 3000; do   
  sleep 1
done

# 3. Run Playwright E2E tests
cd e2e
npx playwright test
E2E_STATUS=$?
cd ..

# 4. Kill dev servers
kill $DEV_PID

# 5. Exit with E2E test status
exit $E2E_STATUS
