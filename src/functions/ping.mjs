import { json } from "../lib/response.mjs";
import { withHttp } from "../lib/middy.mjs";

export const handler = withHttp(async () => {
  return json(200, { ok: true, service: "quiztopia-api", ts: Date.now() });
});
