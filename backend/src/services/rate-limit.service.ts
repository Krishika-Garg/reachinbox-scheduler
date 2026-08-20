import redis from "../lib/redis.js";

export async function reserveSendSlot(
  senderId: string,
  maxEmailsPerHour: number,
  sendDelayMs: number
) {
  const now = Date.now();

  /*
   * If the user enters 0 for hourly limit,
   * treat it as unlimited.
   */
  if (maxEmailsPerHour <= 0) {
    return {
      allowed: true,
      sendAt: new Date(now),
      retryAt: null,
    };
  }

  /*
   * Fixed one-hour Redis window.
   */
  const hourWindow = Math.floor(
    now / (60 * 60 * 1000)
  );

  const rateKey =
    `email-rate:${senderId}:${hourWindow}`;

  const delayKey =
    `email-delay:${senderId}`;

  const nextHour =
    (hourWindow + 1) *
    60 *
    60 *
    1000;

  const script = `
    local rateKey = KEYS[1]
    local delayKey = KEYS[2]

    local now = tonumber(ARGV[1])
    local maxEmails = tonumber(ARGV[2])
    local delay = tonumber(ARGV[3])

    local currentCount =
      tonumber(redis.call("GET", rateKey) or "0")

    if currentCount >= maxEmails then
      return {0, 0}
    end

    local nextAvailable =
      tonumber(redis.call("GET", delayKey) or "0")

    local sendTime = now

    if nextAvailable > now then
      sendTime = nextAvailable
    end

    local nextSlot =
      sendTime + delay

    redis.call(
      "INCR",
      rateKey
    )

    redis.call(
      "EXPIRE",
      rateKey,
      7200
    )

    redis.call(
      "SET",
      delayKey,
      nextSlot
    )

    redis.call(
      "EXPIRE",
      delayKey,
      7200
    )

    return {1, sendTime}
  `;

  const result = await redis.eval(
    script,
    2,
    rateKey,
    delayKey,
    now.toString(),
    maxEmailsPerHour.toString(),
    sendDelayMs.toString()
  );

  const [
    allowed,
    sendTime,
  ] = result as [number, number];

  if (allowed === 0) {
    return {
      allowed: false,
      sendAt: null,
      retryAt: new Date(nextHour),
    };
  }

  return {
    allowed: true,
    sendAt: new Date(sendTime),
    retryAt: null,
  };
}