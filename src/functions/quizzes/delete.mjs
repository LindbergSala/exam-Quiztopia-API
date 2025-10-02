import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  BatchWriteItemCommand,
  DeleteItemCommand
} from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { getUserFromEvent } from "../../lib/auth.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

async function batchDeleteAll(tableName, keys) {
  for (let i = 0; i < keys.length; i += 25) {
    const slice = keys.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } }));
    await client.send(new BatchWriteItemCommand({ RequestItems: { [tableName]: slice } }));
  }
}

export const handler = withHttp(async (event) => {
  const me = getUserFromEvent(event);
  if (!me) return json(401, { message: "Unauthorized" });

  const quizId = event.pathParameters?.quizId;
  if (!quizId) return json(400, { message: "Missing quizId" });

  const pk = `QUIZ#${quizId}`;

  const { Item: meta } = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: pk }, sk: { S: "META" } }
  }));
  if (!meta) return json(404, { message: "Quiz not found" });

  const ownerId = meta.ownerId?.S;
  if (ownerId !== me.sub) return json(403, { message: "Forbidden" });

  const allItems = [];
  let ExclusiveStartKey;
  do {
    const page = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "pk" },
      ExpressionAttributeValues: { ":pk": { S: pk } },
      ExclusiveStartKey
    }));
    allItems.push(...(page.Items || []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  const keys = allItems.map((it) => ({ pk: { S: it.pk.S }, sk: { S: it.sk.S } }));
  await batchDeleteAll(TABLE_NAME, keys);

  await client.send(new DeleteItemCommand({
    TableName: TABLE_NAME,
    Key: { pk: { S: "QUIZZES" }, sk: { S: `QUIZ#${quizId}` } }
  }));

  return json(200, { message: "Quiz deleted", quizId });
});
