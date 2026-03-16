import { type Dictionary, insert, t } from 'intlayer';

const listFilterContent = {
  key: 'list-filter',
  content: {
    noMatchesForQuery: insert(t({
      en: "No matches for \u201C{{query}}\u201D",
      fr: "Aucun r\u00E9sultat pour \u00AB\u00A0{{query}}\u00A0\u00BB",
      es: "Sin coincidencias para \u201C{{query}}\u201D",
    })),
  },
} satisfies Dictionary;

export default listFilterContent;
