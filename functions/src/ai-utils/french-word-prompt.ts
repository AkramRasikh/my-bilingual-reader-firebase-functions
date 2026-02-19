import { sharedWordProperties } from './shared-word-properties';

const jsonFormatBasicExample = {
  definition: 'to eat',
  transliteration: 'manger',
  baseForm: 'manger',
  phonetic: 'mɑ̃.ʒe',
  surfaceForm: 'je mange',
  notes:
    'The verb "manger" means "to eat". The base form is the infinitive. In context, conjugation changes (e.g., "je mange" = "I eat"). Note that pronunciation may differ in regional accents.',
};

const baseFormPrompt = `${sharedWordProperties.baseForm}: Give the base (infinitive) form of the French word or phrase provided. For example, the base form of "mangeons" is "manger". If it is a fixed phrase, keep the full expression as the base form.`;

const notePrompt = `${sharedWordProperties.notes}: Use this field to highlight nuances in French usage. For example, verbs with prepositions (e.g., "penser à" vs. "penser de") or differences between formal and informal usage. Clarify idiomatic meanings, regional variations, or pronunciation notes if relevant.`;

const transliterationPrompt = `${sharedWordProperties.transliteration}: is the standard transliteration of the ${sharedWordProperties.baseForm} (if different from the base form, otherwise repeat the base form).`;

const phoneticPrompt = `${sharedWordProperties.phonetic}: is the IPA or simplified phonetic pronunciation of the ${sharedWordProperties.baseForm} (e.g., manger → mɑ̃.ʒe).`;

const frenchFormatTranslationPrompt = (frenchWord, context) => {
  return `
  
	Translate the below word from French to English given the context.
	I want the definition, transliteration, phonetic, baseForm and notes section.

	${JSON.stringify(baseFormPrompt)}
	${JSON.stringify(notePrompt)}
	${JSON.stringify(transliterationPrompt)}
	${JSON.stringify(phoneticPrompt)}

	For example, given ${jsonFormatBasicExample.surfaceForm} I want the return object:

	${JSON.stringify(jsonFormatBasicExample)}

	NOTE: this is an integration so only the above is needed as a response.

	Word to translate: ${frenchWord}
	Context in which the word is used: ${context}
`;
};

export { frenchFormatTranslationPrompt };
