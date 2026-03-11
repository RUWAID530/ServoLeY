// Simple className utility without external dependencies
export function cn(...classes: (string | string[] | undefined | null | false)[]): string {
  const flatClasses = classes.flat().filter(Boolean);
  return flatClasses.join(' ');
}
