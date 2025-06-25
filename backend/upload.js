// Google Cloud Function version of upload.js
// Note: This code was originally designed for a Firebase Functions environment.

const functions = require('firebase-functions'); // Or use GCF-specific modules
const { Firestore } = require('@google-cloud/firestore');
const crypto = require('crypto');
const tokenizer = require('gpt-3-encoder'); // Ensure this is in package.json

const firestore = new Firestore();
const MAX_TOKEN_PER_CHUNK = 8191;

// Split the page content into chunks base on the MAX_TOKEN_PER_CHUNK
function getContentChunks(content) {
  const encoded = tokenizer.encode(content);
  const tokenChunks = encoded.reduce(
    (acc, token) => {
      if (acc[acc.length - 1].length < MAX_TOKEN_PER_CHUNK) {
        acc[acc.length - 1].push(token);
      } else {
        acc.push([token]);
      }
      return acc;
    },
    [[]],
  );
  return tokenChunks.map(tokens => tokenizer.decode(tokens));
}

// If deploying as a standalone GCF, the export might look like:
// exports.upload = async (req, res) => { ... }
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

  // OPENAI_API_KEY might not be strictly needed for upload itself,
  // but was in original. Retaining for consistency or if future validation uses it.
  if (!process.env.OPENAI_API_KEY) {
    console.log('Missing environment variable OPENAI_API_KEY. Abort.');
    res.status(400).send({
      error: 'Missing OPENAI_API_KEY environment variable.',
    });
    return;
  }

  const { operation, project = 'default' } = req.body;

  if (!['add', 'delete', 'clean', 'generate'].includes(operation)) {
    console.log(`Operation ${operation} is not supported. Abort.`);
    res.status(400).send({
      error: `Operation ${operation} is not supported.`,
    });
    return;
  }

  try {
    if (operation === 'clean') {
      const snapshot = await firestore.collection('pages').where('project', '==', project).get();
      if (snapshot.empty) {
        res.send({ ok: 1, message: "No documents to clean."});
        return;
      }
      const batch = firestore.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      res.send({ ok: 1, message: `Cleaned ${snapshot.size} documents.` });
      return;
    }

    if (operation === 'generate') {
      // This operation was originally calling a local generateEmbeddings function.
      // In a GCF setup, you'd typically trigger the separate `generateEmbeddings` function.
      // For now, returning a message to trigger it separately.
      console.log("Received 'generate' operation in 'upload'. Trigger the 'generateEmbeddings' function separately.");
      res.status(202).send({ ok: 1, message: "Embedding generation should be triggered via the 'generateEmbeddings' function." });
      return;
    }

    const { path, title = '', content = '' } = req.body;

    if (!path) {
      console.log('Missing param `path`. Abort.');
      res.status(400).send({
        error: 'Missing param `path`.',
      });
      return;
    }

    console.log(`${operation} page with path ${path} for project ${project}`);

    if (operation === 'delete') {
      const snapshot = await firestore.collection('pages').where('project', '==', project).where('path', '==', path).get();
      if (snapshot.empty) {
        res.send({ ok: 1, message: `No documents found with path ${path} to delete.`});
        return;
      }
      const batch = firestore.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      res.send({ ok: 1, message: `Deleted ${snapshot.size} documents with path ${path}.` });
      return;
    }

    // 'add' operation
    const checksum = crypto.createHash('md5').update(content).digest('hex');
    const querySnapshot = await firestore.collection('pages')
      .where('project', '==', project)
      .where('path', '==', path)
      .limit(1) // We only need to check one chunk to see if checksum matches
      .get();

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      if (doc.data().checksum === checksum) {
        console.log(`Page content for path ${path} is fresh. Skip regenerating.`);
        res.send({ ok: 1, message: 'Content is fresh, skipped.' });
        return;
      } else {
        console.log(`Content for ${path} has changed. Deleting old chunks.`);
        const oldChunksSnapshot = await firestore.collection('pages').where('project', '==', project).where('path', '==', path).get();
        const deleteBatch = firestore.batch();
        oldChunksSnapshot.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();
        console.log(`Deleted ${oldChunksSnapshot.size} old chunks for path ${path}.`);
      }
    }

    const chunks = getContentChunks(content);
    const firestoreWriteBatch = firestore.batch();
    chunks.forEach((chunk, index) => {
      const docRef = firestore.collection('pages').doc(); // Auto-generate ID
      firestoreWriteBatch.set(docRef, {
        project,
        path,
        title,
        checksum,
        chunkIndex: index,
        content: chunk,
        embedding: null,
      });
    });

    await firestoreWriteBatch.commit();
    res.send({ ok: 1, message: `Added ${chunks.length} chunks for path ${path}.` });

  } catch (error) {
    console.error(`Error in upload function (operation: ${operation}):`, error);
    res.status(500).send({ error: 'Failed to process upload request.' });
  }
};
