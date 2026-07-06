import dotenv from 'dotenv';
// Load the environment-specific .local file so vars like LOKI_HOST are
// available before the logger (and any other early import) initialises.
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}.local` });
