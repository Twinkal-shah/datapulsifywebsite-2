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
    const { variantId, email, planType, customData } = req.body;

    console.log('📥 Backend received checkout request:', {
      variantId,
      email,
      planType,
      hasCustomData: !!customData
    });

    if (!variantId || !email) {
      return res.status(400).json({ 
        error: 'Missing required parameters: variantId and email are required' 
      });
    }

    const response = await axios.post(
      'https://api.lemonsqueezy.com/v1/checkouts',
      {
        checkout: {
          store_id: process.env.LEMONSQUEEZY_STORE_ID,
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
            redirect_url: `${process.env.VITE_PRODUCTION_URL || 'https://app.datapulsify.com'}/thank-you?plan=${planType}`,
            receipt_button_text: 'Go to Dashboard',
            receipt_link_url: `${process.env.VITE_PRODUCTION_URL || 'https://app.datapulsify.com'}/dashboard`,
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
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
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
