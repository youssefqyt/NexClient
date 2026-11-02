import { useCallback, useState } from 'react';

/**
 * Tiny data-fetching helper that removes the loading/error boilerplate from
 * every page. Not a replacement for a cache — just predictable local state.
 *
 *   const { data, loading, error, run } = useAsync(projectService.getAll)
 *   useEffect(() => { run({ page: 1 }) }, [run])
 */
export function useAsync(asyncFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await asyncFn(...args);
        const payload = response?.data ?? response;
        setData(payload);
        return payload;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { data, loading, error, run, setData };
}
