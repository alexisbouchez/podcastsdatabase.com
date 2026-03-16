import { type Dictionary, insert, t } from 'intlayer';

const podcastsPageContent = {
  key: 'podcasts-page',
  content: {
    browseAllPodcastsWithFull: t({
      en: "Browse all podcasts with full searchable transcripts on Podcasts Database.",
      fr: "Parcourez tous les podcasts avec des transcriptions compl\u00E8tes consultables sur Podcasts Database.",
      es: "Explore todos los podcasts con transcripciones completas buscables en Podcasts Database.",
    }),

    podcastsPodcastsDatabase: t({
      en: "Podcasts \u2014 Podcasts Database",
      fr: "Podcasts \u2014 Podcasts Database",
      es: "Podcasts \u2014 Podcasts Database",
    }),

    hostedByHostnames: insert(t({
      en: "Hosted by {{hostNames}}",
      fr: "Anim\u00E9 par {{hostNames}}",
      es: "Presentado por {{hostNames}}",
    })),

    searchPodcasts: t({
      en: "Search podcasts...",
      fr: "Rechercher des podcasts...",
      es: "Buscar podcasts...",
    }),
  },
} satisfies Dictionary;

export default podcastsPageContent;
