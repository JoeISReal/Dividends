import crypto from "crypto";

export function signSession(payload, secret) {
    const json = JSON.stringify(payload);
    const sig = crypto.createHmac("sha256", secret).update(json).digest("hex");
    return Buffer.from(JSON.stringify({ json, sig })).toString("base64url");
}

export function verifySession(token, secret) {
    try {
        const raw = Buffer.from(token, "base64url").toString("utf8");
        const { json, sig } = JSON.parse(raw);
        const expected = crypto.createHmac("sha256", secret).update(json).digest("hex");
        if (sig !== expected) return null;
        return JSON.parse(json);
    } catch {
        return null;
    }
}
