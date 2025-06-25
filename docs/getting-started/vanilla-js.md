# Get Started with Native JavaScript

Documate supports native JavaScript pages through the `@documate/vanilla` package.

## Initialize Documate

`@documate/vanilla` will automatically search for DOM elements with the ID `ask-ai` on the page, so you don't need to perform any manual initialization. The only thing you need to do is provide a button with the ID `ask-ai` on the page.

### Import from CDN

```html
<button id="ask-ai" data-endpoint="https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/ask"></button> // TODO: Replace with actual GCF URL
...
<script src="https://unpkg.com/@documate/vanilla"></script>
```

### Import from Node

```bash
npm install @documate/vanilla
```

```js
import 'documate-vanilla';
```

## Prepare Data

To prepare your data you can manually install `@documate/documate` in your project's directory.

```bash
npm i @documate/documate
```

Create a `documate.json` file:

```json
{
  "root": "docs",
  "include": [ "**/*.md" ],
  "backend": "https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/upload" // TODO: Replace with actual GCF URL
}
```

Add npm scripts in your `package.json` file:

```json

  "scripts": {
    ...
    "documate:upload": "documate upload",
    ...
  },
```

And run `npm run documate:upload` to post your data to the backend endpoint.