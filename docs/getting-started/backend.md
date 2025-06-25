# Build the Backend with Google Cloud Functions

The backend for Documate is a set of serverless functions that handle content upload and process question requests. These functions will be deployed to Google Cloud Functions.

## Prerequisites

*   A Google Cloud Platform (GCP) project.
*   [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) installed and initialized (`gcloud init`).
*   [Node.js](https://nodejs.org/) (version specified in the `package.json` or a recent LTS version).
*   An OpenAI API Key.

## Setup Instructions

1.  **Clone the Repository (if you haven't):**
    If you're working on a local copy of this project, navigate to the project root. If not, clone the repository that contains the backend functions.

2.  **Navigate to the Backend Functions Directory:**
    The Google Cloud Functions code provided earlier should be placed in a directory (e.g., `functions` or `gcf-backend`). Navigate into this directory.
    ```bash
    cd path/to/your/functions-directory
    ```

3.  **Install Dependencies:**
    Install the necessary Node.js packages.
    ```bash
    npm install
    ```

4.  **Set Environment Variables:**
    You need to set your OpenAI API key as an environment variable for the functions. When deploying via `gcloud`, you can do this with the `--set-env-vars` flag. For local development/emulation, you might use a `.env` file with a library like `dotenv`, but ensure this file is not committed to your repository.

    The key required is:
    *   `OPENAI_API_KEY`: Your secret API key from [OpenAI](https://platform.openai.com/account/api-keys).

5.  **Deploy the Functions:**
    Deploy each function (`upload`, `generateEmbeddings`, `ask`) to Google Cloud Functions. Replace placeholders like `<YOUR_PROJECT_ID>`, `<YOUR_REGION>`, and ensure the Node.js runtime matches what you've tested with (e.g., `nodejs18`).

    *   **`upload` function:**
        ```bash
        gcloud functions deploy upload \
          --gen2 \
          --runtime nodejs18 \
          --region <YOUR_REGION> \
          --project <YOUR_PROJECT_ID> \
          --source . \
          --entry-point upload \
          --trigger-http \
          --allow-unauthenticated \
          --set-env-vars OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        ```

    *   **`generateEmbeddings` function:**
        (Consider if HTTP trigger is appropriate or if a different trigger, e.g., Pub/Sub tied to file uploads to a bucket, or a scheduled trigger, would be better for your use case.)
        ```bash
        gcloud functions deploy generateEmbeddings \
          --gen2 \
          --runtime nodejs18 \
          --region <YOUR_REGION> \
          --project <YOUR_PROJECT_ID> \
          --source . \
          --entry-point generateEmbeddings \
          --trigger-http \
          --allow-unauthenticated \
          --set-env-vars OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        ```

    *   **`ask` function:**
        ```bash
        gcloud functions deploy ask \
          --gen2 \
          --runtime nodejs18 \
          --region <YOUR_REGION> \
          --project <YOUR_PROJECT_ID> \
          --source . \
          --entry-point ask \
          --trigger-http \
          --allow-unauthenticated \
          --set-env-vars OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
        ```
    **Note on `--allow-unauthenticated`:** This makes your functions publicly accessible. For production, you should implement authentication (e.g., using Identity Platform or API Gateway).

6.  **Set up Firestore:**
    Ensure you have a Firestore database set up in your GCP project as per the instructions in Step 1 of the overall plan. The functions use Firestore to store and retrieve page content and embeddings. No specific schema setup is required beyond creating the database, as the functions will create the `pages` collection.

## Main Endpoints

After deployment, Google Cloud will provide HTTP trigger URLs for each function. These are your main endpoints.

### `upload` Function URL

This function handles content upload, deletion, and cleaning. When new content is added via `documate upload` (after configuring `documate.json`), it will be sent to this endpoint. It chunks the content and stores it in Firestore, awaiting embedding generation.

### `generateEmbeddings` Function URL (or other trigger mechanism)

This function processes content in Firestore that doesn't yet have embeddings. It calls the OpenAI API to generate these embeddings and updates the records in Firestore. You'll need to trigger this function after uploading content. If using an HTTP trigger, you'll need to call its URL.

### `ask` Function URL

This function deals with question requests. When a user poses a question, the frontend sends a request to this endpoint. The function searches the knowledge base (embeddings in Firestore) for related content and forwards it to the OpenAI API as context. The response from OpenAI API will be returned to the frontend as a stream.

## Connect to Frontend

After you've deployed the backend and obtained the trigger URLs:
1.  Update your `documate.json` with the `upload` function's URL.
2.  Configure your frontend components (React, Vue, VanillaJS) with the `ask` function's URL.

Refer to the `docs/_partials/_connect-backend.md` guide (which should have also been updated for GCF) and specific frontend integration guides.

## Build the Frontend

Choose a framework below to get started:

- [VitePress](/integration/vitepress)
- [Docusaurus](/integration/docusaurus)
- [Docsify](/integration/docsify)
- [General Vue Project](/getting-started/general-vue)

The following frameworks are coming soon:

- Vuepress
- Docus
- Nextra
- General React Project
