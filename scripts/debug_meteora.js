
async function debug() {
    try {
        const res = await fetch('http://localhost:3001/api/bags/token/top-holders');
        const data = await res.json();
        console.log("Keys:", Object.keys(data));
        if (data.holders) {
            console.log("Count:", data.holders.length);
            if (data.holders.length > 0) {
                console.log("First:", JSON.stringify(data.holders[0]));
            }
        } else {
            console.log("No holders array:", JSON.stringify(data));
        }
    } catch (e) {
        console.error(e);
    }
}
debug();
