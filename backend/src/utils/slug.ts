import crypto from 'node:crypto';

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'org';
}

/** Append a short random suffix to de-collide slugs. */
export function withSuffix(slug: string): string {
  return `${slug}-${crypto.randomBytes(3).toString('hex')}`;
}
