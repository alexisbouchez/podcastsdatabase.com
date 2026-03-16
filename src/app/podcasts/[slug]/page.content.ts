import { type Dictionary, t } from 'intlayer';

const podcastDetailContent = {
  key: 'podcast-detail',
  content: {
    noEpisodesYet: t({
      en: "No episodes yet.",
      fr: "Aucun épisode pour le moment.",
      es: "Aún no hay episodios.",
    }),
  },
} satisfies Dictionary;

export default podcastDetailContent;
