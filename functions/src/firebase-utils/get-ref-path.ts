import { LangaugeAndContentTypes } from '../on-load-data';

export const getRefPath = ({ language, ref }: LangaugeAndContentTypes) =>
  `${language}/${ref}`;
