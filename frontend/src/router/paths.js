/** Shared path helpers so admin/client pages can be reused verbatim. */
export const basePath = (user) => (user?.role === 'client' ? '/client' : '/admin');
