import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const SERVICE_ACCOUNT_PATH = './firebase-service-account.json';

async function main() {
  console.log('\n=== GSHSMB HMIS - Firebase Setup ===\n');

  const envContent = readFileSync('.env', 'utf-8');

  const hasServiceKey = envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY={');
  const hasCredPath = envContent.includes('GOOGLE_APPLICATION_CREDENTIALS');
  const hasFile = existsSync(SERVICE_ACCOUNT_PATH);

  if (hasFile) {
    console.log('✓ Firebase service account file found at', SERVICE_ACCOUNT_PATH);
    const fullPath = `${process.cwd()}/${SERVICE_ACCOUNT_PATH}`;
    writeFileSync('.env', envContent.replace(
      /# GOOGLE_APPLICATION_CREDENTIALS=.*/,
      `GOOGLE_APPLICATION_CREDENTIALS=${fullPath}`
    ));
    console.log('✓ .env updated with GOOGLE_APPLICATION_CREDENTIALS');
    console.log('\nRun: npm run dev\n');
    process.exit(0);
  }

  if (hasServiceKey) {
    console.log('✓ FIREBASE_SERVICE_ACCOUNT_KEY found in .env');
    console.log('\nRun: npm run dev\n');
    process.exit(0);
  }

  if (hasCredPath) {
    console.log('✓ GOOGLE_APPLICATION_CREDENTIALS configured in .env');
    console.log('\nRun: npm run dev\n');
    process.exit(0);
  }

  console.log('\n❌ No Firebase credentials found.\n');
  console.log('You need a Firebase service account to run the backend.\n');
  console.log('Option 1: Service Account (recommended)');
  console.log('  ─────────────────────────────────────────────');
  console.log('  1. Go to https://console.firebase.google.com');
  console.log('  2. Select project: gshms-76f30');
  console.log('  3. Project Settings → Service Accounts');
  console.log('  4. Click "Generate new private key"');
  console.log('  5. Download the JSON file');
  console.log('  6. Save it as: backend/firebase-service-account.json');
  console.log('  7. Run: npm run setup');
  console.log('  8. Run: npm run dev\n');
  console.log('Option 2: Firebase Emulators (local only)');
  console.log('  ─────────────────────────────────────────────');
  console.log('  1. npm install -g firebase-tools');
  console.log('  2. firebase login');
  console.log('  3. firebase init emulators (select Firestore + Auth)');
  console.log('  4. Add to .env:');
  console.log('     FIRESTORE_EMULATOR_HOST=localhost:8080');
  console.log('     FIREBASE_AUTH_EMULATOR_HOST=localhost:9099');
  console.log('  5. Run: firebase emulators:start');
  console.log('  6. Run: npm run dev (in another terminal)\n');
}

main().catch(console.error);
