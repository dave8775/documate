# Documate Alternative Backend (Azure OpenAI)

This directory provides an alternative backend implementation for Documate using Azure OpenAI services. This backend is designed for users who prefer or require using Azure's OpenAI offerings.

The JavaScript files (`ask.js`, `generate.js`, `upload.js`) in this directory are designed to be deployed as serverless functions. You can adapt them for deployment on platforms like Google Cloud Functions, AWS Lambda, or others.

## Configuration for Azure OpenAI

To use Azure OpenAI as the backend, you need to deploy two models: one GPT model and one Embedding model.

<img src="https://aircode-yvo.b-cdn.net/resource/1695293654504-29kykwztv1p.jpg" width="400">

Unlike the OpenAI Backend, the Azure OpenAI Backend requires the configuration of four parameters, as follows:

- `AZURE_OPENAI_KEY` : The OpenAI Access Key.
- `AZURE_OPENAI_ENDPOINT` : The OpenAI Endpoint.
- `AZURE_OPENAI_DEPLOYMENT` : The deployment ID fo the GPT module.
- `AZURE_OPENAI_EMBEDDING` : The deployment ID fo the Embedding module.

<img src="https://aircode-yvo.b-cdn.net/resource/1695293476139-n2f95c7cea.jpg" width="400">
// TODO: Consider replacing this AirCode-specific image with a generic one if needed.

For general guidance on deploying Node.js serverless functions and backend concepts, please refer to the main [Documate Backend Guide](https://documate.site/getting-started/backend).

**Note:** The original code in this directory used AirCode-specific features (e.g., `aircode.db.table`, `aircode.require`). If you adapt this for other platforms like Google Cloud Functions, you'll need to replace these with standard Node.js equivalents and the appropriate SDKs for your chosen services (e.g., Firebase Admin SDK for Firestore). The `package.json` will also need to be updated accordingly by removing `aircode` dependencies and adding necessary SDKs for your target platform.