// MongoDB Connection with Encryption and TLS Enforcement
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load encrypted environment variables
const loadEncryptedEnv = () => {
  const envPath = path.join(process.cwd(), '.env.encrypted');
  if (!fs.existsSync(envPath)) {
    throw new Error('Encrypted environment file not found');
  }
  // In production, use actual decryption (this is simplified)
  const content = fs.readFileSync(envPath, 'utf-8');
  const [key] = content.split('\n');
  process.env.MONGODB_URI_ENCRYPTED = key.trim();
};

loadEncryptedEnv();

// MongoDB connection with TLS enforcement
const uri = process.env.MONGODB_URI_ENCRYPTED;
if (!uri) {
  throw new Error('MongoDB URI not configured in encrypted environment');
}

const client = new MongoClient(uri, {
  tls: true,
  tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
  tlsAllowInvalidHostnames: false,
  retryWrites: true,
  w: 'majority'
});

export default client;