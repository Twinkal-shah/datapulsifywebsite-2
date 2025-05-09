import fetch from 'node-fetch';

const PROJECT_REF = 'yevkfoxoefssgsodtzd';
const ACCESS_TOKEN = 'sbp_be733141f239c2d5a4375942548e89ac14bd622e';

async function updateAuthConfig() {
  try {
    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        site_url: 'https://datapulsify.com',
        additional_redirect_urls: [
          'http://localhost:3000/**',
          'https://datapulsify.com/**'
        ]
      })
    });

    const data = await response.json();
    console.log('Auth configuration updated:', data);
  } catch (error) {
    console.error('Error updating auth configuration:', error);
  }
}

updateAuthConfig(); 