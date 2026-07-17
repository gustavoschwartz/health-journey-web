const API_URL = import.meta.env.VITE_API_URL;

function getTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Reads an SSE-over-POST response body and yields parsed `data: {...}` payloads.
 * Buffers across chunk boundaries since a JSON event can split mid-line.
 */
async function* parseSSEStream(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload) continue;
      try {
        yield JSON.parse(payload);
      } catch {
        // ignore malformed event
      }
    }
  }

  const trimmed = buffer.trim();
  if (trimmed.startsWith("data:")) {
    const payload = trimmed.slice(5).trim();
    if (payload) {
      try {
        yield JSON.parse(payload);
      } catch {
        // ignore malformed trailing event
      }
    }
  }
}

export async function* streamConversation({ sessionId, message }) {
  const response = await fetch(`${API_URL}/conversation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      timezone: getTimezone(),
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Conversation request failed: ${response.status}`);
  }

  yield* parseSSEStream(response);
}

export async function* streamSync({ lastSyncedDate }) {
  const response = await fetch(`${API_URL}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      timezone: getTimezone(),
      last_synced_date: lastSyncedDate,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`Sync request failed: ${response.status}`);
  }

  yield* parseSSEStream(response);
}

export async function submitCheckin({ date, field, value, stravaId }) {
  const response = await fetch(`${API_URL}/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date,
      field,
      value: value ?? null,
      strava_id: stravaId ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Checkin request failed: ${response.status}`);
  }

  return response.json();
}

export async function getAlcoholEntries({ date }) {
  const response = await fetch(
    `${API_URL}/checkin/alcohol?date=${encodeURIComponent(date)}`,
  );

  if (!response.ok) {
    throw new Error(`Get alcohol entries failed: ${response.status}`);
  }

  return response.json();
}

export async function submitAlcoholEntry({ date, type, drinks, entryId }) {
  const response = await fetch(`${API_URL}/checkin/alcohol`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date,
      type,
      drinks,
      entry_id: entryId ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error(`Alcohol entry request failed: ${response.status}`);
  }

  return response.json();
}

export async function deleteAlcoholEntry({ entryId }) {
  const response = await fetch(
    `${API_URL}/checkin/alcohol/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
  );

  if (!response.ok) {
    throw new Error(`Delete alcohol entry failed: ${response.status}`);
  }

  return response.json();
}
