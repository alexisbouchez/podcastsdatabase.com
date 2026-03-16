/**
* Intlayer configuration file documentation 
* @see https://intlayer.org/doc/concept/configuration
*/

import { type IntlayerConfig, Locales } from 'intlayer';

const config: IntlayerConfig = {
  internationalization: {
    locales: [Locales.ENGLISH, Locales.FRENCH, Locales.SPANISH],
    defaultLocale: Locales.ENGLISH,
  },
  routing: {
    mode: 'search-params',
  },
  editor: {
    /**
     * Whether the visual editor is enabled.
     */
    enabled: false,

    /**
     * URL of your application for origin validation.
     */
    applicationURL: 'http://localhost:3000',
  },
  dictionary: {
    importMode: 'static',
  },
  ai: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    apiKey: process.env.ANTHROPIC_API_KEY,
    applicationContext:
      'A podcast database site with searchable transcripts from software, devtools, and startup podcasts.',
  },
  compiler: {
    enabled: false,
  },
};

export default config;
