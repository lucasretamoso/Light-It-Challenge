import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ApiMedicService } from "../../services/apimedicService";
import jwt_decode from "jwt-decode";
import { UserModel } from "../../models/userModel";

export async function main(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const apiMedicAuthEndpoint = process.env.API_MEDIC_AUTH_ENDPOINT || "";
    const apiMedicUsername = process.env.API_MEDIC_USERNAME || "";
    const apiMedicPassword = process.env.API_MEDIC_PASSWORD || "";
    const apiMedicEndpoint = process.env.API_MEDIC_ENDPOINT || "";

    const qSP = event.queryStringParameters;

    if (!qSP || !("issueId" in qSP)) {
      return {
        body: JSON.stringify({
          message: "The issue id is required in URL as a parameter",
        }),
        statusCode: 400,
      };
    }

    const issueId = qSP.issueId;

    if(!issueId) {
      return {
        body: JSON.stringify({
          message: "The Symptoms must be an array of numbers",
        }),
        statusCode: 400,
      };
    }

    const apimedicService = new ApiMedicService(
      apiMedicUsername,
      apiMedicPassword,
      apiMedicAuthEndpoint,
      apiMedicEndpoint
    );

    await apimedicService.getToken();
    const result = await apimedicService.getIssue(parseInt(issueId));
    return {
      body: JSON.stringify(result),
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
