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

  if (req.method === 'GET') {
    res.status(200).json({
      totalUsers: 0,
      activeCampaigns: 0,
      totalCampaigns: 0,
      pendingSubmissions: 0,
      approvedSubmissions: 0,
      totalSubmissions: 0,
      totalEarnings: 0
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

