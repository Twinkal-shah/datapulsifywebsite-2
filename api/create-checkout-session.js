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
    console.log('🔍 Request received:', {
      method: req.method,
      headers: Object.keys(req.headers),
      bodyKeys: req.body ? Object.keys(req.body) : 'No body'
    });

    const { 
      variantId, 
      email, 
      planType, 
      customData,
      isAnonymous = false,
      // LemonSqueezy configuration from frontend
      storeId,
      apiKey,
      productionUrl = 'https://app.datapulsify.com'
    } = req.body || {};

    console.log('📥 API received checkout request:', {
      variantId: variantId || 'MISSING',
      email: email || 'Anonymous (will be collected by LemonSqueezy)',
      planType: planType || 'MISSING',
      isAnonymous,
      hasCustomData: !!customData,
      hasStoreId: !!storeId,
      hasApiKey: !!apiKey,
      productionUrl
    });

    // Validate required parameters
    if (!variantId) {
      console.error('❌ Missing variantId');
      return res.status(400).json({ 
        error: 'Missing required parameter: variantId is required',
        received: { variantId, planType, hasStoreId: !!storeId, hasApiKey: !!apiKey }
      });
    }

    if (!planType) {
      console.error('❌ Missing planType');
      return res.status(400).json({ 
        error: 'Missing required parameter: planType is required' 
      });
    }

    if (!storeId || !apiKey) {
      console.error('❌ Missing LemonSqueezy configuration:', {
        hasStoreId: !!storeId,
        hasApiKey: !!apiKey,
        storeIdLength: storeId ? storeId.length : 0,
        apiKeyLength: apiKey ? apiKey.length : 0
      });
      return res.status(400).json({ 
        error: 'Missing LemonSqueezy configuration: storeId and apiKey are required',
        debug: {
          hasStoreId: !!storeId,
          hasApiKey: !!apiKey,
          storeIdType: typeof storeId,
          apiKeyType: typeof apiKey
        }
      });
    }

    // Prepare checkout data - email is optional for anonymous purchases
    const checkoutData = {
      custom: {
        plan_type: planType,
        is_anonymous: isAnonymous,
        ...customData
      }
    };

    // Only add email if provided (for logged-in users)
    if (email && email.trim()) {
      checkoutData.email = email.trim();
      checkoutData.custom.user_email = email.trim();
    }

    console.log('🚀 Calling LemonSqueezy API with:', {
      storeId: storeId.substring(0, 4) + '***',
      variantId,
      planType,
      hasEmail: !!(email && email.trim()),
      isAnonymous
    });

    // Use the correct LemonSqueezy API format with data wrapper
    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        data: {
          type: 'checkouts',
          attributes: {
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
            checkout_data: checkoutData,
            expires_at: null,
            preview: false,
            test_mode: false
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId.toString()
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId.toString()
              }
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
      }
    );

    console.log('✅ LemonSqueezy API response received:', {
      status: response.status,
      hasData: !!response.data,
      hasUrl: !!(response.data?.data?.attributes?.url)
    });

    const checkoutUrl = response.data.data.attributes.url;
    const checkoutId = response.data.data.id;

    res.status(200).json({ 
      url: checkoutUrl,
      checkoutId: checkoutId
    });
  } catch (error) {
    console.error('❌ Error creating checkout:', {
      message: error.message,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack
    });
    
    // More specific error handling
    if (error?.response?.status === 401) {
      return res.status(500).json({ 
        error: 'Invalid LemonSqueezy API key - please check your configuration',
        code: 'INVALID_API_KEY'
      });
    }
    
    if (error?.response?.status === 422) {
      return res.status(500).json({ 
        error: 'Invalid request data sent to LemonSqueezy',
        details: error?.response?.data,
        code: 'INVALID_REQUEST_DATA'
      });
    }
    
    const errorMessage = error?.response?.data?.errors?.[0]?.detail || 
                        error?.response?.data?.error || 
                        error.message || 
                        'Failed to create checkout session';
    
    res.status(500).json({ 
      error: errorMessage,
      code: 'CHECKOUT_CREATION_FAILED',
      debug: {
        hasResponse: !!error?.response,
        status: error?.response?.status,
        axiosError: error.code
      }
    });
  }
} 