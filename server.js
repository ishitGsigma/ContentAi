import express from 'express';
import dotenv from 'dotenv';
import generateHandler from './api/generate.js';
import createOrderHandler from './api/create-order.js';
import verifyPaymentHandler from './api/verify-payment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// API routes
app.post('/api/generate', generateHandler);
app.post('/api/create-order', createOrderHandler);
app.post('/api/verify-payment', verifyPaymentHandler);

app.listen(PORT, () => {
  console.log(`Local API server running on http://localhost:${PORT}`);
});