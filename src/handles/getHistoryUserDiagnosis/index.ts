import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import jwt_decode from "jwt-decode";
import { UserModel } from "../../models/userModel";
import { StorageService } from "../../services/storageService";
import * as AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const bucketName = process.env.BUCKET_NAME;

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

    if (object) {
      return {
        body: object,
        statusCode: 200,
      };
    } else {
      return {
        body: JSON.stringify({
          message: `The user history did not find ${username}`,
        }),
        statusCode: 404,
      };
    }
  } catch (err) {
    return {
      body: JSON.stringify({
        message: err instanceof Error ? err.message : err,
      }),
      statusCode: 500,
    };
  }
}
