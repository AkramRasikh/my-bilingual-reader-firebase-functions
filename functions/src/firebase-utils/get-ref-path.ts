import { LangaugeAndContentTypes } from '../routes/on-load-data';

export const getRefPath = ({ language, ref }: LangaugeAndContentTypes) =>
  `${language}/${ref}`;
