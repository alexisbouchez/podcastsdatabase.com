import { type Dictionary, insert, t } from 'intlayer';

const listFilterContent = {
  key: 'list-filter',
  content: {
    noMatchesForQuery: insert(t({
      en: "No matches for \u201C{{query}}\u201D",
      fr: "Aucun r\u00E9sultat pour \u00AB\u00A0{{query}}\u00A0\u00BB",
      es: "Sin coincidencias para \u201C{{query}}\u201D",
    })),

    clear: t({
      en: "clear",
      fr: "effacer",
      es: "borrar",
    }),

    resultCount: t({
      en: "results",
      fr: "résultats",
      es: "resultados",
    }),

    resultCountSingular: t({
      en: "result",
      fr: "résultat",
      es: "resultado",
    }),
  },
} satisfies Dictionary;

export default listFilterContent;
