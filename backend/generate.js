// Google Cloud Function version of generate.js (effectively generateEmbeddings)
// Note: This code was originally designed for a Firebase Functions environment.

const functions = require('firebase-functions'); // Or use GCF-specific modules
const { Firestore } = require('@google-cloud/firestore');
const OpenAI = require('openai');

const firestore = new Firestore();

// If deploying as a standalone GCF, the export might look like:
// exports.generateEmbeddings = async (req, res) => { ... }
// We'll assume a GCF HTTP trigger for this file.
module.exports = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log('Missing environment variable OPENAI_API_KEY. Abort.');
    res.status(400).send({ error: 'Missing OPENAI_API_KEY environment variable.' });
    return;
  }

  const { project = 'default' } = req.body; // Or get project from trigger payload if not HTTP

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const snapshot = await firestore.collection('pages')
      .where('project', '==', project)
      .where('embedding', '==', null)
      .get();

    if (snapshot.empty) {
      res.send({ ok: 1, message: 'No pages to process.' });
      return;
    }

    const pagesToProcess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Batch processing for OpenAI API limits
    const batchSize = 100; // Adjust as needed, max input items for embeddings can be 2048
    let processedCount = 0;

    for (let i = 0; i < pagesToProcess.length; i += batchSize) {
      const batchPages = pagesToProcess.slice(i, i + batchSize);
      const input = batchPages.map(page => page.content.replace(/\n/g, ' '));

      if (input.length === 0) continue;

      const { data: embeddingsData } = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input,
      });

      const firestoreBatch = firestore.batch();
      batchPages.forEach((page, index) => {
        if (embeddingsData[index] && embeddingsData[index].embedding) {
          const docRef = firestore.collection('pages').doc(page.id);
          firestoreBatch.update(docRef, { embedding: embeddingsData[index].embedding });
        } else {
          console.warn(`No embedding data returned for page id ${page.id}, content: ${page.content.substring(0,100)}...`);
        }
      });
      await firestoreBatch.commit();
      processedCount += batchPages.length;
    }

    res.send({ ok: 1, message: `Processed ${processedCount} pages.` });

  } catch (error) {
    console.error(`Failed to generate embeddings for ${project}:`, error);
    res.status(500).send({ error: 'Failed to generate embeddings.' });
  }
};
