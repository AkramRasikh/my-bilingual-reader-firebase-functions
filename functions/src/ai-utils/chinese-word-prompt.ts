const wordProperties = {
  baseForm: 'baseForm',
  surfaceForm: 'surfaceForm',
  definition: 'definition',
  transliteration: 'transliteration',
  phonetic: 'phonetic',
  notes: 'notes',
};

const jsonFormatBasicExample = {
  baseForm: '扒手',
  surfaceForm: '扒手',
  definition: 'pickpocket',
  transliteration: 'Páshǒu',
  phonetic: 'Páshǒu',
  notes:
    "扒手 (pāshǒu) means pickpocket in Chinese. It refers to someone who steals small items, usually money or valuables, from others' pockets or bags without them noticing",
};

const jsonFormatVerbExample = {
  definition: 'Two Less, One Leniency policy',
  transliteration: 'Liǎng shǎo yī kuān',
  baseForm: '两少一宽',
  phonetic: 'Liǎng shǎo yī kuān',
  surfaceForm: '两少一宽',
  notes:
    'The "Two Less, One Leniency" (两少一宽) policy in 1980s China aimed to reduce arrests and death penalties for ethnic minorities and juvenile offenders, while granting them more lenient sentencing. It sought to promote social stability and rehabilitation over harsh punishment',
};

const baseFormPrompt = `${wordProperties.baseForm}: Give me the base form of the word provided. For example the base form (infinite form) of 泳げます is 泳ぐ. If possible, also do this when multiple verbs are used together for example 勉強して遊びたい => 勉強して遊ぶ. However, if this detracts from the meaning then leave it as the surface level provided i.e. 勉強して遊びたい. If it is a phrase then leave it as it is for example じゃあいってきます can be left as it is.`;
const notePrompt = `${wordProperties.notes}: This is a field to mention anything nuanced happening in the language that may be missed. For example 彷徨う is pronounced ‘samayou’ but 彷徨 is pronounced ‘hōkō’. Anything that may be relevant to the learner given the word, it’s use in the context provided and how the word maybe used in another context would be useful.`;
const transliterationPrompt = `${wordProperties.transliteration}: is the transliteration of the baseForm.`;
const phoneticPrompt = `${wordProperties.phonetic}: is the romanji/katakana of the ${wordProperties.baseForm}.`;

const chineseformatTranslationPrompt = (chineseWord, context) => {
  return `
  
  Translate the below word from Chinese to english given the context.
  I want the definition, transliteration, phonetic, baseForm and notes section.

  ${JSON.stringify(baseFormPrompt)}
  ${JSON.stringify(notePrompt)}
  ${JSON.stringify(transliterationPrompt)}
  ${JSON.stringify(phoneticPrompt)}

  For example, given ${
    jsonFormatBasicExample.surfaceForm
  } I want the return object:
    ${JSON.stringify(jsonFormatBasicExample)}

  A more comprehensive example for ${
    jsonFormatVerbExample.surfaceForm
  } I want the return object: 

  ${JSON.stringify(jsonFormatVerbExample)}

  NOTE: this is an integration so only the above is indeed as a response.

  Word to translate: ${chineseWord}
  Context in which the word is used ${context}
`;
};

export { chineseformatTranslationPrompt };
