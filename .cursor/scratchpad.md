# Background and Motivation

We aim to build a miniapp that displays analytics about a creator's earnings across different coins on the Zora protocol. It will fetch earnings and engagement data for a given creator's posts and present key metrics:
- Total earnings from posts
- Average earnings per post and per selected timeframe
- Number of collectors (buy and hold)
- Number of traders (buy and sell)
- Time-series performance charts

# Key Challenges and Analysis

- Data retrieval: integrating with Zora API, handling rate limits and authentication.
- Data aggregation: normalizing earnings across multiple coins and currencies.
- Time-series grouping: computing metrics over arbitrary timeframes (daily, weekly, monthly).
- User classification: distinguishing collectors vs. traders based on transaction history.
- Charting: selecting and configuring a charting library for performant, interactive visuals.
- UI/UX: designing an intuitive interface for exploring metrics and timeframes.
- Performance: handling large datasets and lazy-loading where needed.
- Testing: ensuring correctness of business logic and robustness of API integration.

# High-level Task Breakdown

1. Research Zora API endpoints
   - Success criteria: Identify endpoints for retrieving creator earnings and transaction history.
2. Set up project skeleton
   - Success criteria: Initialize a Next.js (or React) project with TypeScript, linting, and formatting.
3. Implement Zora API client
   - Success criteria: Create functions to fetch earnings and transaction data with error handling.
4. Write tests for API client
   - Success criteria: Unit tests that mock API responses and validate data parsing.
5. Define data models and types
   - Success criteria: TypeScript interfaces for earnings records and transaction events.
6. Compute metrics
   6.1 Total earnings from posts
   6.2 Average earnings per post/timeframe
   6.3 Number of collectors vs traders
   - Success criteria: Utility functions with accompanying unit tests.
7. Integrate chart library
   - Success criteria: Install and configure Chart.js or D3, with placeholder charts rendering sample data.
8. Build UI components for metrics display
   - Success criteria: Components that render each metric clearly with basic styling.
9. Build chart components
   - Success criteria: Time-series charts that update based on selected timeframe.
10. Add UI styling and responsive design
    - Success criteria: Use CSS modules or styled-components for a clean, mobile-friendly layout.
11. Integration tests / E2E
    - Success criteria: End-to-end tests verifying data flow from API to UI.
12. Deployment setup
    - Success criteria: Scripts for building and deploying (e.g., Vercel), environment variable configuration.
13. Documentation and README
    - Success criteria: Clear project overview, setup instructions, and usage guide.

# Project Status Board

- [ ] Research Zora API endpoints
- [ ] Set up project skeleton
- [ ] Implement Zora API client
- [ ] Write tests for API client
- [ ] Define data models and types
- [ ] Compute metrics
- [ ] Integrate chart library
- [ ] Build UI components for metrics display
- [ ] Build chart components
- [ ] Add UI styling and responsive design
- [ ] Integration tests / E2E
- [ ] Deployment setup
- [ ] Documentation and README

# Executor's Feedback or Assistance Requests

- (none so far)

# Lessons

- (none yet) 