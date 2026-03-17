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
      fr: "Aucun résultat",
      es: "Sin resultados",
    }),

    typePodcast: t({
      en: "podcast",
      fr: "podcast",
      es: "podcast",
    }),

    typePerson: t({
      en: "person",
      fr: "personne",
      es: "persona",
    }),

    typeEpisode: t({
      en: "episode",
      fr: "épisode",
      es: "episodio",
    }),

    typeTranscript: t({
      en: "transcript",
      fr: "transcription",
      es: "transcripción",
    }),

    loading: t({
      en: "Loading...",
      fr: "Chargement...",
      es: "Cargando...",
    }),

    searchButton: t({
      en: "search: /",
      fr: "recherche : /",
      es: "buscar: /",
    }),
  },
} satisfies Dictionary;

export default searchContent;
