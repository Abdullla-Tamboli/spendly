import { useEffect, useReducer, useState } from 'react';
export function errorMessage(error) { return error?.response?.data?.error?.message || error?.message || 'Something went wrong. Please try again.'; }
export default function useResource(loader) {
  const [version, refetch] = useReducer((v) => v + 1, 0);
  const [state, setState] = useState({ data: null, pagination: null, loading: true, error: null });
  useEffect(() => {
    let active = true;
    setState({ data: null, pagination: null, loading: true, error: null });
    Promise.resolve().then(loader).then((res) => {
      if (active) setState({ data: res.data.data, pagination: res.data.pagination || null, loading: false, error: null });
    }).catch((error) => {
      if (active) setState({ data: null, pagination: null, loading: false, error: errorMessage(error) });
    });
    return () => { active = false; };
  }, [loader, version]);
  return { ...state, refetch };
}
