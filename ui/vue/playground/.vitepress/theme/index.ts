// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'

import Documate from '@documate/vue'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(Documate, {
        endpoint: 'https://<YOUR_REGION>-<YOUR_PROJECT_ID>.cloudfunctions.net/ask', // TODO: Replace with actual GCF URL
        predefinedQuestions: [
          'What is Documate?',
        ],
      }),
    })
  },
}
