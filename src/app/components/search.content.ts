import { type Dictionary, t } from 'intlayer';

const searchContent = {
  key: 'search',
  content: {
    searchPodcastsPeopleEpisodesTranscripts: t({
      en: "Search podcasts, people, episodes, transcripts...",
      fr: "Rechercher des podcasts, personnes, épisodes, transcriptions...",
      es: "Buscar podcasts, personas, episodios, transcripciones...",
    }),

    noResults: t({
      en: "No results",
      fr: "Aucun résultat",
      es: "Sin resultados",
    }),
  },
} satisfies Dictionary;

export default searchContent;
