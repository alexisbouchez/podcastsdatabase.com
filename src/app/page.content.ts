import { type Dictionary, t } from 'intlayer';

const homeContent = {
  key: 'home',
  content: {
    podcastsDatabase: t({
      en: "Podcasts Database",
      fr: "Base de données de podcasts",
      es: "Base de datos de podcasts",
    }),

    everyEpisodeEveryWordSearchable: t({
      en: "Every episode. Every word. Searchable transcripts from the best podcasts in software, devtools, and startups.",
      fr: "Chaque épisode. Chaque mot. Des transcriptions consultables des meilleurs podcasts en logiciel, devtools et startups.",
      es: "Cada episodio. Cada palabra. Transcripciones buscables de los mejores podcasts de software, devtools y startups.",
    }),

    conversationsDisappearTheGoodOnes: t({
      en: "Conversations disappear. The good ones shouldn't. We transcribe every episode, diarize every speaker, and make every word searchable. No summaries. No AI slop. The actual transcript — who said what, when. Built for the people who'd rather search than scroll.",
      fr: "Les conversations disparaissent. Les bonnes ne devraient pas. Nous transcrivons chaque épisode, identifions chaque intervenant, et rendons chaque mot consultable. Pas de résumés. Pas de contenu IA. La vraie transcription — qui a dit quoi, quand. Conçu pour ceux qui préfèrent chercher plutôt que défiler.",
      es: "Las conversaciones desaparecen. Las buenas no deberían. Transcribimos cada episodio, identificamos a cada hablante, y hacemos cada palabra buscable. Sin resúmenes. Sin contenido IA. La transcripción real — quién dijo qué, cuándo. Hecho para quienes prefieren buscar en vez de desplazarse.",
    }),

    viewAll: t({
      en: "View all",
      fr: "Voir tout",
      es: "Ver todo",
    }),
  },
} satisfies Dictionary;

export default homeContent;
