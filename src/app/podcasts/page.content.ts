import { type Dictionary, t } from 'intlayer';

const podcastsPageContent = {
  key: 'podcasts-page',
  content: {
    browseAllPodcastsWithFull: t({
      en: "Browse all podcasts with full searchable transcripts on Podcasts Database.",
      fr: "Parcourez tous les podcasts avec des transcriptions complètes consultables sur Podcasts Database.",
      es: "Explore todos los podcasts con transcripciones completas buscables en Podcasts Database.",
    }),

    podcastsPodcastsDatabase: t({
      en: "Podcasts \u2014 Podcasts Database",
      fr: "Podcasts \u2014 Podcasts Database",
      es: "Podcasts \u2014 Podcasts Database",
    }),

    hostedByHostnames: t({
      en: "Hosted by {{hostNames}}",
      fr: "Anim\u00E9 par {{hostNames}}",
      es: "Presentado por {{hostNames}}",
    }),

    episodes: t({
      en: "episodes",
      fr: "\u00E9pisodes",
      es: "episodios",
    }),

    searchPodcasts: t({
      en: "Search podcasts...",
      fr: "Rechercher des podcasts...",
      es: "Buscar podcasts...",
    }),
  },
} satisfies Dictionary;

export default podcastsPageContent;
