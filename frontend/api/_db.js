
// Simple in-memory DB for Vercel Prototype
// NOTE: Vercel Serverless functions freeze/reset, so this data is EPHERMAL.
// It will persist for a few minutes/hours but will eventually reset.
// This is acceptable for a prototype/demo.

let inMemDB = {
    users: []
};

// Try to use a global variable to persist across hot invocations
if (!global._mongoClientPromise) {
    global._memDB = inMemDB;
}
inMemDB = global._memDB;

export function getDB() {
    return inMemDB;
}

export function saveDB(data) {
    // Update reference
    inMemDB.users = data.users;
    global._memDB = inMemDB;
}
