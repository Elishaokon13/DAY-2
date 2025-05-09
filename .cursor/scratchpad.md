# Zora Creator Earnings Analytics Miniapp

## Background and Motivation
The goal is to build a miniapp that displays analytics about creator earnings across coins on Zora. This will help creators track their earnings, understand their collector base, and visualize performance over time.

Key features include:
- Total earnings from posts
- Average earnings per post / timeframe
- Number of collectors (buy and hold)
- Number of traders (buy and sell)
- Charts showing performance over time

## Key Challenges and Analysis
1. Accessing Zora's API to fetch creator earnings data
   - The existing codebase already integrates with Zora's API using the @zoralabs/coins-sdk
   - Current implementation fetches profile and token balances, but needs to be extended to fetch creator earnings data
   - Research findings:
     - Zora SDK provides several methods for querying coin and profile data
     - For creator earnings, we can use `getProfile` and `getProfileBalances` from the coins-sdk
     - For historical data on trades, we'll need to track the coin activity over time
     - We can use the protocol rewards tracking for creator fees
     - No direct "earnings analytics" endpoint exists, so we'll need to calculate metrics from transaction data

2. Structuring and processing the data for different analytics metrics
   - Need to calculate total earnings across all tokens
   - Need to track earnings over time to calculate averages and trends
   - Need to classify users as collectors vs. traders based on transaction history
   - Research findings:
     - We can use the `getCoin` function to get details about each coin including total volume, price data
     - Trading activity can be tracked through the transaction history
     - We'll need to implement custom logic to classify users as traders or collectors based on their buy/sell behavior

3. Building interactive and responsive charts for data visualization
   - Need to select and integrate a charting library compatible with Next.js
   - Design responsive chart layouts for mobile-first UI
   - Implement filters for different timeframes (daily, weekly, monthly)
   - Research findings:
     - Several chart libraries work well with Next.js: Chart.js, Recharts, or Visx
     - For responsive design, we can leverage the existing MiniKit UI components
   - Implementation decision:
     - Selected Recharts as our charting library for its React integration and performance

4. Creating a user-friendly interface for viewing analytics
   - Extend the existing MiniKit UI components for analytics displays
   - Create dashboard layouts with cards for different metrics
   - Ensure accessibility and responsiveness
   - Research findings:
     - The existing codebase has a component called ZoraWalletInput.tsx that we can extend
     - We can build on top of the current UI structure with additional views for analytics

5. Implementing authentication for accessing personal creator data
   - Ensure that only the creator can access their earnings data
   - Leverage existing Farcaster authentication in MiniKit
   - Research findings:
     - MiniKit already provides authentication via Farcaster
     - We can use the existing context.user data to verify the user's identity

## High-level Task Breakdown

### 1. Research and Setup
- [x] Task 1.1: Research Zora API endpoints for creator earnings data
  - Success Criteria: Document available endpoints and data structures for creator earnings
- [x] Task 1.2: Install necessary dependencies for data visualization
  - Success Criteria: Successfully install and import a chart library in the project
  - Implementation: Installed Recharts library via npm

### 2. Backend API Development
- [x] Task 2.1: Create new API endpoint for fetching creator earnings
  - Success Criteria: /api/creator-earnings endpoint returns structured earnings data
  - Implementation Details:
    - Created API endpoint that uses getProfile, getProfileBalances, and getCoin functions
    - Aggregates data across multiple coins created by the user
    - Calculates total earnings based on 5% creator fee from total volume
    - Returns metrics including total earnings, total volume, posts count, and average earnings per post
- [ ] Task 2.2: Create API endpoint for collector/trader stats
  - Success Criteria: /api/collector-stats endpoint returns user classification data
  - Implementation Details:
    - Track user transaction history for specific coins
    - Classify users as collectors (hold for X time) or traders (frequent buy/sell)
- [ ] Task 2.3: Create API endpoint for earnings over time
  - Success Criteria: /api/earnings-timeline endpoint returns time-series data
  - Implementation Details:
    - Use historical transaction data to create time-series datasets
    - Group earnings by day, week, month for different timeframe views

### 3. Frontend Component Development
- [ ] Task 3.1: Create EarningsSummary component for total/average metrics
  - Success Criteria: Component displays earnings metrics with appropriate formatting
- [ ] Task 3.2: Create UserStats component for collector/trader breakdown
  - Success Criteria: Component shows collector vs. trader counts with percentage
- [ ] Task 3.3: Create TimelineChart component for earnings over time
  - Success Criteria: Component displays interactive chart with filtering options

### 4. Dashboard Assembly
- [ ] Task 4.1: Create Analytics dashboard layout
  - Success Criteria: Dashboard displays all components in an organized, responsive layout
- [ ] Task 4.2: Implement navigation between token collage and analytics views
  - Success Criteria: User can switch between token view and analytics view

### 5. Testing and Refinement
- [ ] Task 5.1: Test with sample data for different scenarios
  - Success Criteria: All components render correctly with various data conditions
- [ ] Task 5.2: Implement error handling and loading states
  - Success Criteria: UI handles errors and loading states gracefully
- [ ] Task 5.3: Performance optimization
  - Success Criteria: Dashboard loads and updates efficiently

## Project Status Board
- [x] Task 1.1: Research Zora API endpoints for creator earnings data
- [x] Task 1.2: Install necessary dependencies for data visualization
- [x] Task 2.1: Create new API endpoint for fetching creator earnings
- [ ] Task 2.2: Create API endpoint for collector/trader stats

## Executor's Feedback or Assistance Requests
- Recharts has been selected as our charting library and installed successfully.
- Created the /api/creator-earnings endpoint to calculate and return creator earnings data
- The earnings are currently estimated based on a 5% creator fee from total volume
- For more accurate data, we would need to track individual transactions, which might require additional API endpoints or data sources
- Moving on to Task 2.2: Creating API for collector/trader stats

## Lessons
- Always include debug info in program output
- Read files before editing them
- Run npm audit if vulnerabilities appear in terminal
- Ask before using git -force commands 