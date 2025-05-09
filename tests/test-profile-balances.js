const { getProfile, getProfileBalances } = require('@zoralabs/coins-sdk');

async function main() {
  console.log("Testing getProfileBalances...");

  // Test with a known Zora handle
  const testHandle = "wbnns";
  
  try {
    console.log(`Fetching profile for ${testHandle}...`);
    const profileRes = await getProfile({ identifier: testHandle });
    console.log("Profile response:", JSON.stringify(profileRes.data, null, 2));
    
    console.log(`Fetching profile balances for ${testHandle}...`);
    const balancesRes = await getProfileBalances({ identifier: testHandle });
    console.log("Balances response:", JSON.stringify(balancesRes.data, null, 2));
  } catch (error) {
    console.error("Error testing getProfileBalances:", error);
  }
}

main().catch(console.error); 