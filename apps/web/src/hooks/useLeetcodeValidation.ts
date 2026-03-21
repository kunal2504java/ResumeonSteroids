import { useMemo } from "react";

export function useLeetcodeValidation(username: string) {
  const isValid = useMemo(() => {
    if (username.length === 0) return null;
    return username.length >= 1 && /^[\w.-]+$/.test(username);
  }, [username]);

  return { isValid };
}
