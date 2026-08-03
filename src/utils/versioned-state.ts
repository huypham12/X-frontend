const hasNumericVersion = (value: unknown): value is { version: number } =>
  typeof value === 'object' &&
  value !== null &&
  'version' in value &&
  typeof value.version === 'number';

export const keepNewestVersionedState = (current: unknown, incoming: unknown) => {
  if (
    hasNumericVersion(current) &&
    hasNumericVersion(incoming) &&
    current.version > incoming.version
  ) {
    return current;
  }
  return incoming;
};
