// backend/server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { variantId, email, planType, customData, storeId, apiKey, productionUrl, isAnonymous = false } = req.body;

    console.log('📥 Backend received checkout request:', {
      variantId,
      email: email || 'Anonymous (will be collected by LemonSqueezy)',
      planType,
      isAnonymous,
      hasCustomData: !!customData,
      hasStoreId: !!storeId,
      hasApiKey: !!apiKey
    });

    if (!variantId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: variantId is required' 
      });
    }

    // Use provided configuration or fall back to environment variables
    const finalStoreId = storeId || process.env.LEMONSQUEEZY_STORE_ID;
    const finalApiKey = apiKey || process.env.LEMONSQUEEZY_API_KEY;
    const finalProductionUrl = productionUrl || process.env.VITE_PRODUCTION_URL || 'https://app.datapulsify.com';

    if (!finalStoreId || !finalApiKey) {
      return res.status(400).json({ 
        error: 'Missing LemonSqueezy configuration: storeId and apiKey are required' 
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

    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        data: {
          type: 'checkouts',
          attributes: {
            product_options: {
              name: planType === 'lifetime' ? 'DataPulsify Lifetime Deal' : 'DataPulsify Monthly Pro',
              description: `DataPulsify ${planType === 'lifetime' ? 'Lifetime Deal' : 'Monthly Pro'} - Access to all premium features`,
              redirect_url: `${finalProductionUrl}/thank-you?plan=${planType}`,
              receipt_button_text: 'Go to Dashboard',
              receipt_link_url: `${finalProductionUrl}/dashboard`,
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
                id: finalStoreId.toString()
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
          Authorization: `Bearer ${finalApiKey}`,
          'Content-Type': 'application/vnd.api+json',
          Accept: 'application/vnd.api+json',
        },
      }
    );

    console.log('✅ LemonSqueezy API response received');

    const checkoutUrl = response.data.data.attributes.url;
    const checkoutId = response.data.data.id;

    res.json({ 
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
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
