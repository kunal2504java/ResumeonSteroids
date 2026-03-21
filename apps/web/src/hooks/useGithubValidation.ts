import { useState, useEffect, useRef } from "react";

export interface GithubProfile {
  name: string | null;
  login: string;
  avatar_url: string;
  public_repos: number;
  bio: string | null;
}

export function useGithubValidation(username: string) {
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<GithubProfile | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (username.length < 2) {
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
          `https://api.github.com/users/${encodeURIComponent(username)}`
        );
        if (!mountedRef.current) return;
        if (res.ok) {
          const data: GithubProfile = await res.json();
          setProfile(data);
          setIsValid(true);
        } else {
          setIsValid(false);
          setProfile(null);
        }
      } catch {
        if (!mountedRef.current) return;
        setIsValid(null);
        setProfile(null);
      } finally {
        if (mountedRef.current) setIsValidating(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [username]);

  return { isValidating, isValid, profile };
}
