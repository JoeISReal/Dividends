
async function getWallet() {
    const res = await fetch('http://localhost:3001/api/bags/token/top-holders');
    const data = await res.json();
    console.log("FULL_WALLET: " + data.holders[0].wallet);
}
getWallet();
