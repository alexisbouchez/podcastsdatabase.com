import { type Dictionary, t } from 'intlayer';

const peoplePageContent = {
  key: 'people-page',
  content: {
    browseAllPodcastHostsAnd: t({
      en: "Browse all podcast hosts and guests on Podcasts Database — episode appearances and full searchable transcripts.",
      fr: "Parcourez tous les animateurs et invités de podcasts sur Podcasts Database — apparitions dans les épisodes et transcriptions complètes consultables.",
      es: "Explore todos los anfitriones e invitados de podcasts en Podcasts Database — apariciones en episodios y transcripciones completas buscables.",
    }),

    peoplePodcastsDatabase: t({
      en: "People — Podcasts Database",
      fr: "Personnes — Podcasts Database",
      es: "Personas — Podcasts Database",
    }),

    hostOf: t({
      en: "Host of",
      fr: "Animateur de",
      es: "Anfitrión de",
    }),

    searchPeople: t({
      en: "Search people...",
      fr: "Rechercher des personnes...",
      es: "Buscar personas...",
    }),
  },
} satisfies Dictionary;

export default peoplePageContent;
