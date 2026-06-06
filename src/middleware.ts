import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLogin = req.nextUrl.pathname.startsWith("/login");
  const isPublicForm = req.nextUrl.pathname.startsWith("/f/");
  const isApiAuth = req.nextUrl.pathname.startsWith("/api/auth");
  const isCron = req.nextUrl.pathname.startsWith("/api/cron");

  if (isPublicForm || isApiAuth || isCron) return NextResponse.next();
  if (!isLoggedIn && !isLogin) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
