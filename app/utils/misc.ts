import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// https://javascript.plainenglish.io/a-better-way-to-format-phone-numbers-in-javascript-81ce04c2f3a3
// formatPhoneNumber(12025550171, "+# (###) ###-####") => "+1 (202) 555-0171"
export const formatPhoneNumber = (
  n: number,
  template: string,
  i = 0
): string => {
  let result: string = template.replace(/#/g, () => `${n}`[i++] ?? "#");
  return result.includes("#") ? "Invalid phone number" : result;
};
