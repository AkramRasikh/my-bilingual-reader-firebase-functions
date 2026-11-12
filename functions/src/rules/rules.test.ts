import { buildRegistry, getCatalogForLanguage, resolveRuleKeys } from '.';
import {
  buildStructuresPrompt,
  sanitizeStructures,
} from './build-structures-prompt';

describe('rule registry', () => {
  it('resolves known keys, drops unknown/non-string keys and dedupes', () => {
    const rules = resolveRuleKeys(
      [
        'constructions.subjunctive',
        'constructions.subjunctive',
        'expressive_functions.apologising',
        'constructions.not_a_rule',
        'subjunctive',
        42,
      ],
      'japanese',
    );
    expect(rules.map((r) => r.key)).toEqual([
      'constructions.subjunctive',
      'expressive_functions.apologising',
    ]);
    expect(rules[0].groupName).toBe('Grammatical mood');
  });

  it('returns no rules for non-array input', () => {
    expect(resolveRuleKeys(undefined, 'japanese')).toEqual([]);
    expect(resolveRuleKeys('constructions.subjunctive', 'japanese')).toEqual(
      [],
    );
  });

  it('builds a catalog tree for the client', () => {
    const catalog = getCatalogForLanguage('french');
    expect(catalog.map((c) => c.category)).toEqual([
      'constructions',
      'expressive_functions',
    ]);
    expect(catalog[0].groups[0].options[0].key).toMatch(/^constructions\./);
  });

  it('filters language-restricted rules', () => {
    const registry = buildRegistry([
      {
        category: 'keigo',
        languages: ['japanese'],
        groups: [{ id: 'g', name: 'G', options: [{ id: 'sonkeigo', name: 'S' }] }],
      },
      {
        category: 'mixed',
        groups: [
          {
            id: 'g',
            name: 'G',
            options: [
              { id: 'all', name: 'All' },
              { id: 'ar_only', name: 'Ar', languages: ['arabic'] },
            ],
          },
        ],
      },
    ]);
    const keys = ['keigo.sonkeigo', 'mixed.all', 'mixed.ar_only'];
    expect(registry.resolveRuleKeys(keys, 'japanese').map((r) => r.key)).toEqual(
      ['keigo.sonkeigo', 'mixed.all'],
    );
    expect(registry.resolveRuleKeys(keys, 'arabic').map((r) => r.key)).toEqual([
      'mixed.all',
      'mixed.ar_only',
    ]);
    expect(
      registry.getCatalogForLanguage('french').map((c) => c.category),
    ).toEqual(['mixed']);
  });

  it('rejects catalogs without a category or with duplicate ids', () => {
    expect(() => buildRegistry([{ title: 'x', groups: [] }])).toThrow(
      /category/,
    );
    expect(() =>
      buildRegistry([
        {
          category: 'c',
          groups: [
            { id: 'a', name: 'A', options: [{ id: 'dup', name: 'D' }] },
            { id: 'b', name: 'B', options: [{ id: 'dup', name: 'D' }] },
          ],
        },
      ]),
    ).toThrow(/Duplicate/);
  });
});

describe('structures prompt', () => {
  it('is empty when there are no rules', () => {
    expect(buildStructuresPrompt([])).toBe('');
  });

  it('lists only the selected rules with their keys', () => {
    const prompt = buildStructuresPrompt(
      resolveRuleKeys(['constructions.subjunctive'], 'japanese'),
    );
    expect(prompt).toContain('[constructions.subjunctive] Subjunctive');
    expect(prompt).toContain('Grammatical mood');
    expect(prompt).not.toContain('constructions.indicative');
  });

  it('sanitizes model output to requested keys', () => {
    const allowed = new Set(['constructions.subjunctive', 'constructions.passive']);
    expect(
      sanitizeStructures(
        [
          'constructions.subjunctive',
          '[constructions.passive]',
          'constructions.subjunctive',
          'invented',
          3,
        ],
        allowed,
      ),
    ).toEqual(['constructions.subjunctive', 'constructions.passive']);
    expect(sanitizeStructures(undefined, allowed)).toEqual([]);
  });
});
