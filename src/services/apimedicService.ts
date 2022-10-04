import * as crypto from 'crypto';
import axios from 'axios';

export class ApiMedicService {
  private token: string;

  constructor(private readonly username: string, private readonly password: string, private readonly authUri: string, private readonly uri: string) {}

  async getToken() {
    const hmac = crypto.createHmac('md5', this.password);
    const data = hmac.update(this.authUri);
    const gen_hmac = data.digest('base64');
    
    const result = await axios.post(this.authUri, null, {
      headers: {
        Authorization: `Bearer ${this.username}:${gen_hmac}`
      }
    })

    this.token = result.data.Token;

    return this.token;
  }

  async getSymptoms() {
    const result = await axios.get(`${this.uri}/symptoms`, {
      params: {
        token: this.token,
        format: 'json',
        language: 'en-gb'
      }
    });

    return result.data;
  }

  async getDiagnosis(symptomIds: number[], age: number, gender: string) {
    const result = await axios.get(`${this.uri}/diagnosis`, {
      params: {
        symptoms: JSON.stringify(symptomIds),
        gender: gender,
        year_of_birth: age,
        token: this.token,
        format: 'json',
        language: 'en-gb'
      }
    });

    return result.data;
  }

  async getIssue(issueId: number) {
    const result = await axios.get(`${this.uri}/issues/${issueId}/info`, {
      params: {
        token: this.token,
        format: 'json',
        language: 'en-gb'
      }
    });

    return result.data;
  }
}