// src/app/utils/password.util.ts
export function isStrongPassword(pwd: string | undefined): boolean {
  if (!pwd) return false;
  return pwd.length >= 8 &&
    /[A-Z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
}
