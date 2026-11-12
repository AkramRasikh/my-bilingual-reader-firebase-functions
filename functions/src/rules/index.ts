import { LanguageTypes } from '../language-keys';
import linguisticConstructions from './catalog/linguistic_constructions.json';
import expressiveFunctions from './catalog/expressive_functions.json';

// To add a category: drop a JSON file into ./catalog with a top-level
// `category` id and add it here. Any top-level array of objects with
// `options` (or `subcategories`) is treated as a list of groups.
const CATALOG_FILES: unknown[] = [linguisticConstructions, expressiveFunctions];

const OPTION_KEYS = ['options', 'subcategories'] as const;

export interface RuleEntry {
  key: string; // `${category}.${id}` — the only key format clients see
  category: string;
  categoryTitle: string;
  groupId: string;
  groupName: string;
  groupDescription?: string;
  id: string;
  name: string;
  description?: string;
  languages?: LanguageTypes[];
}

export interface CatalogGroup {
  id: string;
  name: string;
  description?: string;
  options: Pick<RuleEntry, 'key' | 'id' | 'name' | 'description'>[];
}

export interface CatalogCategory {
  category: string;
  title: string;
  description?: string;
  groups: CatalogGroup[];
}

export const toRuleKey = (category: string, id: string) => `${category}.${id}`;

const appliesToLanguage = (
  languages: LanguageTypes[] | undefined,
  language: LanguageTypes,
) => !languages || languages.length === 0 || languages.includes(language);

interface RawOption {
  id: string;
  name: string;
  description?: string;
  languages?: LanguageTypes[];
}

interface RawGroup {
  id: string;
  name: string;
  description?: string;
  languages?: LanguageTypes[];
  [optionKey: string]: unknown;
}

const getGroupOptions = (group: RawGroup): RawOption[] | null => {
  for (const optionKey of OPTION_KEYS) {
    if (Array.isArray(group[optionKey])) {
      return group[optionKey] as RawOption[];
    }
  }
  return null;
};

export const buildRegistry = (files: unknown[]) => {
  const rules = new Map<string, RuleEntry>();
  const categories: (CatalogCategory & { languages?: LanguageTypes[] })[] = [];

  for (const file of files as Record<string, unknown>[]) {
    const category = file.category;
    if (typeof category !== 'string' || !category) {
      throw new Error(
        `Rule catalog "${file.title}" is missing a top-level "category" id`,
      );
    }
    if (categories.some((c) => c.category === category)) {
      throw new Error(`Duplicate rule catalog category "${category}"`);
    }
    const categoryTitle = (file.title as string) || category;
    const fileLanguages = file.languages as LanguageTypes[] | undefined;
    const groups: CatalogGroup[] = [];

    for (const value of Object.values(file)) {
      if (!Array.isArray(value)) continue;
      for (const group of value as RawGroup[]) {
        const options = group && getGroupOptions(group);
        if (!options) continue;
        const catalogGroup: CatalogGroup = {
          id: group.id,
          name: group.name,
          description: group.description,
          options: [],
        };
        for (const option of options) {
          const key = toRuleKey(category, option.id);
          if (rules.has(key)) {
            throw new Error(`Duplicate rule id "${key}" in rule catalog`);
          }
          const languages =
            option.languages ?? group.languages ?? fileLanguages;
          rules.set(key, {
            key,
            category,
            categoryTitle,
            groupId: group.id,
            groupName: group.name,
            groupDescription: group.description,
            id: option.id,
            name: option.name,
            description: option.description,
            languages,
          });
          catalogGroup.options.push({
            key,
            id: option.id,
            name: option.name,
            description: option.description,
          });
        }
        groups.push(catalogGroup);
      }
    }

    categories.push({
      category,
      title: categoryTitle,
      description: file.description as string | undefined,
      languages: fileLanguages,
      groups,
    });
  }

  const resolveRuleKeys = (
    keys: unknown,
    language: LanguageTypes,
  ): RuleEntry[] => {
    if (!Array.isArray(keys)) return [];
    const seen = new Set<string>();
    const resolved: RuleEntry[] = [];
    for (const key of keys) {
      if (typeof key !== 'string' || seen.has(key)) continue;
      seen.add(key);
      const rule = rules.get(key);
      if (rule && appliesToLanguage(rule.languages, language)) {
        resolved.push(rule);
      }
    }
    return resolved;
  };

  const getCatalogForLanguage = (language: LanguageTypes): CatalogCategory[] =>
    categories
      .filter((c) => appliesToLanguage(c.languages, language))
      .map(({ languages: _languages, ...category }) => ({
        ...category,
        groups: category.groups
          .map((group) => ({
            ...group,
            options: group.options.filter((option) =>
              appliesToLanguage(rules.get(option.key)?.languages, language),
            ),
          }))
          .filter((group) => group.options.length > 0),
      }));

  return {
    getRule: (key: string) => rules.get(key),
    resolveRuleKeys,
    getCatalogForLanguage,
  };
};

const registry = buildRegistry(CATALOG_FILES);

export const { getRule, resolveRuleKeys, getCatalogForLanguage } = registry;
