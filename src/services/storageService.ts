import * as AWS from 'aws-sdk';

export class StorageService {
  constructor (private readonly client: AWS.S3, private readonly bucket: string) {}

  async getObject (key: string) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key 
      }
  
      const data = await this.client.getObject(params).promise();
  
      return data.Body?.toString('utf-8');
    } catch (e) {
      console.error(`Could not retrieve ${key} file from S3: ${e instanceof Error ? e.message : e}`)
      return undefined;
    }
  }

  async saveObject (data: Object, key: string): Promise<boolean> {
    try {
      const buf = Buffer.from(JSON.stringify(data));
      await this.client.upload({
        Bucket: this.bucket,
        Key: key,
        Body: buf,
        ContentEncoding: 'base64',
        ContentType: 'application/json'
      }).promise()
      return true;
    } catch (e) {
      console.error(`Could not save ${key} file from S3: ${e instanceof Error ? e.message : e}`)
      return false;
    }
  }
}