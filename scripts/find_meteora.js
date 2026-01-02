
async function findMeteora() {
    console.log("Fetching top holders...");
    try {
        const res = await fetch('http://localhost:3001/api/bags/token/top-holders');
        const data = await res.json();

        if (data.holders) {
            const topHolder = data.holders[0];
            console.log("Rank #1:", topHolder.wallet);
            console.log("Balance:", topHolder.balance);
            if (topHolder.wallet.startsWith('HLnp')) {
                console.log("MATCH FOUND: " + topHolder.wallet);
            } else {
                console.log("No match for HLnp in #1 spot.");
            }
        }
    } catch (e) {
        console.error(e);
    }
}
findMeteora();
