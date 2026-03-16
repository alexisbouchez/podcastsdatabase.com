import { type Dictionary, t } from 'intlayer';

const episodeDetailContent = {
  key: 'episode-detail',
  content: {
    episode: t({
      en: "Episode",
      fr: "Épisode",
      es: "Episodio",
    }),

    episodes: t({
      en: "Episodes",
      fr: "Épisodes",
      es: "Episodios",
    }),

    speakers: t({
      en: "Speakers",
      fr: "Intervenants",
      es: "Participantes",
    }),

    duration: t({
      en: "Duration",
      fr: "Durée",
      es: "Duración",
    }),
  },
} satisfies Dictionary;

export default episodeDetailContent;
