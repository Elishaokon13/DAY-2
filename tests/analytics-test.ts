/**
 * Zora Creator Analytics Test Script
 * 
 * This script tests the API endpoints for the Zora Creator Analytics functionality.
 * It makes requests to each endpoint with sample data and logs the responses.
 * 
 * To run: ts-node tests/analytics-test.ts
 */

import fetch from 'node-fetch';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_HANDLE = 'zora'; // A known Zora handle to test with
const TEST_COIN_ADDRESS = '0x59d870d79f09c6e9efc235c525c153d95d0f648c'; // A real Zora coin address

// Helper function to format responses for logging
function formatResponse(data: any): string {
  return JSON.stringify(data, null, 2);
}

async function runTests() {
  console.log('🧪 ZORA CREATOR ANALYTICS API TESTS 🧪');
  console.log('=====================================\n');

  try {
    // Test 1: Creator Earnings API
    console.log('TEST 1: Creator Earnings API');
    console.log('---------------------------');
    console.log(`GET /api/creator-earnings?handle=${TEST_HANDLE}`);
    
    try {
      const earningsResponse = await fetch(`${BASE_URL}/api/creator-earnings?handle=${TEST_HANDLE}`);
      const earningsData = await earningsResponse.json();
      
      console.log(`Status: ${earningsResponse.status}`);
      console.log('Response:');
      console.log(formatResponse(earningsData));
      
      if (earningsResponse.status === 200) {
        console.log('✅ Creator Earnings API test passed');
      } else {
        console.log('❌ Creator Earnings API test failed');
      }
    } catch (error) {
      console.error('❌ Error testing Creator Earnings API:', error);
    }
    
    console.log('\n');
    
    // Test 2: Collector Stats API
    console.log('TEST 2: Collector Stats API');
    console.log('--------------------------');
    console.log(`GET /api/collector-stats?address=${TEST_COIN_ADDRESS}`);
    
    try {
      const statsResponse = await fetch(`${BASE_URL}/api/collector-stats?address=${TEST_COIN_ADDRESS}`);
      const statsData = await statsResponse.json();
      
      console.log(`Status: ${statsResponse.status}`);
      console.log('Response:');
      console.log(formatResponse(statsData));
      
      if (statsResponse.status === 200) {
        console.log('✅ Collector Stats API test passed');
      } else {
        console.log('❌ Collector Stats API test failed');
      }
    } catch (error) {
      console.error('❌ Error testing Collector Stats API:', error);
    }
    
    console.log('\n');
    
    // Test 3: Earnings Timeline API
    console.log('TEST 3: Earnings Timeline API');
    console.log('----------------------------');
    console.log(`GET /api/earnings-timeline?address=${TEST_COIN_ADDRESS}&period=30`);
    
    try {
      const timelineResponse = await fetch(`${BASE_URL}/api/earnings-timeline?address=${TEST_COIN_ADDRESS}&period=30`);
      const timelineData = await timelineResponse.json();
      
      console.log(`Status: ${timelineResponse.status}`);
      console.log('Response (timeline data truncated):');
      
      // Create a copy with truncated timeline array for display
      const displayData = { ...timelineData };
      if (displayData.timeline && displayData.timeline.length > 0) {
        displayData.timeline = [
          displayData.timeline[0],
          '... truncated for display ...',
          displayData.timeline[displayData.timeline.length - 1]
        ];
      }
      
      console.log(formatResponse(displayData));
      
      if (timelineResponse.status === 200) {
        console.log('✅ Earnings Timeline API test passed');
      } else {
        console.log('❌ Earnings Timeline API test failed');
      }
    } catch (error) {
      console.error('❌ Error testing Earnings Timeline API:', error);
    }
    
    console.log('\n');
    
    // Summary
    console.log('TEST SUMMARY');
    console.log('------------');
    console.log('All API endpoints were tested. Check individual test results above.');
    console.log('Note: These tests verify that the APIs return valid responses, not that the data is accurate.');
    console.log('For complete testing, verify the data manually in the UI.');
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 