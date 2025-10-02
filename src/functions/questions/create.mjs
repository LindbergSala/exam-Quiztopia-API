import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { v4 as uuid } from "uuid";
import { json } from "../../lib/response.mjs";
import { validate } from "../../lib/validator.mjs";
import { getUserFromEvent } from "../../lib/auth.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["text", "answer", "lat", "lon"],
  additionalProperties: false,
  properties: {
    text: { type: "string", minLength: 1, maxLength: 500 },
    answer: { type: "string", minLength: 1, maxLength: 200 },
    lat: { type: "number", minimum: -90, maximum: 90 },
    lon: { type: "number", minimum: -180, maximum: 180 }
  }
};

export const handler = withHttp(async (event) => {
  const me = getUserFromEvent(event);
  if (!me) return json(401, { message: "Unauthorized" });

  const quizId = event.pathParameters?.quizId;
  if (!quizId) return json(400, { message: "Missing quizId" });

  const body = event.body;
  const { ok, errors } = validate(schema, body);
  if (!ok) return json(400, { message: "Invalid payload", errors });

  const pk = `QUIZ#${quizId}`;

  const { Item: meta } = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: pk }, sk: { S: "META" } }
  }));
  if (!meta) return json(404, { message: "Quiz not found" });

  const ownerId = meta.ownerId?.S;
  if (ownerId !== me.sub) return json(403, { message: "Forbidden" });

  const questionId = uuid();
  const now = new Date().toISOString();

  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: { S: pk },
      sk: { S: `Q#${questionId}` },
      text: { S: body.text },
      answer: { S: body.answer },
      lat: { N: String(body.lat) },
      lon: { N: String(body.lon) },
      createdAt: { S: now }
    },
    ConditionExpression: "attribute_not_exists(pk) OR attribute_not_exists(sk)"
  }));

  return json(201, {
    quizId,
    questionId,
    text: body.text,
    answer: body.answer,
    lat: body.lat,
    lon: body.lon,
    createdAt: now
  });
});
