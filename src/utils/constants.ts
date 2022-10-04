import * as dotenv from 'dotenv';

dotenv.config()

export default abstract class Constants {
  static readonly environment = process.env.ENV || "dev";
  
  static readonly region = process.env.REGION || "us-east-1";

  static readonly endpointApiMedic = process.env.API_MEDIC_ENDPOINT || '';
  static readonly endpointAuthApiMedic = process.env.API_MEDIC_AUTH_ENDPOINT || '';
  static readonly usernameApiMedic = process.env.API_MEDIC_USERNAME || '';
  static readonly passwordApiMedic = process.env.API_MEDIC_PASSWORD || '';

  static readonly idPrefix = `${Constants.environment}-id-lightit-`;

  static readonly namePrefix = `${Constants.environment}-lightit-`;

  static readonly IDs = {
    API_GATEWAY: `${Constants.idPrefix}apigateway`,
    API_GATEWAY_AUTH: `${Constants.idPrefix}apigateway-cognito-auth`,
    SIGNUP_LAMBDA: `${Constants.idPrefix}signup-lambda`,
    LOGIN_LAMBDA: `${Constants.idPrefix}login-lambda`,
    VALIDATION_LAMBDA: `${Constants.idPrefix}validation-lambda`,
    GET_SYMPTOMS_LAMBDA: `${Constants.idPrefix}symptoms-lambda`,
    GET_DiAGNOSIS_LAMBDA: `${Constants.idPrefix}diagnosis-lambda`,
    GET_ISSUE_LAMBDA: `${Constants.idPrefix}issue-lambda`,
    GET_USER_HISTORY_LAMBDA: `${Constants.idPrefix}get-user-history-lambda`,
    CONFIRM_USER_HISTORY_LAMBDA: `${Constants.idPrefix}confirm-user-history-lambda`,
    USER_HISTORY_LAMBDA: `${Constants.idPrefix}user-history-lambda`,
    COGNITO_USER_POOLS: `${Constants.idPrefix}user-pools`,
    COGNITO_USER_POOLS_CLIENT: `${Constants.idPrefix}user-pools-client`,
    STORAGE: `${Constants.idPrefix}bucket`
  };

  static readonly NAMES = {
    API_GATEWAY: `${Constants.namePrefix}apigateway`,
    API_GATEWAY_AUTH: `${Constants.namePrefix}apigateway-cognito-auth`,
    SIGNUP_LAMBDA: `${Constants.namePrefix}signup-lambda`,
    LOGIN_LAMBDA: `${Constants.namePrefix}login-lambda`,
    VALIDATION_LAMBDA: `${Constants.namePrefix}validation-lambda`,
    GET_SYMPTOMS_LAMBDA: `${Constants.namePrefix}symptoms-lambda`,
    GET_DiAGNOSIS_LAMBDA: `${Constants.namePrefix}diagnosis-lambda`,
    GET_ISSUE_LAMBDA: `${Constants.namePrefix}issue-lambda`,
    GET_USER_HISTORY_LAMBDA: `${Constants.namePrefix}get-user-history-lambda`,
    CONFIRM_USER_HISTORY_LAMBDA: `${Constants.namePrefix}confirm-user-history-lambda`,
    USER_HISTORY_LAMBDA: `${Constants.namePrefix}user-history-lambda`,
    COGNITO_USER_POOLS: `${Constants.namePrefix}user-pools`,
    COGNITO_USER_POOLS_CLIENT: `${Constants.namePrefix}user-pools-client`,
    STORAGE: `${Constants.namePrefix}bucket`
  };
}
