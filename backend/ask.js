// Google Cloud Function version of ask.js
// Note: This code was originally designed for a Firebase Functions environment,
// which is a superset of Google Cloud Functions. Minor adjustments might be needed
// for a pure GCF environment if not using Firebase tools for deployment.

const functions = require('firebase-functions'); // For Firebase, or use GCF-specific modules
const { Firestore } = require('@google-cloud/firestore');
const OpenAI = require('openai');
const { create, insertMultiple, searchVector } = require('@orama/orama');
const tokenizer = require('gpt-3-encoder');
const { OpenAIStream } = require('ai');

const firestore = new Firestore();
const MAX_CONTEXT_TOKEN_ASK = 1500;

// If deploying as a standalone GCF, the export might look like:
// exports.ask = async (req, res) => { ... }
// Instead of functions.https.onRequest
// For Firebase Functions, functions.https.onRequest is correct.
// We'll assume a GCF HTTP trigger for this file.

module.exports = async (req, res) => {
  // Set CORS headers for preflight requests and actual requests
  res.set('Access-Control-Allow-Origin', '*'); // Adjust for production
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Send response to OPTIONS requests
    res.status(204).send('');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log('Missing environment variable OPENAI_API_KEY. Abort.');
    res.status(400).send({ error: 'Missing OPENAI_API_KEY environment variable.' });
    return;
  }

  const { question, project = 'default' } = req.body;

  if (!question) {
    console.log('Missing param `question`. Abort.');
    res.status(400).send({ error: 'Missing param `question`.' });
    return;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const trimmedQuestion = question.trim();
    const { results: moderationRes } = await openai.moderations.create({
      input: trimmedQuestion,
    });

    if (moderationRes[0].flagged) {
      console.log('The user input contains flagged content.', moderationRes[0].categories);
      res.status(403).send({
        error: 'Question input didn\'t meet the moderation criteria.',
        categories: moderationRes[0].categories,
      });
      return;
    }

    const { data: [{ embedding }] } = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: trimmedQuestion.replace(/\n/g, ' '),
    });

    const pagesSnapshot = await firestore.collection('pages')
      .where('project', '==', project)
      .where('embedding', '!=', null)
      .get();

    if (pagesSnapshot.empty) {
      res.status(404).send({ error: 'No content found for this project.' });
      return;
    }

    const pages = pagesSnapshot.docs.map(doc => doc.data());

    const memDB = await create({
      schema: {
        path: 'string',
        title: 'string',
        content: 'string',
        embedding: 'vector[1536]',
      },
    });

    await insertMultiple(memDB, pages.filter(p => p.embedding && p.embedding.length === 1536));

    const { hits } = await searchVector(memDB, {
      vector: embedding,
      property: 'embedding',
      similarity: 0.8,
      limit: 10,
    });

    let tokenCount = 0;
    let contextSections = '';

    for (let i = 0; i < hits.length; i += 1) {
      const { content: hitContent } = hits[i].document;
      const encoded = tokenizer.encode(hitContent);
      tokenCount += encoded.length;

      if (tokenCount >= MAX_CONTEXT_TOKEN_ASK && contextSections !== '') {
        break;
      }
      contextSections += `${hitContent.trim()}\n---\n`;
    }

    const prompt = `You are a very kindly assistant who loves to help people. Given the following sections from documatation, answer the question using only that information, outputted in markdown format. If you are unsure and the answer is not explicitly written in the documentation, say "Sorry, I don't know how to help with that." Always trying to anwser in the spoken language of the questioner.

Context sections:
${contextSections}

Question:
${trimmedQuestion}

Answer as markdown (including related code snippets if available):`;

    const messages = [{ role: 'user', content: prompt }];

    const response = await openai.chat.completions.create({
      messages,
      model: 'gpt-3.5-turbo',
      max_tokens: 512,
      temperature: 0.4,
      stream: true,
    });

    const stream = OpenAIStream(response);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = stream.getReader();
    const processText = async () => {
      const { done, value } = await reader.read();
      if (done) {
        res.end();
        return;
      }
      res.write(new TextDecoder().decode(value));
      await processText();
    };
    await processText();

  } catch (error) {
    console.error('Error in ask function:', error);
    if (!res.headersSent) {
      res.status(500).send({ error: 'Failed to generate answer.' });
    } else {
      console.error('Error occurred after streaming started.');
      res.end();
    }
  }
};
