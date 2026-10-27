/**
 * Spoken English inquiry → one study word/phrase + one short example sentence.
 */
export const buildImprovWordPrompt = ({
  inquiry,
  language,
  context,
}: {
  inquiry: string;
  language: string;
  context?: string;
}) => `
I am studying ${language}. From this spoken English inquiry, give me ONE study card:
the target word or short phrase I should learn, plus ONE short sentence that uses it.

## Inquiry
${inquiry}
${context ? `\n## Additional context\n${context}\n` : ''}
## How to read the inquiry
- It may be rambling or informal (dictation).
- "How do you say / how do you express X" → the natural ${language} equivalent, not a literal calque.
- "such as …" / an example → that sense only (e.g. "hold" as in hold a festival, not grasp).
- "instead of Y" / contrast → the more specific item; mention the contrast in notes (e.g. paramilitary vs army).
- Prefer a word or short fixed phrase (the thing on a flashcard), not a full answer-sentence as the "word".
- Informal conversational register unless the inquiry suggests otherwise.

## Sentence style
- Prefer a casual spoken line: something you would actually say in conversation (to a friend, colleague, or in everyday talk).
- First or second person is fine ("I…", "you…", a short remark or question).
- Avoid textbook / news-caption / encyclopedic examples when a natural spoken line exists.
- If the word is inherently formal, bureaucratic, or news-only, keep a natural spoken frame anyway if possible (e.g. commenting on it in conversation). Only drop casual register when that would mis-teach the word; say so in sentence notes.

## Requirements
1. Exactly ONE word/phrase and ONE sentence.
2. The sentence must contain that word/phrase in the intended sense, be complete, minimal, and sound like casual conversation in ${language} when possible.
3. Keep the sentence short enough for TTS (under ~8 seconds).
4. definition: concise English gloss of the word/phrase (not of the whole sentence).
5. notes on the word: nuance, register, and any contrast from the inquiry.
6. notes on the sentence: only if usage is not obvious.
7. baseForm: dictionary / citation form. Keep full phrases intact (do not strip particles or verbs from a fixed expression).
8. surfaceForm: the form as used in the sentence.
9. transliteration / phonetic: learner-friendly romanization of the baseForm (repeat the baseForm for French if identical).

## Response (ONLY JSON, exact field names, no markdown)
{
  "word": {
    "surfaceForm": "form as used in the sentence",
    "baseForm": "dictionary / citation form",
    "definition": "English gloss",
    "transliteration": "...",
    "phonetic": "...",
    "notes": "nuance / contrast / when to use this vs the obvious word"
  },
  "sentence": {
    "targetLang": "the ${language} sentence",
    "baseLang": "natural English translation",
    "notes": "optional, 1–2 lines"
  }
}

## Absolute prohibitions
- NEVER return more than one word object or one sentence object
- No additional text outside JSON
- No markdown formatting
- No field name variations
`;
