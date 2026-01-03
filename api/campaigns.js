export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // In production, these should proxy to your backend API
  if (req.method === 'GET') {
    res.status(200).json({ campaigns: [] });
  } else if (req.method === 'POST') {
    res.status(201).json({ campaign: { id: 'new', ...req.body } });
  } else if (req.method === 'PUT') {
    res.status(200).json({ campaign: { id: req.query.id, ...req.body } });
  } else if (req.method === 'DELETE') {
    res.status(200).json({ message: 'Campaign deleted' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

