import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { isAdminOnlyPath } from "@/lib/admin-routes";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isLogin = pathname.startsWith("/login");
  const isPublicForm = pathname.startsWith("/f/");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isCron = pathname.startsWith("/api/cron");

  if (isPublicForm || isApiAuth || isCron) return NextResponse.next();
  if (!isLoggedIn && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  const role = req.auth?.user?.role;
  if (
    isLoggedIn &&
    isAdminOnlyPath(pathname) &&
    role !== UserRole.ADMIN
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
