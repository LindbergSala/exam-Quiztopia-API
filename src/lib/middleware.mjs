import { json } from "./response.mjs";

// Grund: fånga fel, logga snyggt, returnera 500
export function safeHandler(fn) {
  return async (event, context) => {
    try {
      // Normalisera body: om redan objekt, använd det; annars försök parsa
      if (typeof event.body === "string") {
        try { event.body = event.body ? JSON.parse(event.body) : {}; } catch { /* lämna som sträng */ }
      } else if (event.body == null) {
        event.body = {};
      }

      const res = await fn(event, context);

      // Säkerställ CORS även om någon råkar bygga eget svar
      if (res && res.headers) {
        res.headers["access-control-allow-origin"] ??= "*";
        res.headers["access-control-allow-headers"] ??= "Content-Type,Authorization";
        res.headers["access-control-allow-methods"] ??= "GET,POST,DELETE,PUT,OPTIONS";
      }
      return res;
    } catch (err) {
      console.error("UNCAUGHT", {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
      });
      return json(500, { message: "Internal error" });
    }
  };
}
