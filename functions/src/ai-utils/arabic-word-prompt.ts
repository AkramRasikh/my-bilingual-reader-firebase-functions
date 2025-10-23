import { sharedWordProperties } from './shared-word-properties';

const jsonFormatVerbExample = {
  definition: 'To rely on / depend upon',
  transliteration: 'Iʿtamada ʿalā',
  baseForm: 'اعتمد على',
  phonetic: 'I‘ta-ma-da ʿa-laa',
  surfaceForm: 'اعتمدتُ على صديقي',
  notes:
    'The phrase "اعتمد على" (iʿtamada ʿalā) literally means "to lean on," but idiomatically it expresses reliance or dependence — both physical and metaphorical. The surface form "اعتمدتُ على صديقي" means "I relied on my friend." The preposition "على" (ʿalā) is essential; without it, the meaning changes. The verb اعتمد comes from the root ع-م-د (ʿ-m-d), meaning "to support" or "to lean." This expression can be used in many contexts: اعتمد على الله (“rely on God”), اعتمد على نفسه (“rely on himself”), or اعتمد على النظام (“depend on the system”). Note that object pronouns attach to the preposition, not the verb (e.g., اعتمدتُ عليه).',
};

const baseFormPrompt = `${sharedWordProperties.baseForm}: Give me the base or root form of the word or phrase provided. For example, the base form of يعتمد على is اعتمد على. If multiple words are used together to form a fixed verbal phrase, such as اعتمد على or شارك في, keep the full expression as the base form.`;

const notePrompt = `${sharedWordProperties.notes}: Use this field to highlight nuances in Arabic usage. For instance, verbs that take specific prepositions can change meaning (e.g., فكر في means “to think about,” while فكر بـ may imply “to consider doing something”). Clarify root meanings, particle attachment, or differences between formal and colloquial uses if relevant.`;

const transliterationPrompt = `${sharedWordProperties.transliteration}: is the transliteration of the ${sharedWordProperties.baseForm}. Use standard academic or simplified transliteration (e.g., Iʿtamada ʿalā).`;

const phoneticPrompt = `${sharedWordProperties.phonetic}: is the phonetic or romanized pronunciation of the ${sharedWordProperties.baseForm}, simplified for learners (e.g., I‘ta-ma-da ʿa-laa).`;

const arabicformatTranslationPrompt = (arabicWord, context) => {
  return `
  
  Translate the below word from arabic to english given the context.
  I want the definition, transliteration, phonetic, baseForm and notes section.

  ${JSON.stringify(baseFormPrompt)}
  ${JSON.stringify(notePrompt)}
  ${JSON.stringify(transliterationPrompt)}
  ${JSON.stringify(phoneticPrompt)}

  For example, given ${
    jsonFormatVerbExample.surfaceForm
  } I want the return object: 

  ${JSON.stringify(jsonFormatVerbExample)}

  NOTE: this is an integration so only the above is indeed as a response.

  Word to translate: ${arabicWord}
  Context in which the word is used ${context}
`;
};

export { arabicformatTranslationPrompt };
