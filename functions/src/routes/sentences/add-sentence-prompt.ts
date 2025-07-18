/**
 * Generates a culturally-adapted translation prompt for DeepSeek API
 * @param {Object} params - Translation parameters
 * @param {string} params.sentence - Source sentence to translate
 * @param {string} params.targetLanguage - Target language code (e.g. 'fr')
 * @param {string} [params.context] - Additional context for accurate translation
 * @param {boolean} [params.includeVariations=false] - When true, returns 2-3 translation variants
 * @returns {string} Formatted API prompt
 */
export const howToSayPrompt = ({
  sentence,
  targetLanguage,
  context,
  includeVariations = false,
}) => `
Translate "${sentence}" into natural ${targetLanguage}${
  context ? ` (context: ${context})` : ''
}.

### Critical Directive:
${
  includeVariations
    ? 'Provide exactly 2-3 culturally-distinct versions'
    : 'Provide ONLY ONE best translation - never multiple versions'
}

### Strict Requirements:
1. ${
  includeVariations
    ? 'Include 2-3 variations MAXIMUM'
    : 'STRICTLY PROHIBITED to provide multiple versions - ONLY ONE translation'
}
2. Always use these exact JSON field names: "sentences", "targetLang", "notes"
3. Never include additional fields like "type" or "confidence"

### Response Format (ONLY JSON):
{
  "sentences": [
    {
      "targetLang": "${
        includeVariations ? 'Primary translation' : 'Best translation'
      }",
      "notes": "Cultural/literal rationale"
    }${
      includeVariations
        ? `,
    {
      "targetLang": "Alternative version",
      "notes": "When this variant would be used"
    },
    {
      "targetLang": "Third variant (if culturally distinct)",
      "notes": "Specific context for this version"
    }`
        : ''
    }
  ]
}

### Absolute Prohibitions:
- ${includeVariations ? '' : 'NEVER provide multiple translations - ONLY ONE'}
- No additional text outside JSON
- No markdown formatting
- No field name variations (e.g., use "targetLang" exactly)
`;

/**
 * Generates a prompt for cultural expression inquiries with strict variation control
 * @param {Object} params - Inquiry parameters
 * @param {string} params.inquiry - The "how do you..." question (e.g. "express doubt")
 * @param {string} params.targetLanguage - Target language code (e.g. 'ja')
 * @param {string} [params.context] - Situational context
 * @param {boolean} [params.includeVariations=false] - Whether to include multiple expressions
 * @returns {string} Formatted API prompt
 */
export const howToExpressPrompt = ({
  inquiry,
  targetLanguage,
  context,
  includeVariations = false,
}) => `
Explain how to "${inquiry}" in natural ${targetLanguage}${
  context ? ` (context: ${context})` : ''
}.

### Critical Directive:
${
  includeVariations
    ? 'Provide exactly 2-3 distinct cultural expressions'
    : 'Provide ONLY THE SINGLE MOST COMMON expression - never multiple versions'
}

### Strict Requirements:
1. ${
  includeVariations
    ? 'Include 2-3 variations MAXIMUM'
    : 'STRICTLY PROHIBITED to provide multiple expressions - ONLY ONE'
}
2. For ${includeVariations ? 'each' : 'the'} expression include:
   - baseLang: The English equivalent
   - targetLang: The ${targetLanguage} expression
   - notes: When/how to use it

### Response Format (ONLY JSON):
{
  "sentences": [
    {
      "baseLang": "English phrase",
      "targetLang": "${targetLanguage} translation",
      "notes": "Usage context"
    }${
      includeVariations
        ? `,
    {
      "baseLang": "Alternative English",
      "targetLang": "${targetLanguage} variant",
      "notes": "Specific use-case"
    }`
        : ''
    }
  ]
}

### Absolute Prohibitions:
- ${includeVariations ? '' : 'NEVER provide multiple expressions - ONLY ONE'}
- No additional commentary
- No markdown formatting
- No deviation from specified field names
`;

