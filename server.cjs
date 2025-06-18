const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// PayPal API configuration (Removed)
// const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
// const PAYPAL_ACCESS_TOKEN = 'A21AAIIvfyLuQsFJw5BUnkZ-F9O_mLYvYX7ilsWgBYc7uWM9iUAGit-jign9gKf_qj2Q9J_Xj-GnJaQtGcWkBZmvfSyEMykIQ';

// Real PayPal integration using the MCP access token (Removed)
/*
app.post('/api/create-paypal-order', async (req, res) => {
  try {
    console.log('Creating PayPal order, request body:', req.body);
    const { price, description } = req.body;
    
    if (!price) {
      return res.status(400).json({ error: 'Price is required' });
    }

    const formattedPrice = parseFloat(price).toFixed(2);
    
    const order = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: formattedPrice
        },
        description: description || 'Datapulsify Lifetime Deal'
      }],
      application_context: {
        brand_name: 'Datapulsify',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: 'http://localhost:8081/thank-you',
        cancel_url: 'http://localhost:8081/lifetime-deal'
      }
    };
    
    console.log('Creating PayPal order with data:', JSON.stringify(order, null, 2));
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders`,
      order,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYPAL_ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('PayPal order created:', JSON.stringify(response.data, null, 2));
    
    const approvalLink = response.data.links.find(link => link.rel === 'approve');
    
    if (!approvalLink || !approvalLink.href) {
      console.error('No approval URL found in PayPal response');
      return res.status(500).json({ error: 'Failed to get PayPal approval URL' });
    }
    
    res.json({
      orderId: response.data.id,
      approvalUrl: approvalLink.href
    });
    
  } catch (error) {
    console.error('Error creating PayPal order:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create PayPal order',
      details: error.response?.data || error.message
    });
  }
});
*/

// Capture PayPal payment (Removed)
/*
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    console.log(`Capturing PayPal order: ${orderId}`);
    
    const response = await axios.post(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PAYPAL_ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('PayPal order captured:', JSON.stringify(response.data, null, 2));
    
    res.json({
      success: true,
      data: response.data
    });
    
  } catch (error) {
    console.error('Error capturing PayPal order:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to capture payment',
      details: error.response?.data || error.message
    });
  }
});
*/

// Placeholder for future payment API endpoints
app.post('/api/create-order', async (req, res) => {
  // TODO: Implement order creation for the new payment gateway
  const { price, description } = req.body;
  console.log('Request to /api/create-order:', req.body);
  // Simulate success for now
  res.status(200).json({ message: 'Order creation endpoint placeholder', orderId: 'mockOrderId', approvalUrl: '/thank-you?orderId=mockOrderId' });
});

app.post('/api/capture-order', async (req, res) => {
  // TODO: Implement order capture for the new payment gateway
  const { orderId } = req.body;
  console.log('Request to /api/capture-order:', req.body);
  // Simulate success for now
  res.status(200).json({ success: true, message: 'Order capture endpoint placeholder', data: { id: orderId, status: 'COMPLETED'} });
});

// Special routes for SPA
app.get('/thank-you', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/lifetime-deal', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Handle all other routes for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // console.log(`PayPal API Base: ${PAYPAL_API_BASE}`); // Removed PayPal log
  // console.log(`Using PayPal MCP access token for authentication`); // Removed PayPal log
  console.log('Payment system to be integrated. PayPal has been removed.');
}); 