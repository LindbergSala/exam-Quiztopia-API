import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { unmarshalList } from "../../lib/ddb.mjs";
import { withHttp } from "../../lib/middy.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = withHttp(async () => {
  const { Items } = await client.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk",
    ExpressionAttributeNames: { "#pk": "pk" },
    ExpressionAttributeValues: { ":pk": { S: "QUIZZES" } }
  }));

  const list = unmarshalList(Items).map((x) => {
    const quizId = x.sk?.replace("QUIZ#", "");
    return {
      quizId,
      title: x.title,
      ownerId: x.ownerId,
      ownerName: x.ownerName,
      createdAt: x.createdAt
    };
  });

  return json(200, { quizzes: list });
});
