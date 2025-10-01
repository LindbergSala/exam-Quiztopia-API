import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { unmarshalList } from "../../lib/ddb.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async () => {
  try {
    const { Items } = await client.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: { "#pk": "pk" },
      ExpressionAttributeValues: { ":pk": { S: "QUIZZES" } }
    }));

    // Förväntade fält: title, ownerName, ownerId, sk = "QUIZ#<id>"
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
  } catch (err) {
    console.error("getQuizzes error", err);
    return json(500, { message: "Internal error" });
  }
};
