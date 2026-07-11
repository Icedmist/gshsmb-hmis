import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as crypto from 'crypto';

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../firebase-service-account.json');
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken(): Promise<string> {
  const key = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: key.client_email,
    scope: SCOPES.join(' '),
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const payload = `${base64UrlEncode(Buffer.from(JSON.stringify(header)))}.${base64UrlEncode(Buffer.from(JSON.stringify(claim)))}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(payload);
  const signature = base64UrlEncode(sign.sign(key.private_key));
  const jwt = `${payload}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data: any = await res.json();
  if (!data.access_token) throw new Error(data.error_description || 'Failed to get token');
  return data.access_token;
}

async function enableApi(api: string, token: string) {
  const url = `https://serviceusage.googleapis.com/v1/projects/gshms-76f30/services/${api}:enable`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const data: any = await res.json();
  if (res.ok || data.error?.message?.includes('already enabled') || data.error?.message?.includes('has not been used')) {
    console.log(`✓ ${api} ready`);
  } else {
    console.error(`✗ ${api}:`, data.error?.message || JSON.stringify(data));
  }
}

async function main() {
  try {
    console.log('Getting access token...');
    const token = await getAccessToken();
    console.log('✓ Got token\n');

    await enableApi('firestore.googleapis.com', token);
    await enableApi('identitytoolkit.googleapis.com', token);
    await enableApi('storage.googleapis.com', token);

    console.log('\nDone! Wait a minute then restart the server.');
  } catch (err: any) {
    console.error('Error:', err?.message || err);
  }
}

main();
