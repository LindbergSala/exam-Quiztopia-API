import { Buffer } from 'node:buffer';
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { verifyPassword } from "../../lib/crypto.mjs";
import { signJwt } from "../../lib/jwt.mjs";
import { validate } from "../../lib/validator.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["email", "password"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3, maxLength: 200 },
    password: { type: "string", minLength: 6, maxLength: 200 }
  }
};

export const handler = withHttp(async (event) => {
  const body = event.body; // Middy har redan parsat JSON
  const { ok, errors } = validate(schema, body);
  if (!ok) return json(400, { message: "Invalid payload", errors });

  const email = body.email.trim().toLowerCase();

  const { Item } = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: `USER#${email}` }, sk: { S: "PROFILE" } }
  }));

  if (!Item) return json(401, { message: "Invalid credentials" });

  const pwdHash = Item.pwdHash.S;
  const passOk = await verifyPassword(body.password, pwdHash);
  if (!passOk) return json(401, { message: "Invalid credentials" });

  const token = signJwt(
    { sub: Item.userId.S, email: Item.email.S, name: Item.name.S },
    "7d"
  );

  return json(200, { token });
});
