import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { json } from "../../lib/response.mjs";
import { hashPassword } from "../../lib/crypto.mjs";
import { validate } from "../../lib/validator.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["email", "password", "name"],
  additionalProperties: false,
  properties: {
    email: { type: "string", minLength: 3, maxLength: 200 },
    password: { type: "string", minLength: 6, maxLength: 200 },
    name: { type: "string", minLength: 1, maxLength: 120 }
  }
};

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { ok, errors } = validate(schema, body);
    if (!ok) return json(400, { message: "Invalid payload", errors });

    const email = body.email.trim().toLowerCase();
    const name = body.name.trim();

    // Finns användaren redan?
    const userKey = { pk: { S: `USER#${email}` }, sk: { S: "PROFILE" } };
    const existing = await client.send(new GetItemCommand({ TableName: TABLE_NAME, Key: userKey }));
    if (existing.Item) return json(409, { message: "User already exists" });

    const pwdHash = await hashPassword(body.password);
    const userId = uuid();
    const now = new Date().toISOString();

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
      ConditionExpression: "attribute_not_exists(pk)" // dubbel-skydd
    }));

    return json(201, { userId, email, name, createdAt: now });
  } catch (err) {
    console.error("register error", err);
    return json(500, { message: "Internal error" });
  }
};
