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

tf.loadLayersModel(modelPath).then(loadedModel => {
  // Check if the model has an input layer with the correct shape
  if (!loadedModel.inputs[0].shape) {
    throw new Error('Model input layer is not defined correctly');
  }
  model = loadedModel;
  console.log('Model loaded successfully');
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
    const resizedImage = tf.image.resizeBilinear(imageTensor, [224, 224]);
    const normalizedImage = resizedImage.div(tf.scalar(255));
    const batchedImage = normalizedImage.expandDims(0);

    // Run the model on the image tensor
    const predictions = model.predict(batchedImage) as tf.Tensor;
    const predictionArray = predictions.arraySync();

    // Clear the buffer holding the image data
    imageTensor.dispose();
    resizedImage.dispose();
    normalizedImage.dispose();
    batchedImage.dispose();
    predictions.dispose();

    console.log(predictionArray);

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