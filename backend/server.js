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
    const { variantId, email, planType, customData, storeId, apiKey, productionUrl } = req.body;

    console.log('📥 Backend received checkout request:', {
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

    // Use provided configuration or fall back to environment variables
    const finalStoreId = storeId || process.env.LEMONSQUEEZY_STORE_ID;
    const finalApiKey = apiKey || process.env.LEMONSQUEEZY_API_KEY;
    const finalProductionUrl = productionUrl || process.env.VITE_PRODUCTION_URL || 'https://app.datapulsify.com';

    if (!finalStoreId || !finalApiKey) {
      return res.status(400).json({ 
        error: 'Missing LemonSqueezy configuration: storeId and apiKey are required' 
      });
    }

    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        checkout: {
          store_id: finalStoreId,
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
            redirect_url: `${finalProductionUrl}/thank-you?plan=${planType}`,
            receipt_button_text: 'Go to Dashboard',
            receipt_link_url: `${finalProductionUrl}/dashboard`,
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
          Authorization: `Bearer ${finalApiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
