import fs from 'fs';
import path from 'path';

const firebaseKey = process.env.FIREBASE_KEY;

if (!firebaseKey) {
  throw new Error('FIREBASE_KEY is not defined in environment variables');
}

const dir = path.join(__dirname, 'key');
const filePath = path.join(dir, 'plant-analysis-key.json');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(filePath, firebaseKey);