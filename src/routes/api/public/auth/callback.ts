import { createFileRoute } from "@tanstack/react-router";
import {
  createServerSupabaseClient,
  exchangeGoogleCode,
} from "@/lib/google-oauth.server";

export const Route = createFileRoute("/api/public/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          return new Response(`Google OAuth error: ${error}`, {
            status: 400,
          });
        }
        if (!code || !state) {
          return new Response("Missing code or state", { status: 400 });
        }

        const cookieHeader = request.headers.get("cookie") || "";
        const oauthCookie = cookieHeader
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith("vexion_oauth="));

        if (!oauthCookie) {
          return new Response("Missing OAuth state cookie", { status: 400 });
        }

        let stored: { state: string; verifier: string; nonce: string };
        try {
          const rawValue = oauthCookie.split("=")[1];
          if (!rawValue) throw new Error("empty cookie value");
          stored = JSON.parse(decodeURIComponent(rawValue)) as typeof stored;
        } catch {
          return new Response("Invalid OAuth state cookie", { status: 400 });
        }

        if (stored.state !== state) {
          return new Response("Invalid OAuth state", { status: 400 });
        }

        const clientId = process.env["ClientID"];
        const clientSecret = process.env["ClientSecret"];
        if (!clientId || !clientSecret) {
          return new Response(
            "Missing ClientID or ClientSecret environment variable",
            { status: 500 },
          );
        }

        const origin = url.origin;
        const redirectUri = `${origin}/api/public/auth/callback`;

        try {
          const tokens = await exchangeGoogleCode({
            clientId,
            clientSecret,
            redirectUri,
            code,
            codeVerifier: stored.verifier,
          });

          const supabase = createServerSupabaseClient();
          const { data, error: signInError } =
            await supabase.auth.signInWithIdToken({
              provider: "google",
              token: tokens.id_token,
            });

          if (signInError || !data.session) {
            return new Response(
              `Supabase sign in failed: ${signInError?.message || "no session"}`,
              { status: 500 },
            );
          }

          const { access_token, refresh_token } = data.session;
          const redirectTo = `/auth#access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`;

          const headers = new Headers();
          headers.set(
            "Set-Cookie",
            "vexion_oauth=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
          );
          headers.set("Location", redirectTo);

          return new Response(null, { status: 302, headers });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return new Response(`OAuth callback error: ${message}`, {
            status: 500,
          });
        }
      },
    },
  },
});
