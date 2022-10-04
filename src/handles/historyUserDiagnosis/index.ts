import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import jwt_decode from "jwt-decode";
import { UserModel } from "../../models/userModel";
import { StorageService } from "../../services/storageService";
import * as AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { HistoryModel } from "../../models/historyModel";

const s3 = new AWS.S3();

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const bucketName = process.env.BUCKET_NAME;

    const body = JSON.parse(event.body || '{}');

    if (!("issueId" in body)) {
      return {
        body: JSON.stringify({
          message: "issueId is required",
        }),
        statusCode: 400,
      };
    }

    if (typeof body.issueId !== 'number') {
      return {
        body: JSON.stringify({
          message: "issueId must be a number",
        }),
        statusCode: 400,
      };
    }

    const functionality = "functionality" in body ? typeof body.functionality === 'boolean' ? body.functionality : null : null;

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

    const newData: HistoryModel = {
      id: nanoid(),
      issueId: body.issueId,
      username: username,
      createdAt: new Date().toISOString(),
      functionality: functionality
    } 

    const dataToStore: HistoryModel[] = object ? JSON.parse(object) as HistoryModel[] : [];
    dataToStore.unshift(...[newData]);
        

    const result = await storageService.saveObject(dataToStore, nameObject);

    if (!result) {
      return {
        body: JSON.stringify({
          message: `Cannot store the user history of ${username}`,
        }),
        statusCode: 500,
      };
    }

    return {
      body: JSON.stringify(dataToStore),
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
