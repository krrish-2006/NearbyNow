type MonitoringContext = Record<string, string | number | boolean | null | undefined>;

function writeStructuredLog(
  level: "info" | "error",
  message: string,
  context: MonitoringContext,
) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  const serializedPayload = JSON.stringify(payload);

  if (level === "error") {
    console.error(serializedPayload);
    return;
  }

  console.log(serializedPayload);
}

export function logServerEvent(message: string, context: MonitoringContext = {}) {
  writeStructuredLog("info", message, context);
}

export async function reportServerError(
  error: unknown,
  context: MonitoringContext = {},
) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  writeStructuredLog("error", errorMessage, {
    ...context,
    error: errorMessage,
  });

  if (!process.env.ERROR_WEBHOOK_URL) {
    return;
  }

  try {
    await fetch(process.env.ERROR_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: errorMessage,
        timestamp: new Date().toISOString(),
        context,
      }),
    });
  } catch (webhookError) {
    writeStructuredLog("error", "Failed to send error webhook", {
      originalError: errorMessage,
      webhookError:
        webhookError instanceof Error
          ? webhookError.message
          : String(webhookError),
    });
  }
}
