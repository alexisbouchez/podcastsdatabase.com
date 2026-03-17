import { type Dictionary, t } from 'intlayer';

const themeToggleContent = {
  key: 'theme-toggle',
  content: {
    system: t({
      en: "system",
      fr: "système",
      es: "sistema",
    }),

    light: t({
      en: "light",
      fr: "clair",
      es: "claro",
    }),

    dark: t({
      en: "dark",
      fr: "sombre",
      es: "oscuro",
    }),
  },
} satisfies Dictionary;

export default themeToggleContent;
