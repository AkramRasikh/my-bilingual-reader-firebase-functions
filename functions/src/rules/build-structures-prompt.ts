import type { RuleEntry } from '.';

export const MAX_STRUCTURE_RULES = 40;

// Compact, human-readable rule list (much cheaper than stringifying catalogs).
const formatRules = (rules: RuleEntry[]) => {
  const groups = new Map<string, RuleEntry[]>();
  for (const rule of rules) {
    const groupKey = `${rule.category}.${rule.groupId}`;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), rule]);
  }

  return [...groups.values()]
    .map((groupRules) => {
      const { groupName, groupDescription } = groupRules[0];
      const header = groupDescription
        ? `${groupName} — ${groupDescription}`
        : groupName;
      const lines = groupRules.map(
        (rule) =>
          `  - [${rule.key}] ${rule.name}${
            rule.description ? `: ${rule.description}` : ''
          }`,
      );
      return [header, ...lines].join('\n');
    })
    .join('\n');
};

export const structuresSchemaLine =
  'structures: An array of rule keys (from the list below) whose features are present in the sentence.';

export const buildStructuresPrompt = (rules: RuleEntry[]): string => {
  if (rules.length === 0) {
    return '';
  }

  return `
STRUCTURE CLASSIFICATION:
Evaluate the sentence against each rule below. Each rule is shown as [rule key] name: description, grouped under a heading describing what the group classifies.
- Include a rule key in "structures" only when the sentence clearly exhibits that feature. Use the description (when present) over the name.
- Multiple rules may apply, including several from the same group. Do not force a match for every group.
- Do not infer features that cannot be established from the sentence or the additional context. For incomplete sentences, only classify what is present.
- Return the rule keys exactly as written inside the square brackets, without the brackets. Never return group names, never invent or alter keys, and list each key once.
- "structures" must be a flat array of strings. If nothing matches, return an empty array.

RULES:
${formatRules(rules)}
`;
};

export const sanitizeStructures = (
  rawStructures: unknown,
  allowedKeys: Set<string>,
): string[] => {
  if (!Array.isArray(rawStructures)) return [];
  return [
    ...new Set(
      rawStructures
        .filter((key): key is string => typeof key === 'string')
        .map((key) => key.trim().replace(/^\[|\]$/g, ''))
        .filter((key) => allowedKeys.has(key)),
    ),
  ];
};
