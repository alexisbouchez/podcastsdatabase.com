import { type Dictionary, t } from 'intlayer';

const layoutContent = {
  key: 'layout',
  content: {
    everyEpisodeEveryWordSearchable: t({
      en: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
      fr: "Chaque \u00E9pisode. Chaque mot. Des transcriptions consultables des meilleurs podcasts en logiciel, devtools et startups.",
      es: "Cada episodio. Cada palabra. Transcripciones buscables de los mejores podcasts de software, devtools y startups.",
    }),

    podcastsDatabase: t({
      en: "Podcasts Database",
      fr: "Base de donn\u00E9es de podcasts",
      es: "Base de datos de podcasts",
    }),
  },
} satisfies Dictionary;

export default layoutContent;
