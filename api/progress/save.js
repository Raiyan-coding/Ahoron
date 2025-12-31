export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  const authToken = cookies.split(';').find(c => c.trim().startsWith('auth_token='));

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { userId, progressType, data } = req.body;

  if (!userId || !progressType || !data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // In a real app, you'd save this to a database
  // For now, we'll use a simple in-memory store (resets on deployment)
  if (!global.progressStore) {
    global.progressStore = {};
  }

  if (!global.progressStore[userId]) {
    global.progressStore[userId] = {};
  }

  global.progressStore[userId][progressType] = {
    data,
    timestamp: new Date().toISOString()
  };

  return res.status(200).json({ success: true });
}
