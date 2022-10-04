import * as AWS from "@aws-sdk/client-cognito-identity-provider";
import { UserModel } from "../models/userModel";

export class CognitoService {
  constructor(
    private readonly cognitoClient: AWS.CognitoIdentityProviderClient,
    private readonly clientId: string
  ) {}

  async logIn(username: string, password: string) {
    try {
      const params: AWS.InitiateAuthCommandInput = {
        ClientId: this.clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          PASSWORD: password,
          USERNAME: username,
        },
      };
      const command = new AWS.InitiateAuthCommand(params);

      return await this.cognitoClient.send(command);
    } catch (err) {
      const errorMessage = `Cannot log in the account ${username}. error: ${
        err instanceof Error ? err.message : err
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async signUp(username: string, password: string, userData: UserModel) {
    try {
      const params: AWS.SignUpCommandInput = {
        ClientId: this.clientId,
        Password: password,
        Username: username,
        UserAttributes: [
          {
            Name: "given_name",
            Value: userData.firstName,
          },
          {
            Name: "family_name",
            Value: userData.lastName,
          },
          {
            Name: "birthdate",
            Value: userData.birthdate,
          },
          {
            Name: "gender",
            Value: userData.gender,
          },
        ],
      };

      const command = new AWS.SignUpCommand(params);

      return await this.cognitoClient.send(command);
    } catch (err) {
      const errorMessage = `Cannot sign up the account ${username}. error: ${
        err instanceof Error ? err.message : err
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async validation(code: string, username: string) {
    try {
      const input: AWS.ConfirmSignUpCommandInput = {
        ConfirmationCode: code,
        ClientId: this.clientId,
        Username: username,
      };
      const command = new AWS.ConfirmSignUpCommand(input);

      await this.cognitoClient.send(command);
    } catch (err) {
      const errorMessage = `Cannot validate the account ${username}. error: ${
        err instanceof Error ? err.message : err
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async getUser(username: string, userPoolId: string) {
    try {
      const input: AWS.AdminGetUserCommandInput = {
        UserPoolId: userPoolId,
        Username: username,
      };
      const command = new AWS.AdminGetUserCommand(input);

      await this.cognitoClient.send(command);
    } catch (err) {
      const errorMessage = `Cannot get the user ${username}. error: ${
        err instanceof Error ? err.message : err
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
