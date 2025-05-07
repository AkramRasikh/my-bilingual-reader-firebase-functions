export const filterOutNestedNulls = (arr: any[]) =>
  arr?.filter((item) => item !== null && item !== undefined);
