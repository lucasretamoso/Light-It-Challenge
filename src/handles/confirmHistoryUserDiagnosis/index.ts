import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import jwt_decode from "jwt-decode";
import { UserModel } from "../../models/userModel";
import { StorageService } from "../../services/storageService";
import * as AWS from 'aws-sdk';
import { HistoryModel } from "../../models/historyModel";

const s3 = new AWS.S3();

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const bucketName = process.env.BUCKET_NAME;

    const body = JSON.parse(event.body || '{}');
    const id = event.pathParameters?.id;

    if (!("functionality" in body)) {
      return {
        body: JSON.stringify({
          message: "functionality is required",
        }),
        statusCode: 400,
      };
    }

    if (typeof body.functionality !== 'boolean') {
      return {
        body: JSON.stringify({
          message: "functionality must be a boolean",
        }),
        statusCode: 400,
      };
    }

    const functionality = body.functionality;

    const storageService = new StorageService(s3, bucketName || "");
    
    const token = event.headers.Authorization || "";
    const tokenDecode = jwt_decode(token) as UserModel;
    
    if (!tokenDecode.email) {
      return {
        body: JSON.stringify({
          message: "username not found",
        }),
        statusCode: 500,
      };
    }

    const username = tokenDecode.email;

    const nameObject = `${username}-history.json`;

    const object = await storageService.getObject(nameObject);

    if (!object) {
      return {
        body: JSON.stringify({
          message: `The user history did not find ${username}`,
        }),
        statusCode: 404,
      };
    }

    const histories = JSON.parse(object) as HistoryModel[];

    const historyToChange = histories.findIndex(history => {
      history.id === id
    });

    if (historyToChange === -1) {
      return {
        body: JSON.stringify({
          message: `The user history not found with id ${id}`,
        }),
        statusCode: 404,
      };
    }

    histories[historyToChange].functionality = functionality;        

    const result = await storageService.saveObject(histories, nameObject);

    if (!result) {
      return {
        body: JSON.stringify({
          message: `Cannot store the user history of ${username}`,
        }),
        statusCode: 500,
      };
    }

    return {
      body: JSON.stringify(histories),
      statusCode: 200,
    };
  } catch (err) {
    return {
      body: JSON.stringify({
        message: err instanceof Error ? err.message : err,
      }),
      statusCode: 500,
    };
  }
}
