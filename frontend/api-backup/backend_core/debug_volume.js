import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log("Check// CoinGecko Solana Ecosystem by Volume");
const URLS = [
    "https://api.dexscreener.com/token-boosts/top/v1"
];

async function test() {
    for (const url of URLS) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await fetch(url);
            console.log(`Status: ${res.status}`);
            if (res.status === 200) {
                const json = await res.json();
                console.log("Total Count:", json.length);

                // Filter for Solana
                const solTokens = json.filter(t => t.chainId === 'solana');
                console.log("Solana Count:", solTokens.length);

                if (solTokens.length > 0) {
                    const t = solTokens[0];
                    console.log("First Solana Token:");
                    console.log("- Chain:", t.chainId);
                    console.log("- Address (Mint):", t.tokenAddress);
                    console.log("- Amount (Boost?):", t.totalAmount);
                }
            }
        } catch (e) {
            console.error("Error:", e.message);
        }
    }
}

test();
