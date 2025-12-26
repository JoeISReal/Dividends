
try {
    const res = await fetch('http://localhost:3000/api/bags/token/top-holders');
    console.log(`STATUS: ${res.status}`);
    const text = await res.text();
    console.log('BODY:');
    console.log(text);
} catch (e) {
    console.error("Fetch failed:", e);
}
