import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';
dotenv.config();

export default registerAs('development', () => ({
  mongodbConnectionUrl: process.env.MONGODB_URI ?? process.env.DEV_MONGODB_CONNECTION_URL,
  apiKey: process.env.API_KEY,
  rateLimit: {
    maxAttempts: Number(process.env.RATE_LIMIT_MAX ?? 5),
    windowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS ?? 60),
  },
  jwt: {
    privateKey: process.env.JWT_PRIVATE_KEY,
    publicKey: process.env.JWT_PUBLIC_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN,
    issuer: process.env.JWT_ISSUER,
  },
  mail: {
    // Mailing service configuration for development environment
    // GMAIL, SENDGRID, BREVO, etc.
  },
  cloudinary: {
    name: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  
}));
