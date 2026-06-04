import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import ticketRouter from './src/routes/ticket.js';
import paymentRouter from './src/routes/payment.js';
import { webhookHandler } from './src/controllers/paymentController.js';

const app = express();

app.use(cors());

// Stripe webhook must receive raw body — mount BEFORE express.json()
app.post('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }), webhookHandler);

app.use(express.json());
app.use('/api', ticketRouter);
app.use('/api', paymentRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const otpUrl = process.env.OTP_GRAPHQL_URL || 'http://localhost:8080/otp/routers/default/index/graphql';
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`OTP GraphQL: ${otpUrl}`);
});
