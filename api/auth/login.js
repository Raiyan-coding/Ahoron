export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password } = req.body;

  // Basic validation - ensure all fields are provided and valid
  if (!name || !email || !password || name.trim().length < 2 || password.length < 4) {
    return res.status(400).json({ error: 'Please provide valid name, email, and password (min 4 chars)' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  // Create a unique user ID based on email (for cross-device sync)
  const userId = Buffer.from(email.toLowerCase().trim()).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);

  // Set session token with user ID for cross-device sync
  const token = `authenticated_${userId}_${Date.now()}`;

  res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; Max-Age=86400`); // 24 hours
  return res.status(200).json({
    success: true,
    message: 'Login successful',
    user: { name: name.trim(), email: email.trim(), userId }
  });
}
