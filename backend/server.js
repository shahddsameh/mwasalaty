import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import planRouter from './src/routes/plan.js';
import ticketRouter from './src/routes/ticket.js';
import paymentRouter from './src/routes/payment.js';
import placesRouter from './src/routes/places.js';
import favoritePlacesRouter from './src/routes/favoritePlaces.js';
import aiRouter from './src/routes/ai.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', planRouter);
app.use('/api', ticketRouter);
app.use('/api', paymentRouter);
app.use('/api', placesRouter);
app.use('/api', favoritePlacesRouter);
app.use('/api', aiRouter);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  const otpUrl = process.env.OTP_GRAPHQL_URL || 'http://localhost:8081/otp/routers/default/index/graphql';
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`OTP GraphQL: ${otpUrl}`);
});

server.on('error', (err) => {
  console.error('Backend failed to start:', err);
  process.exit(1);
});
