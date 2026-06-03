import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
// import planRouter from './src/routes/plan.js';
import ticketRouter from './src/routes/ticket.js';

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());
// app.use('/api', planRouter);
app.use('/api', ticketRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const otpUrl = process.env.OTP_GRAPHQL_URL || 'http://localhost:8080/otp/routers/default/index/graphql';
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log(`OTP GraphQL: ${otpUrl}`);
});
