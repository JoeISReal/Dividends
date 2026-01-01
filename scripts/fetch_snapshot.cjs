const https = require('https');

const data = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "getTokenLargestAccounts",
    params: [
        "7GB6po6UVqRq8wcTM3sXdM3URoDntcBhSBVhWwVTBAGS",
        { commitment: "confirmed" }
    ]
});

const options = {
    hostname: 'solana-mainnet.rpc.extrnode.com',
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Mozilla/5.0'
    }
};

const req = https.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (json.error) {
                console.error("Error:", json.error);
            } else {
                console.log(JSON.stringify(json.result.value.slice(0, 50)));
            }
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
