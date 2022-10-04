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
      !("password" in body) ||
      !("birthdate" in body) ||
      !("gender" in body) ||
      !("firstName" in body) ||
      !("lastName" in body)
    ) {
      return {
        body: JSON.stringify({
          message: "Username, Password, Birthdate, Gender, First Name and Last Name are required",
        }),
        statusCode: 400,
      };
    }

    const { username, password, birthdate, gender, firstName, lastName } = body;

    if(!(['male', 'female'].find(genderAvailable => genderAvailable === gender))) {
      return {
        body: JSON.stringify({
          message: "Gender must be male or female",
        }),
        statusCode: 400,
      };
    }
    

    if (!Date.parse(birthdate)) {
      return {
        body: JSON.stringify({
          message: "Birthdate must be a valid Date format",
        }),
        statusCode: 400,
      };
    }
  
    const cognitoService = new CognitoService(client, clientId || "");
  
    const result = await cognitoService.signUp(
      username,
      password,
      {
        birthdate: birthdate,
        firstName: firstName,
        gender: gender,
        lastName: lastName
      }
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
