# Build/Lint/Test Commands

## Frontend (SPA - Firebase)
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Deploy: `firebase deploy`
- Deploy Functions Only: `firebase deploy --only functions`
- Deploy Rules Only: `firebase deploy --only firestore:rules`

## Cloud Functions
- Install: `cd functions && npm install`
- Build: `cd functions && npm run build`
- Deploy: `firebase deploy --only functions`
