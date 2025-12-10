// Helper to keep client calls aware of basePath (e.g., /sanli-panel).
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const withBasePath = (path: string) => {
  if (!basePath || !path.startsWith('/')) return path;
  return `${basePath}${path}`;
};
