export function isValidItem(item) {
  return (
    item != null && typeof item === 'object' && Object.keys(item).length > 0
  );
}
