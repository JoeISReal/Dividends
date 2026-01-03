import dotenv from 'dotenv';
dotenv.config({ path: './api/.env' });

const API_KEY = process.env.JUPITER_API_KEY;
const SOL_MINT = "So11111111111111111111111111111111111111112";
const DIV_MINT = process.env.DIVIDENDS_MINT || "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

async function debugPrices() {
    console.log("--- DEBUG PRICES ---");
    console.log("API Key present:", !!API_KEY);

    const ids = [SOL_MINT, DIV_MINT].join(",");
    const url = `https://api.jup.ag/price/v3/get?ids=${ids}`;

    console.log(`Fetching: ${url}`);

    try {
        const res = await fetch(url, { headers: { 'x-api-key': API_KEY } });
        console.log(`Status: ${res.status}`);
        const txt = await res.text();
        console.log("Response Body:");
        console.log(txt);
    } catch (e) {
        console.error("Error:", e);
    }
}

debugPrices();
