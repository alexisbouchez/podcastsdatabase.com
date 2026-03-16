import { type Dictionary, t } from 'intlayer';

const peoplePageContent = {
  key: 'people-page',
  content: {
    browseAllPodcastHostsAnd: t({
      en: "Browse all podcast hosts and guests on Podcasts Database \u2014 episode appearances and full searchable transcripts.",
      fr: "Parcourez tous les animateurs et invit\u00E9s de podcasts sur Podcasts Database \u2014 apparitions dans les \u00E9pisodes et transcriptions compl\u00E8tes consultables.",
      es: "Explore todos los anfitriones e invitados de podcasts en Podcasts Database \u2014 apariciones en episodios y transcripciones completas buscables.",
    }),

    peoplePodcastsDatabase: t({
      en: "People \u2014 Podcasts Database",
      fr: "Personnes \u2014 Podcasts Database",
      es: "Personas \u2014 Podcasts Database",
    }),

    hostOf: t({
      en: "Host of ",
      fr: "Animateur de ",
      es: "Anfitri\u00F3n de ",
    }),

    searchPeople: t({
      en: "Search people...",
      fr: "Rechercher des personnes...",
      es: "Buscar personas...",
    }),
  },
} satisfies Dictionary;

export default peoplePageContent;
