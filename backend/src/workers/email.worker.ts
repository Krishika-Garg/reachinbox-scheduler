import "dotenv/config";
import { Queue, Worker } from "bullmq";
import prisma from "../lib/prisma.js";
import { sendEmail } from "../services/mail.service.js";
import { reserveSendSlot } from "../services/rate-limit.service.js";

const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
};

/*
 * Queue instance used to create delayed retry jobs.
 */
const emailQueue = new Queue("email-queue", {
  connection: redisConnection,
});

/*
 * Worker responsible for processing scheduled emails.
 */
const worker = new Worker(
  "email-queue",
  async (job) => {
    const {
      emailId,
      hourlyLimit,
      delaySeconds,
    } = job.data;

    console.log(`Processing email ${emailId}`);

    /*
     * Find the email in PostgreSQL.
     */
    const email = await prisma.email.findUnique({
      where: {
        id: emailId,
      },
    });

    if (!email) {
      throw new Error(`Email ${emailId} not found`);
    }

    /*
     * Idempotency protection.
     *
     * Only an email currently in "scheduled" state
     * can be claimed by a worker.
     */
    const claimedEmail =
      await prisma.email.updateMany({
        where: {
          id: emailId,
          status: "scheduled",
        },
        data: {
          status: "processing",
        },
      });

    if (claimedEmail.count === 0) {
      console.log(
        `Email ${emailId} was already processed or claimed. Skipping.`
      );

      return {
        success: true,
        skipped: true,
      };
    }

    /*
     * Convert frontend delay from seconds to milliseconds.
     */
    const sendDelayMs =
      Math.max(
        Number(delaySeconds) || 0,
        0
      ) * 1000;

    /*
     * User-configured hourly limit.
     *
     * If no value was supplied, use 200 as a
     * safe fallback.
     */
    const maxEmailsPerHour =
      Number(hourlyLimit) > 0
        ? Number(hourlyLimit)
        : 200;

    console.log(
      `Rate limit config for ${emailId}:`,
      {
        maxEmailsPerHour,
        sendDelayMs,
      }
    );

    /*
     * Ask Redis for a send slot.
     */
    const rateLimit =
      await reserveSendSlot(
        email.senderId,
        maxEmailsPerHour,
        sendDelayMs
      );

    /*
     * Rate limit reached.
     *
     * Put the email back into scheduled state
     * and create a NEW delayed BullMQ job.
     */
    if (
      !rateLimit.allowed &&
      rateLimit.retryAt
    ) {
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "scheduled",
        },
      });

      const delay = Math.max(
        rateLimit.retryAt.getTime() -
          Date.now(),
        1000
      );

      console.log(
        `Rate limit reached. Rescheduling email ${emailId} in ${delay}ms`
      );

      await emailQueue.add(
        "send-email",
        {
          emailId,
          hourlyLimit:
            maxEmailsPerHour,
          delaySeconds,
        },
        {
          jobId:
            `${emailId}:retry:${rateLimit.retryAt.getTime()}`,
          delay,
        }
      );

      /*
       * Current job completes normally.
       * The delayed retry job will handle the email later.
       */
      return {
        success: true,
        rescheduled: true,
      };
    }

    /*
     * Safety check.
     */
    if (
      !rateLimit.allowed ||
      !rateLimit.sendAt
    ) {
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "scheduled",
        },
      });

      throw new Error(
        "Unable to reserve email send slot"
      );
    }

    /*
     * Redis has assigned a specific send time.
     *
     * Wait until that time before sending.
     */
    const waitTime =
      rateLimit.sendAt.getTime() -
      Date.now();

    if (waitTime > 0) {
      console.log(
        `Waiting ${waitTime}ms before sending email ${emailId}`
      );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            waitTime
          )
      );
    }

    /*
     * Send the actual email.
     */
    try {
      console.log(
        `Sending email to ${email.recipient}`
      );

      await sendEmail({
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
      });

      /*
       * Mark email as successfully sent.
       */
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "sent",
          sentAt: new Date(),
          error: null,
        },
      });

      console.log(
        `Email ${emailId} marked as sent`
      );

      return {
        success: true,
      };
    } catch (error) {
      /*
       * Actual email sending failure.
       */
      await prisma.email.update({
        where: {
          id: emailId,
        },
        data: {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unknown email error",
        },
      });

      console.error(
        `Failed to send email ${emailId}:`,
        error
      );

      throw error;
    }
  },
  {
    connection: redisConnection,

    /*
     * Multiple emails can be processed concurrently.
     * Redis controls the actual sending rate.
     */
    concurrency: 5,
  }
);

/*
 * BullMQ job completed.
 */
worker.on("completed", (job) => {
  console.log(
    `Job ${job.id} completed`
  );
});

/*
 * BullMQ job failed.
 */
worker.on("failed", (job, error) => {
  console.error(
    `Job ${job?.id} failed:`,
    error
  );
});

console.log(
  "Email worker is running..."
);