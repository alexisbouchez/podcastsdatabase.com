import { type Dictionary, t } from 'intlayer';

const searchContent = {
  key: 'search',
  content: {
    searchPodcastsPeopleEpisodesTranscripts: t({
      en: "Search podcasts, people, episodes, transcripts...",
      fr: "Rechercher des podcasts, personnes, \u00E9pisodes, transcriptions...",
      es: "Buscar podcasts, personas, episodios, transcripciones...",
    }),

    noResults: t({
      en: "No results",
      fr: "Aucun r\u00E9sultat",
      es: "Sin resultados",
    }),
  },
} satisfies Dictionary;

export default searchContent;
