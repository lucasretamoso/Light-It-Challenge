import { APIGatewayProxyResultV2 } from "aws-lambda";
import * as AWS from 'aws-sdk';
import { ApiMedicService } from "../../services/apimedicService";
import { StorageService } from "../../services/storageService";

const s3 = new AWS.S3();

export async function main(): Promise<APIGatewayProxyResultV2> {
  try {
    const bucketName = process.env.BUCKET_NAME;
    const apiMedicAuthEndpoint = process.env.API_MEDIC_AUTH_ENDPOINT || '';
    const apiMedicUsername = process.env.API_MEDIC_USERNAME || '';
    const apiMedicPassword = process.env.API_MEDIC_PASSWORD || '';
    const apiMedicEndpoint = process.env.API_MEDIC_ENDPOINT || '';

    const storageService = new StorageService(s3, bucketName || "");
    const apimedicService = new ApiMedicService(apiMedicUsername, apiMedicPassword, apiMedicAuthEndpoint, apiMedicEndpoint)

    const object = await storageService.getObject('symptoms.json');

    if(object) {
      const objectJSON = JSON.parse(object);
      const lastUpdate = new Date(objectJSON.lastUpdate);
      const now = new Date();

      const timeDifference = Math.abs(lastUpdate.getTime() - now.getTime());
      const differentDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

      if(differentDays <= 1) {
        return {
          body: JSON.stringify(objectJSON.symptoms),
          statusCode: 200,
        };
      } 
    }

    await apimedicService.getToken();
    const result = await apimedicService.getSymptoms();
    const dataToStore = {
      lastUpdate: (new Date()).toISOString(),
      symptoms: [...result]
    }
    await storageService.saveObject(dataToStore, 'symptoms.json');
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