export const grammarContrastPrompt = ({
  targetLanguage,
  baseSentence,
  grammarSection,
  context,
  includeVariations = false,
  isSubtleDiff = false, // ← New flag added here
}) => `
Generate ${
  includeVariations ? '2-3' : 'ONE'
} ${targetLanguage} sentence(s) that:
${
  grammarSection
    ? `1. Illustrate "${grammarSection}"`
    : '1. Demonstrate target grammar'
}
2. ${
  isSubtleDiff
    ? 'Highlight MINIMAL differences in meaning/usage. One way of this can be pairing similar grammatical patterns together. i.e. if studying "only if" we can pair it in a setence with "as long as"'
    : 'Show natural usage'
}
3. Are standalone examples

${baseSentence ? `Base Sentence: "${baseSentence}"\n` : ''}
${context ? `Context: ${context}\n` : ''}

### Strict Requirements:
1. ${
  isSubtleDiff
    ? 'Focus on NUANCE (e.g., tone, formality, implication)'
    : 'Prioritize clarity'
}
2. ${includeVariations ? '2-3 examples MAX' : 'ONLY ONE example'}
3. Use EXACT JSON fields:
   - "sentences"
   - "targetLang"
   - "baseLang"
   - "notes" (${
     isSubtleDiff ? 'Must explain subtle differences' : 'Explain grammar'
   })
   - "isGrammar": true

### Response Format (ONLY JSON):
{
  "sentences": [
    {
      "targetLang": "${targetLanguage} example",
      "baseLang": "English translation",
      "notes": "${isSubtleDiff ? 'Nuance comparison' : 'Grammar explanation'}",
      "isGrammar": true
    }${includeVariations ? ',' : ''}
    ${
      includeVariations
        ? `
    {
      "targetLang": "Additional ${targetLanguage} example",
      "baseLang": "English translation",
      "notes": "${
        isSubtleDiff ? 'Subtle contrast with Example 1' : 'Alternative usage'
      }",
      "isGrammar": true
    }`
        : ''
    }
  ]
}`;

export const adhocSentenceMinimalPairingWordsPrompt = ({
  targetLanguage,
  word,
}) => `
  Generate a natural-sounding phrase that creates a minimal pair with the given word in ${targetLanguage},
  highlighting phonetic similarities while maintaining clear meaning.

  ### Input Word:
  ${JSON.stringify(word, null, 2)}

  ### Requirements:
  1. Create a 2-4 word phrase in ${targetLanguage} containing:
     - The input word (may be modified grammatically)
     - At least one phonetically similar word
  2. Must form a coherent, non-abstract phrase
  3. Should sound natural in ${targetLanguage}
  4. Phonetic similarity should be immediately noticeable

  ### Constraints:
  - Prioritize natural usage over forced wordplay
  - Allow conjugation/declension as needed
  - Include original script + romanization for non-Latin scripts
  - Avoid obscure vocabulary unless necessary

  ### Response Format (strict JSON):
  {
    "sentences": [{
      "targetLang": "${targetLanguage} phrase (with original script if applicable)",
      "baseLang": "Literal English translation",
      "notes": "Brief explanation of phonetic connection and usage"
    }]
  }

  ### Example Output for Japanese:
  {
    "sentences": [{
      "targetLang": "自転車で実家へ",
      "baseLang": "To parents' house by bicycle",
      "notes": "(OPTIONAL) Phonetic link: jitensha → jikka (shared ji-/jik- sounds). any missed "
    }]
  }
`;

export const adhocSentenceMinimalPairingWordsMeaningPrompt = ({
  targetLanguage,
  word,
  pairingType = 'any', // "antonym" | "synonym" | "functional" | "rhyme/haiku" | "trivia" | "subjunctive" | "any"
}) => `
  Generate a short natural phrase or short sentence in ${targetLanguage} that pairs:
  ${
    pairingType === 'any'
      ? '• Either an antonym, synonym or functional partner'
      : ''
  }
  ${pairingType === 'antonym' ? '• An antonym' : ''}
  ${pairingType === 'synonym' ? '• A synonym' : ''}
  ${pairingType === 'subjunctive' ? '• A subjunctive sentence' : ''}
  ${
    pairingType === 'trivia'
      ? '• A trivia fact that uses the word (even if the word is incidental to the word). This should still use easy to understand language'
      : ''
  }
  ${
    pairingType === 'rhyme' || pairingType === 'haiku'
      ? '• A rhyme or short haiku'
      : ''
  }
  ${pairingType === 'functional' ? '• A functional partner' : ''}

  ### Input Word:
  ${JSON.stringify(word)}

  ### Requirements:
  1. Complete, natural phrase or short sentence in ${targetLanguage}
  2. Original script + romanization if non-Latin
  3. Words may be grammatically modified

  ### Response Format (strict JSON):
  {
    "sentences": [{
      "targetLang": "${targetLanguage} phrase",
      "baseLang": "English translation",
      "notes": "Optional explanation",
      "pairingType": "["antonym" | "synonym" | "functional" | "rhyme" | "haiku" | "trivia" | "subjunctive" |"any"]"
    }]
  }

  ### Examples:
  {
    "sentences": [{
      "targetLang": "自転車ではなく自動車",
      "baseLang": "Not a bicycle but a car",
      "pairingType": "antonym"
    }]
  }
`;

