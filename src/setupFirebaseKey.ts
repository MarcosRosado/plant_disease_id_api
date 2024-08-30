// setupFirebaseKey.ts
import fs from 'fs';

const firebaseKey = process.env.FIREBASE_KEY;

if (!firebaseKey) {
  throw new Error('FIREBASE_KEY is not defined in environment variables');
}

fs.writeFileSync('src/key/plant-analysis-key.json', firebaseKey);