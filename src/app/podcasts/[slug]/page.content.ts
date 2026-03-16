import { type Dictionary, t } from 'intlayer';

const podcastDetailContent = {
  key: 'podcast-detail',
  content: {
    noEpisodesYet: t({
      en: "No episodes yet.",
      fr: "Aucun \u00E9pisode pour le moment.",
      es: "A\u00FAn no hay episodios.",
    }),

    language: t({
      en: "Language",
      fr: "Langue",
      es: "Idioma",
    }),

    hosts: t({
      en: "Hosts",
      fr: "Animateurs",
      es: "Anfitriones",
    }),

    episodes: t({
      en: "Episodes",
      fr: "Épisodes",
      es: "Episodios",
    }),
  },
} satisfies Dictionary;

export default podcastDetailContent;
