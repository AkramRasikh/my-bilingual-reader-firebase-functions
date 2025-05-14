const wordProperties = {
  baseForm: 'baseForm',
  surfaceForm: 'surfaceForm',
  definition: 'definition',
  transliteration: 'transliteration',
  phonetic: 'phonetic',
  notes: 'notes',
};

const jsonFormatBasicExample = {
  definition: 'beans, bean, peas',
  transliteration: 'Mame',
  note: '豆',
  baseForm: '豆',
  phonetic: 'まめ',
  surfaceForm: '豆',
  notes:
    'beans here is flexible ranging from coffee beans to beans cooked for food such as lentils/fava beans, etc',
};

const jsonFormatVerbExample = {
  baseForm: '彷徨う',
  surfaceForm: '彷徨って',
  definition: 'to wander or to roam',
  transliteration: 'samayou',
  phonetic: 'さまよう',
  notes:
    'By itself, 彷徨 (ほうこう, hōkō) means "wandering" or "roaming." It describes the state of wandering aimlessly, much like the verb 彷徨う (samayou), but in its noun form.',
};

const baseFormPrompt = `${wordProperties.baseForm}: Give me the base form of the word provided. For example the base form (infinite form) of 泳げます is 泳ぐ. If possible, also do this when multiple verbs are used together for example 勉強して遊びたい => 勉強して遊ぶ. However, if this detracts from the meaning then leave it as the surface level provided i.e. 勉強して遊びたい. If it is a phrase then leave it as it is for example じゃあいってきます can be left as it is.`;
const notePrompt = `${wordProperties.notes}: This is a field to mention anything nuanced happening in the language that may be missed. For example 彷徨う is pronounced ‘samayou’ but 彷徨 is pronounced ‘hōkō’. Anything that may be relevant to the learner given the word, it’s use in the context provided and how the word maybe used in another context would be useful.`;
const transliterationPrompt = `${wordProperties.transliteration}: is the transliteration of the baseForm.`;
const phoneticPrompt = `${wordProperties.phonetic}: is the romanji/katakana of the ${wordProperties.baseForm}.`;

const japaneseformatTranslationPrompt = (japaneseWord, context) => {
  return `
  
  Translate the below word from Japanese to english given the context.
  I want the definition, transliteration, phonetic, baseForm and notes section.

  ${JSON.stringify(baseFormPrompt)}
  ${JSON.stringify(notePrompt)}
  ${JSON.stringify(transliterationPrompt)}
  ${JSON.stringify(phoneticPrompt)}

  For example, given 豆 I want the return object:

  ${JSON.stringify(jsonFormatBasicExample)}

  A more comprehensive example for ${
    jsonFormatVerbExample.surfaceForm
  } I want the return object: 

  ${JSON.stringify(jsonFormatVerbExample)}

  NOTE: this is an integration so only the above is indeed as a response.

  Word to translate: ${japaneseWord}
  Context in which the word is used ${context}
`;
};

export { japaneseformatTranslationPrompt };
