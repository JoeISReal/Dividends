const URL = "http://localhost:3001/api/market/trending";

async function test() {
    console.log(`Fetching ${URL}...`);
    try {
        const res = await fetch(URL);
        console.log("Status:", res.status);
        if (res.ok) {
            const json = await res.json();
            console.log("Response Token Count:", json.tokens ? json.tokens.length : "N/A");
            if (json.tokens && json.tokens.length > 0) {
                console.log("Top 3 Tokens:");
                console.log(JSON.stringify(json.tokens.slice(0, 3), null, 2));
            } else {
                console.log("JSON:", JSON.stringify(json, null, 2));
            }
        } else {
            console.log("Text:", await res.text());
        }
    } catch (e) {
        console.error("Fetch Error:", e.message);
    }
}
test();
