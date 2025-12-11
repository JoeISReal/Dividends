import { getDB } from '../_db.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { handle, newDisplayName } = req.body;

    if (!handle || !newDisplayName) {
        return res.status(400).json({ error: 'Missing handle or displayName' });
    }

    // Basic validation
    if (newDisplayName.length < 3 || newDisplayName.length > 20) {
        return res.status(400).json({ error: 'Name must be between 3 and 20 characters' });
    }

    const cleanHandle = handle.replace(/^@/, '').toLowerCase();
    const cleanDisplayName = newDisplayName.trim();

    try {
        const db = await getDB();
        const collection = db.collection('users');

        // 1. Uniqueness Check
        // Check if ANY user exists with this displayName (case-insensitive)
        // BUT exclude the current user (in case they are reclaiming their own name, though redundant)
        const existing = await collection.findOne({
            displayName: { $regex: new RegExp(`^${cleanDisplayName}$`, 'i') },
            handle: { $ne: cleanHandle }
        });

        if (existing) {
            return res.status(409).json({ error: 'Display Name is already taken.' });
        }

        // 2. Update the User
        const result = await collection.updateOne(
            { handle: cleanHandle },
            {
                $set: {
                    displayName: cleanDisplayName,
                    lastActive: Date.now()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ success: true, displayName: cleanDisplayName });

    } catch (e) {
        console.error("Profile Update Error:", e);
        return res.status(500).json({ error: 'Database error' });
    }
}
