// src/functions/quizzes/get.mjs
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand
} from "@aws-sdk/client-dynamodb";
import { json } from "../../lib/response.mjs";
import { unmarshal, unmarshalList } from "../../lib/ddb.mjs";
import { getUserFromEvent } from "../../lib/auth.mjs";

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  try {
    // Kräver inloggning
    const me = getUserFromEvent(event);
    if (!me) {
      return json(401, { message: "Unauthorized" });
    }

    const quizId = event.pathParameters?.quizId;
    if (!quizId) {
      return json(400, { message: "Missing quizId" });
    }

    const pk = `QUIZ#${quizId}`;

    // Hämta META
    const { Item } = await client.send(
      new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { pk: { S: pk }, sk: { S: "META" } }
      })
    );

    if (!Item) {
      return json(404, { message: "Quiz not found" });
    }

    const meta = unmarshal(Item);

    // Hämta frågor (alla poster där sk börjar med "Q#")
    const { Items } = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "#pk = :pk AND begins_with(#sk, :pref)",
        ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
        ExpressionAttributeValues: { ":pk": { S: pk }, ":pref": { S: "Q#" } }
      })
    );

    const questions = unmarshalList(Items).map((q) => ({
      questionId: q.sk?.replace("Q#", ""),
      text: q.text,
      answer: q.answer,
      lat: q.lat,
      lon: q.lon,
      createdAt: q.createdAt
    }));

    return json(200, { ...meta, questions });
  } catch (err) {
    console.error("GET /quizzes/{quizId} error:", err);
    return json(500, { message: "Internal Server Error" });
  }
};
