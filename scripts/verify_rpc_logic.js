const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function toBase58(buffer) {
    if (buffer.length === 0) return '';
    let i, j, digits = [0];
    for (i = 0; i < buffer.length; i++) {
        for (j = 0; j < digits.length; j++) digits[j] <<= 8;
        digits[0] += buffer[i];
        let carry = 0;
        for (j = 0; j < digits.length; ++j) {
            digits[j] += carry;
            carry = (digits[j] / 58) | 0;
            digits[j] %= 58;
        }
        while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }
    }
    for (i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) digits.push(0);
    return digits.reverse().map(d => ALPHABET[d]).join('');
}

async function run() {
    const rpc = "https://solana-mainnet.g.alchemy.com/v2/GOu50-6Y3sqi0q3AdLMFq";
    const MINT = "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS";

    console.log("1. Fetching Largest Accounts...");
    const payload = JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "getTokenLargestAccounts",
        params: [MINT, { commitment: "confirmed" }]
    });

    try {
        const res = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });

        const text = await res.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            console.error("RPC Response was not JSON:", text.slice(0, 200));
            return;
        }

        if (!json.result || !json.result.value) {
            console.error("RPC Error:", json);
            return;
        }

        const accounts = json.result.value.slice(0, 5);
        console.log(`Found ${accounts.length} accounts. Top 1 Token Account: ${accounts[0].address}`);

        console.log("2. Fetching Account Info (Owner Resolution)...");
        const pubkeys = accounts.map(a => a.address);

        const infoPayload = JSON.stringify({
            jsonrpc: "2.0", id: 2, method: "getMultipleAccounts",
            params: [pubkeys, { encoding: "base64" }]
        });

        const infoRes = await fetch(rpc, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: infoPayload });
        const infoJson = await infoRes.json();

        if (infoJson.result && infoJson.result.value) {
            infoJson.result.value.forEach((acc, i) => {
                if (!acc) {
                    console.log(`[${i}] No Data`);
                    return;
                }
                const base64 = acc.data[0];
                const binaryString = atob(base64);
                const bytes = new Uint8Array(binaryString.length);
                for (let k = 0; k < binaryString.length; k++) {
                    bytes[k] = binaryString.charCodeAt(k);
                }

                // SPL Token Layout: Mint (0-32), Owner (32-64), Amount (64-72)
                const ownerBytes = bytes.slice(32, 64);
                const owner = toBase58(ownerBytes);

                console.log(`[${i}] Token Account: ${pubkeys[i]} -> Owner (Wallet): ${owner}`);
            });
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
}

run();
