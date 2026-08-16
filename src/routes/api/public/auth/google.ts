import { createFileRoute } from "@tanstack/react-router";
import {
  buildGoogleAuthUrl,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "@/lib/google-oauth.server";

export const Route = createFileRoute("/api/public/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env["ClientID"];
        if (!clientId) {
          return new Response("Missing ClientID environment variable", {
            status: 500,
          });
        }

        const state = generateState();
        const verifier = generateCodeVerifier();
        const challenge = generateCodeChallenge(verifier);
        const nonce = generateState();

        const origin = new URL(request.url).origin;
        const redirectUri = `${origin}/api/public/auth/callback`;

        const url = buildGoogleAuthUrl({
          clientId,
          redirectUri,
          state,
          codeChallenge: challenge,
          nonce,
        });

        const cookieValue = JSON.stringify({ state, verifier, nonce });
        const headers = new Headers();
        headers.set(
          "Set-Cookie",
          `vexion_oauth=${encodeURIComponent(cookieValue)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`,
        );
        headers.set("Location", url);

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
