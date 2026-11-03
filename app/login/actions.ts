"use server";

import { redirect } from "next/navigation";
import {
  clearAuthCookie,
  isPasswordConfigured,
  passwordMatches,
  setAuthCookie,
} from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!isPasswordConfigured()) redirect("/login?error=config");
  if (!passwordMatches(password)) redirect("/login?error=wrong");
  await setAuthCookie();
  redirect("/");
}

export async function logout() {
  await clearAuthCookie();
  redirect("/login");
}
