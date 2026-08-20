
import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import prisma from "../lib/prisma.js";

const router = Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    console.log("Google auth request received");

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is missing");

      return res.status(500).json({
        message: "Google Client ID is not configured",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        message: "Invalid Google credential",
      });
    }

    if (!payload.sub || !payload.email) {
      return res.status(401).json({
        message: "Google account information is incomplete",
      });
    }

    console.log("Google user:", payload.email);

    /*
     * Create the user if this is their first login.
     * Otherwise update their latest Google profile information.
     */
    const user = await prisma.user.upsert({
      where: {
        id: payload.sub,
      },

      update: {
        name: payload.name ?? null,
        email: payload.email,
        picture: payload.picture ?? null,
      },

      create: {
        id: payload.sub,
        name: payload.name ?? null,
        email: payload.email,
        picture: payload.picture ?? null,
      },
    });

    console.log("User saved successfully:", user.email);

    return res.status(200).json({
      message: "Google authentication successful",
      user,
    });

  } catch (error) {
  console.error("Google authentication failed:", error);

  if (error instanceof Error) {
    console.error("Google error message:", error.message);
  }

  return res.status(401).json({
    message: "Invalid Google credential",
  });
}
});

export default router;
