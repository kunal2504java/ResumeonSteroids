import { useState, useEffect, useRef } from "react";

export interface CodeforcesProfile {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
}

export function useCodeforcesValidation(handle: string) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<CodeforcesProfile | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (handle.length < 2) {
      setIsValid(null);
      setProfile(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`
        );
        if (!mountedRef.current) return;
        if (res.ok) {
          const data = await res.json();
          if (data.status === "OK" && data.result?.[0]) {
            const user = data.result[0];
            setProfile({
              handle: user.handle,
              rating: user.rating ?? 0,
              maxRating: user.maxRating ?? 0,
              rank: user.rank ?? "unrated",
              maxRank: user.maxRank ?? "unrated",
            });
            setIsValid(true);
          } else {
            setIsValid(false);
            setProfile(null);
          }
        } else {
          setIsValid(false);
          setProfile(null);
        }
      } catch {
        // CORS or network error — treat as unvalidated rather than invalid
        if (!mountedRef.current) return;
        setIsValid(null);
        setProfile(null);
      } finally {
        if (mountedRef.current) setIsValidating(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [handle]);

  return { isValidating, isValid, profile };
}
