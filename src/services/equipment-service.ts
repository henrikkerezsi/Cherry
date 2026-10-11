import type { Brewer, BrewerKind, BrewMethodId, Method } from '../models';

/**
 * The brew methods the user can actually brew today, from their equipment.
 *
 * A method is available when an active brewer claims it by name (`methodId`)
 * or when an active brewer of the method's kind exists without being bound to
 * a specific method. With no equipment at all, every method stays available so
 * a brand-new user is never blocked from logging their first brew.
 */
export function availableMethods(
  brewers: readonly Brewer[],
  methods: readonly Method[]
): Method[] {
  const active = brewers.filter((brewer) => brewer.isActive);
  if (active.length === 0) {
    return [...methods];
  }
  return methods.filter((method) =>
    isMethodAvailable(method, active)
  );
}

function isMethodAvailable(method: Method, active: readonly Brewer[]): boolean {
  if (method.brewerKind === null) {
    return true;
  }
  const claimed = active.some((brewer) => brewer.methodId === method.id);
  if (claimed) {
    return true;
  }
  return active.some(
    (brewer) => brewer.methodId === null && brewer.kind === method.brewerKind
  );
}

/** Methods whose brewer kind matches the given kind, for a brewer's own picker. */
export function methodsForKind(
  kind: BrewerKind,
  methods: readonly Method[]
): Method[] {
  return methods.filter((method) => method.brewerKind === kind);
}

/** Brewers that pair with the given method: bound to it, or generic of its kind. */
export function compatibleBrewers(
  brewers: readonly Brewer[],
  method: Method
): Brewer[] {
  return brewers.filter(
    (brewer) =>
      brewer.methodId === method.id ||
      (brewer.methodId === null && brewer.kind === method.brewerKind)
  );
}

export function methodById(
  id: BrewMethodId | null,
  methods: readonly Method[]
): Method | null {
  if (id === null) {
    return null;
  }
  return methods.find((method) => method.id === id) ?? null;
}