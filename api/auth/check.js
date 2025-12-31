export default function handler(req, res) {
  const cookies = req.headers.cookie || '';
  const authToken = cookies.split(';').find(c => c.trim().startsWith('auth_token='));

  if (authToken) {
    return res.status(200).json({ authenticated: true });
  }

  return res.status(200).json({ authenticated: false });
}
