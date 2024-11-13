import express, { Request, Response } from 'express';
import admin from 'firebase-admin';
import multer from 'multer';
import * as tf from '@tensorflow/tfjs-node';
// @ts-ignore
import serviceAccount from './key/plant-analysis-key.json';
const modelPath = 'file://./src/model/model.json';
let model: tf.LayersModel;

const app = express();
const port = 3030;

const labels =[
  "mofoBranco",
  "murchaBacteriana",
  "oidio",
  "requeima",
  "saudavel",
  "septoriose",
]

tf.loadLayersModel(modelPath).then(loadedModel => {
  model = loadedModel;
  console.log('Model loaded successfully');
}).catch(err => {
  console.error('Failed to load model:', err);
});

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
    // Convert image buffer to tensor
    const imageBuffer = file.buffer;
    const imageTensor = tf.node.decodeImage(imageBuffer);
    const resizedImage = tf.image.resizeBilinear(imageTensor, [128, 128]);
    const normalizedImage = resizedImage.div(tf.scalar(255));
    const batchedImage = normalizedImage.expandDims(0);

    // Run the model on the image tensor
    const predictions = model.predict(batchedImage) as tf.Tensor;
    const predictionArray = predictions.arraySync();
    // @ts-ignore
    const maxPredictionIndex = predictionArray[0].indexOf(Math.max(...predictionArray[0]));
    // @ts-ignore
    const maxPrediction = predictionArray[0][maxPredictionIndex];
    const diseaseName = labels[maxPredictionIndex];

    // Clear the buffer holding the image data
    imageTensor.dispose();
    resizedImage.dispose();
    normalizedImage.dispose();
    batchedImage.dispose();
    predictions.dispose();

    console.log(predictionArray);

    const snapshot = await db.collection('diseases').doc(diseaseName).get();
    const data = snapshot.data();

    if (data) {
      res.status(200).json({
        "diseaseName": data.diseaseName,
        "description": data.description,
        "diseaseSolution": data.diseaseSolution,
        "analysisConfidence": (maxPrediction * 100).toFixed(2).toString() + '%'
      });
    } else {
      res.status(404).send('Disease not found');
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});