export default function middleware(request: Request) {
  const redirectUrl = process.env.VITE_REDIRECT_URL
  if (!redirectUrl) return

  const url = new URL(request.url)
  if (url.searchParams.has('tgWebAppData')) return

  return Response.redirect(redirectUrl, 301)
}

export const config = {
  matcher: ['/((?!assets/|favicon.ico).*)'],
}