export const visualCharacterPairingPrompt = ({
  language,
  word, // {id, word, definition}
}) => `
  Create a short phrase/sentence in ${language} that visually pairs with "${word.word}" by:
  • Overlapping use of characters/radicals
  • Shared characters/radicals
  • Similar-looking characters


  ### Requirements:
  1. Prioritize visual character relationships
  2. Keep the phrase/sentence natural in ${language}
  3. Highlight character connections in notes

  ### Response Format (strict JSON):
  {
    "sentences": [{
      "targetLang": "[phrase/sentence]",
      "baseLang": "English translation",
      "notes": "Optional explanation",
    }]
  }

  ### Examples:
  {
    "sentences": [{
      "targetLang": "学校で校長に会う",
      "baseLang": "Meet the principal at school",
      "notes": "Visual relationship: Shared 校 character in different positions"
    }]
  }
`;
export const customWordPrompt = ({
  language,
  word, // {id, word, definition}
  prompt,
}) => `
  Create a short sentence in ${language} pertaining to the "${word.word}" with the custom prompt in mind:
  • ${prompt}


  ### Requirements:
  1. Prioritize visual character relationships
  2. Keep the phrase/sentence natural in ${language}
  3. Highlight character connections in notes

  ### Response Format (strict JSON):
  {
    "sentences": [{
      "targetLang": "[phrase/sentence]",
      "baseLang": "English translation",
      "notes": "Optional explanation  (i.e nuances, etc)",
    }]
  }

  ### Examples:
  {
    "sentences": [{
      "targetLang": "学校で校長に会う",
      "baseLang": "Meet the principal at school",
      "notes": "Visual relationship/linguistic nuances/form etc, (any worthy notes here)"
    }]
  }
`;

export const chineseCharacterSeperatePrompt = ({
  language,
  word, // {id, word, definition}
}) => `
  Given the word ${word.word} in ${language}, which is composed of multiple characters (e.g., kanji or hanzi), generate a natural sentence in ${language} that meets the following:

  The sentence must include the full word ${word.word}.

  Each character in ${word.word} should also appear separately in the sentence, used in a way that reflects its individual meaning (as part of other words or phrases).

  The sentence should be fluent, natural, and meaningful in ${language}.

  Then, provide:

  A gloss or literal translation of the sentence into English.

  A short explanation of how each character contributes to the meaning of the full word.

  Example:
  Word: 自動車 (Japanese)
  Sentence: 彼は自分で動かす車、つまり自動車を初めて買った。
  Translation: "He bought his first car—a vehicle that moves by itself, in other words, an automobile."
  Explanation:

  自 appears in 自分 (oneself),

  動 appears in 動かす (to move),

  車 appears as 車 (vehicle),
  All of which reinforce the meaning of 自動車, a self-moving vehicle.



  ### Response Format (strict JSON):
  {
    "sentences": [{
      "targetLang": "[phrase/sentence]",
      "baseLang": "English translation",
      "notes": "Optional explanation  (i.e nuances, etc)",
      "pairingType": "seperate"
    }]
  }

  ### Examples:
  {
    "sentences": [{
      "targetLang": "学校で校長に会う",
      "baseLang": "Meet the principal at school",
      "notes": "Visual relationship between character/linguistic nuances/form etc, (any worthy notes here)",
      "pairingType": "seperate"
    }]
  }
`;
