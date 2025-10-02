import {
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { validate } from "../../lib/validator.mjs";
import { getUserFromEvent } from "../../lib/auth.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

const schema = {
  type: "object",
  required: ["points"],
  additionalProperties: false,
  properties: {
    points: { type: "number", minimum: 0, maximum: 1000000 }
  }
};

function padNegPoints(points) {
  const max = 1_000_000;
  const neg = Math.max(0, max - Math.floor(points));
  return String(neg).padStart(7, "0");
}

export const handler = withHttp(async (event) => {
  const me = getUserFromEvent(event);
  if (!me) return json(401, { message: "Unauthorized" });

  const quizId = event.pathParameters?.quizId;
  if (!quizId) return json(400, { message: "Missing quizId" });

  const body = event.body;
  const { ok, errors } = validate(schema, body);
  if (!ok) return json(400, { message: "Invalid payload", errors });

  const pk = `QUIZ#${quizId}`;

  const { Item } = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: pk }, sk: { S: "META" } }
  }));
  if (!Item) return json(404, { message: "Quiz not found" });

  const now = new Date().toISOString();
  const gsiSk = `SCORE#${padNegPoints(body.points)}#${now}#${me.sub}`;

  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      pk: { S: pk },
      sk: { S: `SCORE#${now}#${me.sub}` },
      points: { N: String(Math.floor(body.points)) },
      userId: { S: me.sub },
      userName: { S: me.name || "" },
      createdAt: { S: now },
      GSI1PK: { S: pk },
      GSI1SK: { S: gsiSk }
    }
  }));

  return json(201, {
    quizId,
    userId: me.sub,
    userName: me.name || "",
    points: Math.floor(body.points),
    createdAt: now
  });
});
