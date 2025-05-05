import { LangaugeAndContentTypes } from '../get-on-load-data';

export const getRefPath = ({ language, ref }: LangaugeAndContentTypes) =>
  `${language}/${ref}`;
