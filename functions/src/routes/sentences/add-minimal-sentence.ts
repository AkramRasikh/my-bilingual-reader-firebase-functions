export const buildMinimalSentencePrompt = (word, language, context) => {
  return `
You are a language assistant.

Given:
- Word/Phrase: "${word}"
- Language: "${language}"
- Context (in the same language): "${context}"

Task:
Produce a minimal, natural, complete sentence in the target language
that uses this word/phrase in its core role-pair or core semantic function.

Return ONLY a JSON object in this exact format:

{
  "targetLang": string,  // sentence in ${language}
  "baseLang": string,    // natural English translation
  "notes"?: string       // optional, 1–2 lines explaining grammar or roles
}

 Constraints:
 - The sentence must be complete and minimal.
 - Notes should be concise and clarify word usage or role.
 - The sentence must NOT copy the original context verbatim; it should diverge from the context, even if only slightly.
 - If divergence is not possible or very difficult, instead produce a minimal, complete sentence with an opposing or contrasting meaning to the original context, to highlight the word in a different usage.
 - Do NOT include any text outside the JSON.
`;
};
