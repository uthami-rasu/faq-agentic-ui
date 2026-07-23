"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { login } from "@/lib/server-api";

export type LoginState = { error: string };

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  let superAdmin = false;
  try {
    const session = await login(email, password);
    superAdmin = session.user.super_admin;
    const expires = new Date(session.expires_at);
    (await cookies()).set("arffy-ai-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Login failed. Please try again." };
  }
  redirect(superAdmin ? "/admin" : "/");
}
