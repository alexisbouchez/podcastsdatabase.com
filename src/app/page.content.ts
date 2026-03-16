import { type Dictionary, t } from 'intlayer';

const homeContent = {
  key: 'home',
  content: {
    podcastsDatabase: t({
      en: "Podcasts Database",
      fr: "Base de donn\u00E9es de podcasts",
      es: "Base de datos de podcasts",
    }),

    everyEpisodeEveryWordSearchable: t({
      en: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
      fr: "Chaque \u00E9pisode. Chaque mot. Des transcriptions consultables des meilleurs podcasts en logiciel, devtools et startups.",
      es: "Cada episodio. Cada palabra. Transcripciones buscables de los mejores podcasts de software, devtools y startups.",
    }),

    conversationsDisappearTheGoodOnes: t({
      en: "Conversations disappear. The good ones shouldn\u2019t. We transcribe every episode, diarize every speaker, and make every word searchable. No summaries. No AI slop. The actual transcript \u2014 who said what, when. Built for the people who\u2019d rather search than scroll.",
      fr: "Les conversations disparaissent. Les bonnes ne devraient pas. Nous transcrivons chaque \u00E9pisode, identifions chaque intervenant, et rendons chaque mot consultable. Pas de r\u00E9sum\u00E9s. Pas de contenu IA. La vraie transcription \u2014 qui a dit quoi, quand. Con\u00E7u pour ceux qui pr\u00E9f\u00E8rent chercher plut\u00F4t que d\u00E9filer.",
      es: "Las conversaciones desaparecen. Las buenas no deber\u00EDan. Transcribimos cada episodio, identificamos a cada hablante, y hacemos cada palabra buscable. Sin res\u00FAmenes. Sin contenido IA. La transcripci\u00F3n real \u2014 qui\u00E9n dijo qu\u00E9, cu\u00E1ndo. Hecho para quienes prefieren buscar en vez de desplazarse.",
    }),

    viewAll: t({
      en: "View all",
      fr: "Voir tout",
      es: "Ver todo",
    }),
  },
} satisfies Dictionary;

export default homeContent;
