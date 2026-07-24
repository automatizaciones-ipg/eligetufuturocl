// src/pages/api/admin/logout.ts
import type { APIRoute } from "astro";
import { ADMIN_SESSION_COOKIE } from "../../../lib/admin/session";

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(ADMIN_SESSION_COOKIE, { path: "/" });
  return redirect("/admin/login");
};
