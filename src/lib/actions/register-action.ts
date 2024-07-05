"use server";
import { registerSchema } from "../utils/zod.schema";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { hash } from "bcrypt";
import type { PostgresError } from "postgres";

export const registerAction = async (formData: FormData) => {
  const rawFormData = Object.fromEntries(formData.entries());
  const validatedFields = registerSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.log("Validation errors:", validatedFields.error.flatten());
    const fieldErrors = validatedFields.error.flatten().fieldErrors;

    const errorMessage = Object.values(fieldErrors)
      .flat()
      .find((error) => error !== undefined);
    return {
      success: false,
      error: errorMessage ?? "Validation failed",
      message: "",
      user: null,
    };
  }

  const { email, password, username, phoneNumber } = validatedFields.data;

  const hashedPassword = await hash(password, 10);

  try {
    const newUser = await db.transaction(async (trx) => {
      const [user] = await trx
        .insert(users)
        .values({
          name: username,
          email,
          phoneNumber,
          passwordHash: hashedPassword,
        })
        .returning();

      if (!user) null;
      return user;
    });

    if (!newUser) {
      return {
        success: false,
        error: "Failed to register user",
        message: "",
        user: null,
      };
    }

    return {
      success: true,
      error: "",
      user: {
        email: newUser.email,
        username: newUser.name,
        password: newUser.passwordHash,
        phoneNumber: newUser.phoneNumber,
      },
      message: "User registered successfully",
    };
  } catch (error) {
    console.error("Error registering user", error);

    const psError = error as PostgresError;
    return {
      success: false,
      error:
        psError.code === "23505"
          ? "Duplicate field value"
          : psError.message ?? "Internal error occurred",
      message: "",
      user: null,
    };
  }
};
