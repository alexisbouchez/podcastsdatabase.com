import { type Dictionary, t } from 'intlayer';

const transcriptContent = {
  key: 'transcript',
  content: {
    searchTranscript: t({
      en: "Search transcript...",
      fr: "Rechercher dans la transcription...",
      es: "Buscar en la transcripción...",
    }),

    transcript: t({
      en: "Transcript",
      fr: "Transcription",
      es: "Transcripción",
    }),

    segmentsCount: t({
      en: "segments",
      fr: "segments",
      es: "segmentos",
    }),

    filteredOf: t({
      en: "of",
      fr: "sur",
      es: "de",
    }),
  },
} satisfies Dictionary;

export default transcriptContent;
