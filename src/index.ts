import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
// @ts-ignore
import serviceAccount from './key/plant-analysis-key.json';

const app = express();
const port = 3030;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.post('/analyse', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const file = req.file;
    console.log(file);

    const snapshot = await db.collection('diseases').doc('disease1').get();
    const data = snapshot.data();
    if (data) {
      res.status(200).json({
        "diseaseName": data.diseaseName,
        "description": data.description,
        "diseaseSolution": data.diseaseSolution,
        "analysisConfidence": "82.6"
      });
    } else {
      res.status(404).send('Disease not found');
    }
  } catch (error) {

    res.status(500).send(error);
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});