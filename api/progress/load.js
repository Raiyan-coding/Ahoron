export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = req.headers.cookie || '';
  const authToken = cookies.split(';').find(c => c.trim().startsWith('auth_token='));

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const userId = url.searchParams.get('userId');
  const progressType = url.searchParams.get('progressType');

  if (!userId || !progressType) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // In a real app, you'd load this from a database
  // For now, we'll use a simple in-memory store (resets on deployment)
  if (!global.progressStore || !global.progressStore[userId] || !global.progressStore[userId][progressType]) {
    return res.status(404).json({ error: 'Progress not found' });
  }

  return res.status(200).json({
    success: true,
    data: global.progressStore[userId][progressType].data,
    timestamp: global.progressStore[userId][progressType].timestamp
  });
}
