
const url = "https://bags.fm/$DIVIDENDSBOT";

async function check() {
    try {
        const res = await fetch(url, { method: 'HEAD' });
        console.log("Status:", res.status);
        console.log("X-Frame-Options:", res.headers.get('x-frame-options'));
        console.log("Content-Security-Policy:", res.headers.get('content-security-policy'));
    } catch (e) {
        console.error("Error:", e.message);
    }
}

check();
