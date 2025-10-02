 import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { json } from "../../lib/response.mjs";
import { hashPassword } from "../../lib/crypto.mjs";
import { validate } from "../../lib/validator.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["email", "password", "name"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3, maxLength: 200 },
    password: { type: "string", minLength: 6, maxLength: 200 },
    name: { type: "string", minLength: 1, maxLength: 100 }
  }
};

export const handler = withHttp(async (event) => {
  const body = event.body || {};
  const { ok, errors } = validate(schema, body);
  if (!ok) return json(400, { message: "Invalid payload", errors });

  // Normalisera/trimma – undviker case-dubletter mm.
  const email = String(body.email).trim().toLowerCase();
  const name = String(body.name).trim();
  const password = String(body.password);

  const userId = uuid();
  const now = new Date().toISOString();
  const pwdHash = await hashPassword(password);

  try {
    // Skapa användaren; skydda mot dubletter
    await client.send(new PutItemCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: { S: `USER#${email}` },
        sk: { S: "PROFILE" },
        userId: { S: userId },
        email: { S: email },
        name: { S: name },
        pwdHash: { S: pwdHash },
        createdAt: { S: now }
      },
      // Låt det bara gå igenom om posten inte redan finns
      ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
    }));
  } catch (err) {
    // Vanligast: ConditionalCheckFailedException = e-post finns redan
    if (err && (err.name === "ConditionalCheckFailedException" || err.Code === "ConditionalCheckFailedException")) {
      return json(409, { message: "Email already registered" });
    }
    console.error("REGISTER_FAILED", err);
    return json(500, { message: "Internal error", code: "REGISTER_FAILED" });
  }

  return json(201, { userId, email, name, createdAt: now });
});
