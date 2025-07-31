export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const testData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: req.headers,
      body: req.body,
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      },
      message: 'Vercel function is working correctly'
    };

    console.log('🧪 Test endpoint called:', testData);

    res.status(200).json({
      success: true,
      data: testData
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
} 