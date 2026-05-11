import jwt from "jsonwebtoken";

export default {
  id: "auth-resend-verify",
  handler: (router, { services, getSchema, env, logger }) => {
    router.post("/", async (req, res) => {
      try {
        if (!req.accountability?.user) {
          return res.status(401).json({ error: "Authentication required" });
        }

        const userId = req.accountability.user;
        const schema = await getSchema();
        const usersService = new services.UsersService({ schema, accountability: { admin: true } });

        const user = await usersService.readOne(userId, {
          fields: ["id", "email", "email_verified"],
        });

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.email_verified) {
          return res.status(400).json({ error: "Email already verified" });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, scope: "email-verify" },
          env.SECRET,
          { expiresIn: "24h", issuer: "directus" }
        );

        await usersService.updateOne(user.id, {
          email_verification_token: token,
        });

        const publicUrl = env.PUBLIC_URL || "https://verscienta.com";
        const verifyUrl = `${publicUrl}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

        const mailService = new services.MailService({ schema });
        await mailService.send({
          to: user.email,
          subject: "Verify your Verscienta Health email",
          template: {
            name: "user-invitation",
            data: { url: verifyUrl, email: user.email },
          },
          text: `Click this link to verify your email: ${verifyUrl}`,
        });

        return res.status(200).json({ success: true });
      } catch (err) {
        logger.error({ err }, "auth-resend-verify failed");
        return res.status(500).json({ error: "Failed to send verification email" });
      }
    });
  },
};
