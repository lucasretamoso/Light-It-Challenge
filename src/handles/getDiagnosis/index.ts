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

    if (!qSP || !("symptoms" in qSP)) {
      return {
        body: JSON.stringify({
          message: "The Symptoms are required in URL as a parameter",
        }),
        statusCode: 400,
      };
    }

    const symptoms = JSON.parse(qSP.symptoms || '');

    if(!symptoms || !(symptoms instanceof Array<number>)) {
      return {
        body: JSON.stringify({
          message: "The Symptoms must be an array of numbers",
        }),
        statusCode: 400,
      };
    }

    const token = event.headers.Authorization || "";
    const tokenDecode = jwt_decode(token) as UserModel;

    const age = new Date(tokenDecode.birthdate).getFullYear();
    const gender = tokenDecode.gender;

    const apimedicService = new ApiMedicService(
      apiMedicUsername,
      apiMedicPassword,
      apiMedicAuthEndpoint,
      apiMedicEndpoint
    );

    await apimedicService.getToken();
    const result = await apimedicService.getDiagnosis(symptoms, age, gender);
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
