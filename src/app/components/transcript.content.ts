import { type Dictionary, t } from 'intlayer';

const transcriptContent = {
  key: 'transcript',
  content: {
    searchTranscript: t({
      en: "Search transcript...",
      fr: "Rechercher dans la transcription...",
      es: "Buscar en la transcripci\u00F3n...",
    }),
  },
} satisfies Dictionary;

export default transcriptContent;
