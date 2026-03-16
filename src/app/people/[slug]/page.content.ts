import { type Dictionary, t } from 'intlayer';

const personDetailContent = {
  key: 'person-detail',
  content: {
    languages: t({
      en: "Languages",
      fr: "Langues",
      es: "Idiomas",
    }),

    hosts: t({
      en: "Hosts",
      fr: "Anime",
      es: "Presenta",
    }),

    episodes: t({
      en: "Episodes",
      fr: "Épisodes",
      es: "Episodios",
    }),

    people: t({
      en: "People",
      fr: "Personnes",
      es: "Personas",
    }),
  },
} satisfies Dictionary;

export default personDetailContent;
