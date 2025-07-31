import axios from 'axios';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      variantId, 
      email, 
      planType, 
      customData,
      // LemonSqueezy configuration from frontend
      storeId,
      apiKey,
      productionUrl = 'https://app.datapulsify.com'
    } = req.body;

    console.log('📥 API received checkout request:', {
      variantId,
      email,
      planType,
      hasCustomData: !!customData,
      hasStoreId: !!storeId,
      hasApiKey: !!apiKey
    });

    if (!variantId || !email) {
      return res.status(400).json({ 
        error: 'Missing required parameters: variantId and email are required' 
      });
    }

    if (!storeId || !apiKey) {
      return res.status(400).json({ 
        error: 'Missing LemonSqueezy configuration: storeId and apiKey are required' 
      });
    }

    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        checkout: {
          store_id: storeId,
          variant_id: variantId,
          checkout_data: {
            email,
            custom: {
              user_email: email,
              plan_type: planType,
              ...customData
            }
          },
          product_options: {
            name: planType === 'lifetime' ? 'DataPulsify Lifetime Deal' : 'DataPulsify Monthly Pro',
            description: `DataPulsify ${planType === 'lifetime' ? 'Lifetime Deal' : 'Monthly Pro'} - Access to all premium features`,
            redirect_url: `${productionUrl}/thank-you?plan=${planType}`,
            receipt_button_text: 'Go to Dashboard',
            receipt_link_url: `${productionUrl}/dashboard`,
          },
          checkout_options: {
            embed: false,
            media: true,
            logo: true,
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    console.log('✅ LemonSqueezy API response received');

    const checkoutUrl = response.data.data.attributes.url;
    const checkoutId = response.data.data.id;

    res.status(200).json({ 
      url: checkoutUrl,
      checkoutId: checkoutId
    });
  } catch (error) {
    console.error('❌ Error creating checkout:', {
      message: error.message,
      response: error?.response?.data,
      status: error?.response?.status
    });
    
    const errorMessage = error?.response?.data?.errors?.[0]?.detail || 
                        error?.response?.data?.error || 
                        error.message || 
                        'Failed to create checkout session';
    
    res.status(500).json({ error: errorMessage });
  }
} 