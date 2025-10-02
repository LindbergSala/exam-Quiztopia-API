import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { unmarshalList } from "../../lib/ddb.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = withHttp(async (event) => {
  const quizId = event.pathParameters?.quizId;
  if (!quizId) return json(400, { message: "Missing quizId" });

  const limit = Math.min(
    100,
    Math.max(1, parseInt(event.queryStringParameters?.limit ?? "10", 10))
  );

  const pk = `QUIZ#${quizId}`;

  const { Items } = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: "GSI1",
    KeyConditionExpression: "#gpk = :gpk",
    ExpressionAttributeNames: { "#gpk": "GSI1PK" },
    ExpressionAttributeValues: { ":gpk": { S: pk } },
    Limit: limit
  }));

  const rows = unmarshalList(Items).map((x) => ({
    userId: x.userId,
    userName: x.userName,
    points: x.points,
    createdAt: x.createdAt
  }));

  return json(200, { quizId, leaderboard: rows });
});
