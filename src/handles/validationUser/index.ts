import * as AWS from "@aws-sdk/client-cognito-identity-provider";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CognitoService } from "../../services/cognitoService";

const client = new AWS.CognitoIdentityProviderClient({ region: process.env.REGION });

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const clientId = process.env.CLIENT_ID;
    const body = JSON.parse(event.body || "{}");
  
    if (
      !("username" in body) ||
      !("code" in body)
    ) {
      return {
        body: JSON.stringify({
          message: "Username and the validation code are required",
        }),
        statusCode: 400,
      };
    }
  
    const cognitoService = new CognitoService(client, clientId || "");
  
    const result = await cognitoService.validation(
      body.code,
      body.username,
    );
  
    return { body: JSON.stringify(result), statusCode: 200 };
  } catch (err) {
    return {
      body: JSON.stringify({
        message: err instanceof Error ? err.message : err,
      }),
      statusCode: 500,
    };
  }
}
