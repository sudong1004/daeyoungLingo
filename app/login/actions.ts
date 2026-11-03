"use server";

import { redirect } from "next/navigation";
import {
  clearAuthCookie,
  isPasswordConfigured,
  userForPassword,
  setAuthCookie,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!isPasswordConfigured()) redirect("/login?error=config");
  const user = userForPassword(password);
  if (!user) redirect("/login?error=wrong");
  await setAuthCookie(user);
  redirect("/");
}

export async function logout() {
  await clearAuthCookie();
  redirect("/login");
}
