import {
  normalizeBreakdownVocab,
  vocabPromptLine,
} from './sentence-breakdown-vocab';

describe('vocabPromptLine', () => {
  it('asks for Hepburn romaji for japanese', () => {
    const line = vocabPromptLine('japanese');
    expect(line).toContain('transliteration');
    expect(line).toContain('Hepburn');
    expect(line).toContain('macrons');
  });

  it('asks for pinyin with tone marks, never numbers, for chinese', () => {
    const line = vocabPromptLine('chinese');
    expect(line).toContain('Pinyin with tone marks');
    expect(line).toContain('Never use tone numbers');
  });

  it('asks for a romanization with short vowels for arabic', () => {
    expect(vocabPromptLine('arabic')).toContain('short vowels');
  });

  it('asks for no transliteration for french', () => {
    expect(vocabPromptLine('french')).not.toContain('transliteration');
  });
});

describe('normalizeBreakdownVocab', () => {
  it('keeps a trimmed transliteration on each item', () => {
    expect(
      normalizeBreakdownVocab(
        [
          { surfaceForm: '我', meaning: 'I', transliteration: ' wǒ ' },
          { surfaceForm: '已经', meaning: 'already', transliteration: 'yǐjīng' },
        ],
        'chinese',
      ),
    ).toEqual([
      { surfaceForm: '我', meaning: 'I', transliteration: 'wǒ' },
      { surfaceForm: '已经', meaning: 'already', transliteration: 'yǐjīng' },
    ]);
  });

  it('keeps an item whose transliteration is missing or blank', () => {
    expect(
      normalizeBreakdownVocab(
        [
          { surfaceForm: 'まだ', meaning: 'still' },
          { surfaceForm: '彼は', meaning: 'he', transliteration: '  ' },
        ],
        'japanese',
      ),
    ).toEqual([
      { surfaceForm: 'まだ', meaning: 'still' },
      { surfaceForm: '彼は', meaning: 'he' },
    ]);
  });

  it('drops transliteration and extra fields for french', () => {
    expect(
      normalizeBreakdownVocab(
        [{ surfaceForm: 'Je', meaning: 'I', transliteration: 'zhuh', extra: 1 }],
        'french',
      ),
    ).toEqual([{ surfaceForm: 'Je', meaning: 'I' }]);
  });

  it('skips items without a surface form and passes through a non-array', () => {
    expect(
      normalizeBreakdownVocab(
        [null, { meaning: 'x' }, { surfaceForm: ' ', meaning: 'y' }],
        'japanese',
      ),
    ).toEqual([]);
    expect(normalizeBreakdownVocab(undefined, 'japanese')).toBeUndefined();
  });
});
