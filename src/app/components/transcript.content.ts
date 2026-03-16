import { type Dictionary, t } from 'intlayer';

const transcriptContent = {
  key: 'transcript',
  content: {
    searchTranscript: t({
      en: "Search transcript...",
      fr: "Rechercher dans la transcription...",
      es: "Buscar en la transcripción...",
    }),
  },
} satisfies Dictionary;

export default transcriptContent;
