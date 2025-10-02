import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { json } from "../../lib/response.mjs";
import { validate } from "../../lib/validator.mjs";
import { getUserFromEvent } from "../../lib/auth.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["title"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 120 }
  }
};

export const handler = withHttp(async (event) => {
  const me = getUserFromEvent(event);
  if (!me) return json(401, { message: "Unauthorized" });

  const body = event.body || {};
  const { ok, errors } = validate(schema, body);
  if (!ok) return json(400, { message: "Invalid payload", errors });

  const quizId = uuid();
  const now = new Date().toISOString();

  // 1) Aggregatorn för listning på /quizzes
  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: { S: "QUIZZES" },
      sk: { S: `QUIZ#${quizId}` },
      title: { S: body.title },
      ownerId: { S: me.sub },
      ownerName: { S: me.name || "" },
      createdAt: { S: now }
    },
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
  }));

  // 2) META-posten (krävs av get/addQuestion/delete/submitScore)
  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: { S: `QUIZ#${quizId}` },
      sk: { S: "META" },
      title: { S: body.title },
      ownerId: { S: me.sub },
      ownerName: { S: me.name || "" },
      createdAt: { S: now }
    },
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"
  }));

  return json(201, { quizId, title: body.title, createdAt: now });
});
