export type ProviderErrorKind =
  | 'auth'
  | 'quota'
  | 'network'
  | 'invalid-request'
  | 'server'
  | 'audio';

export class ProviderError extends Error {
  constructor(
    public readonly kind: ProviderErrorKind,
    message: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}