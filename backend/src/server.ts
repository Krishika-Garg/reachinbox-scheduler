import "dotenv/config";
import cors from "cors";
import express from "express";
import multer from "multer";

import prisma from "./lib/prisma.js";
import { emailQueue } from "./queue/email.queue.js";
import { extractEmailsFromCsv } from "./services/csv.service.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
});

/*
 * ============================================================
 * AUTH
 * ============================================================
 */

app.use("/api/auth", authRoutes);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get("/", (_req, res) => {
  res.send("ReachInbox backend is running!");
});

/*
 * ============================================================
 * GET ALL EMAILS
 * ============================================================
 */

app.get("/api/emails", async (_req, res) => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      emails,
    });
  } catch (error) {
    console.error(
      "Failed to fetch emails:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch emails",
    });
  }
});

/*
 * ============================================================
 * SCHEDULE ONE EMAIL
 * ============================================================
 *
 * Frontend sends:
 *
 * {
 *   recipient,
 *   subject,
 *   body,
 *   scheduledAt,
 *   delaySeconds,
 *   hourlyLimit
 * }
 *
 * delaySeconds and hourlyLimit are passed to BullMQ
 * and eventually used by the worker/rate limiter.
 */

app.post(
  "/api/emails/schedule",
  async (req, res) => {
    try {
      const {
        recipient,
        subject,
        body,
        scheduledAt,
        delaySeconds,
        hourlyLimit,
      } = req.body;

      /*
       * Validate required fields.
       */
      if (
        !recipient ||
        !subject ||
        !body ||
        !scheduledAt
      ) {
        return res.status(400).json({
          message:
            "recipient, subject, body and scheduledAt are required",
        });
      }

      /*
       * Convert scheduledAt to Date.
       */
      const scheduledDate =
        new Date(scheduledAt);

      /*
       * Validate date.
       */
      if (
        Number.isNaN(
          scheduledDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid scheduledAt date",
        });
      }

      /*
       * Convert user settings to numbers.
       *
       * Defaults:
       * delay = 0 seconds
       * hourly limit = 200 emails/hour
       */
      const delaySecondsNumber =
        Number(delaySeconds) >= 0
          ? Number(delaySeconds)
          : 0;

      const hourlyLimitNumber =
        Number(hourlyLimit) > 0
          ? Number(hourlyLimit)
          : 200;

      /*
       * Create email in PostgreSQL.
       *
       * We are keeping the current senderId
       * approach so we don't need another Prisma
       * migration right now.
       */
      const email =
        await prisma.email.create({
          data: {
            senderId:
              "default-sender",
            recipient,
            subject,
            body,
            scheduledAt:
              scheduledDate,
          },
        });

      /*
       * Calculate BullMQ delay.
       */
      const delay = Math.max(
        0,
        scheduledDate.getTime() -
          Date.now()
      );

      /*
       * Add job to BullMQ.
       *
       * IMPORTANT:
       * User's hourly limit and delay are stored
       * in the job data.
       */
      await emailQueue.add(
        "send-email",
        {
          emailId: email.id,
          hourlyLimit:
            hourlyLimitNumber,
          delaySeconds:
            delaySecondsNumber,
        },
        {
          delay,
          jobId: email.id,
        }
      );

      console.log(
        `Email ${email.id} scheduled`,
        {
          delaySeconds:
            delaySecondsNumber,
          hourlyLimit:
            hourlyLimitNumber,
          scheduledAt:
            scheduledDate.toISOString(),
        }
      );

      return res.status(201).json({
        message:
          "Email scheduled successfully",
        email,
      });
    } catch (error) {
      console.error(
        "Failed to schedule email:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to schedule email",
      });
    }
  }
);

/*
 * ============================================================
 * BULK SCHEDULE EMAILS
 * ============================================================
 *
 * Used when a CSV recipient list is uploaded.
 */

app.post(
  "/api/emails/bulk-schedule",
  upload.single("file"),
  async (req, res) => {
    try {
      console.log(
        "Content-Type:",
        req.headers["content-type"]
      );

      console.log(
        "Body received:",
        req.body
      );

      console.log(
        "File received:",
        req.file?.originalname
      );

      const {
        subject,
        body,
        startTime,
        delayBetweenEmails,
        hourlyLimit,
      } = req.body;

      /*
       * Validate fields.
       */
      if (
        !subject ||
        !body ||
        !startTime ||
        delayBetweenEmails ===
          undefined ||
        hourlyLimit === undefined
      ) {
        return res.status(400).json({
          message:
            "subject, body, startTime, delayBetweenEmails and hourlyLimit are required",
        });
      }

      /*
       * Validate CSV.
       */
      if (!req.file) {
        return res.status(400).json({
          message:
            "CSV file is required",
        });
      }

      /*
       * Parse start time.
       */
      const startDate =
        new Date(startTime);

      if (
        Number.isNaN(
          startDate.getTime()
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid startTime",
        });
      }

      /*
       * Convert numeric settings.
       */
      const delaySeconds =
        Number(
          delayBetweenEmails
        );

      const hourlyLimitNumber =
        Number(hourlyLimit);

      /*
       * Validate delay.
       */
      if (
        !Number.isFinite(
          delaySeconds
        ) ||
        delaySeconds < 0
      ) {
        return res.status(400).json({
          message:
            "Invalid delayBetweenEmails",
        });
      }

      /*
       * Validate hourly limit.
       */
      if (
        !Number.isFinite(
          hourlyLimitNumber
        ) ||
        hourlyLimitNumber <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid hourlyLimit",
        });
      }

      /*
       * Read CSV.
       */
      const csvContent =
        req.file.buffer.toString(
          "utf-8"
        );

      const emails =
        extractEmailsFromCsv(
          csvContent
        );

      if (emails.length === 0) {
        return res.status(400).json({
          message:
            "No email addresses found in CSV",
        });
      }

      const createdEmails = [];

      /*
       * Create one database record and
       * one BullMQ job per recipient.
       */
      for (
        let i = 0;
        i < emails.length;
        i++
      ) {
        const recipient =
          emails[i];

        const scheduledDate =
          new Date(
            startDate.getTime() +
              i *
                delaySeconds *
                1000
          );

        const email =
          await prisma.email.create({
            data: {
              senderId:
                "default-sender",
              recipient,
              subject,
              body,
              scheduledAt:
                scheduledDate,
            },
          });

        const delay =
          Math.max(
            0,
            scheduledDate.getTime() -
              Date.now()
          );

        /*
         * Pass the same user-configured
         * settings to every job.
         */
        await emailQueue.add(
          "send-email",
          {
            emailId: email.id,
            hourlyLimit:
              hourlyLimitNumber,
            delaySeconds:
              delaySeconds,
          },
          {
            delay,
            jobId: email.id,
          }
        );

        createdEmails.push(
          email
        );
      }

      console.log(
        `Created and scheduled ${createdEmails.length} emails`,
        {
          hourlyLimit:
            hourlyLimitNumber,
          delaySeconds,
        }
      );

      return res.status(201).json({
        message:
          "Bulk emails scheduled successfully",
        totalEmails:
          createdEmails.length,
        emails:
          createdEmails,
      });
    } catch (error) {
      console.error(
        "Failed to process bulk email request:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to process bulk email request",
      });
    }
  }
);

/*
 * ============================================================
 * START SERVER
 * ============================================================
 */

app.listen(PORT,"0.0.0.0", () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});