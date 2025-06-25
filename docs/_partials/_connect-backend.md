Now you are all set with the frontend. The last step is to connect it to the backend.

### Prerequisite
Before continuing, please make sure you have deployed your Google Cloud Functions. Follow the (TODO: Add link to new backend setup guide) if you haven't done so.

### 1. Add the Backend URL to `documate.json`

Open your Google Cloud Console, navigate to Cloud Functions, and find your `upload` function. Copy its trigger URL.

Then add it to the `documate.json` file:

```json{4}
{
  "root": ".",
  "include": [ "**/*.md", "**/*.mdx" ],
  "backend": "https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/upload" // TODO: Replace with actual GCF URL
}
```

Remember to replace `https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/upload` with your own one.

### 2. Add the `ask` Endpoint to Component

Find the trigger URL for your `ask` function in the Google Cloud Console.

You will need to pass this URL to the Documate component in your frontend code (e.g., as the `endpoint` prop). Refer to the documentation for the specific component you are using (`@documate/react`, `@documate/vue`, or `@documate/vanilla`).
