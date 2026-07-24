// src/pages/api/admin/login.ts
import type { APIRoute } from "astro";
import { ADMIN_SESSION_COOKIE, checkAdminPassword, createSessionToken } from "../../../lib/admin/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  if (!checkAdminPassword(password)) {
    return redirect("/admin/login?error=1");
  }

  cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas
  });

  return redirect("/admin/tendencias");
};
