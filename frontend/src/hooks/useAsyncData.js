import { useState, useEffect, useCallback, useRef } from 'react';
import { classifyError, ErrorKind } from '../api/errors.js';

// Replaces the loading/error/data/reload quadruple that used to be
// hand-rolled (inconsistently, and usually without error handling at all)
// on every data-fetching page. Guards against a slow in-flight response
// from a stale `deps` value overwriting a newer one — a real hazard when
// navigating quickly on a slow connection.
export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reqId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async (signal) => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current(signal);
      if (id === reqId.current) setData(result);
    } catch (err) {
      const info = err.info ?? classifyError(err);
      if (info.kind === ErrorKind.CANCELED) return;
      if (id === reqId.current) setError(info);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal);
    return () => controller.abort();
  }, [run]);

  return { data, loading, error, reload: () => run() };
}
