# Documate Backend with Google Cloud Functions

This directory contains the source code for the Documate backend, designed to be deployed as Google Cloud Functions.

The primary backend functions are:
- `ask.js`: Handles user questions, performs vector search, and generates answers using OpenAI.
- `generate.js`: Generates embeddings for content.
- `upload.js`: Manages content upload, deletion, and cleaning in Firestore.

For detailed setup and deployment instructions, please refer to the [Documate Backend Guide](https://documate.site/getting-started/backend) (ensure this link is updated if the site structure changes).

The functions are intended to be deployed to Google Cloud Functions and use Google Cloud Firestore for data storage. You will need an OpenAI API key.
