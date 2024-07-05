"use server";

import { compare } from "bcrypt";

export const compareHash = async (plainText: string, hashedText: string) => {
  const isValid = await compare(plainText, hashedText);

  return isValid;
};
