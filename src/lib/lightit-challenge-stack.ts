import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  Effect,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import * as path from "path";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { CognitoUserPoolsAuthorizer, Cors, IAuthorizer, IResource, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { StandardAttributesMask } from "aws-cdk-lib/aws-cognito";
import Constants from "../utils/constants";

export class LightitChallengeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(
      this,
      Constants.IDs.COGNITO_USER_POOLS,
      {
        userPoolName: Constants.NAMES.COGNITO_USER_POOLS,
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          givenName: {
            required: true,
            mutable: true,
          },
          familyName: {
            required: true,
            mutable: true,
          },
          birthdate: {
            required: true,
            mutable: true,
          },
          gender: {
            required: true,
            mutable: true,
          },
        },
        passwordPolicy: {
          minLength: 6,
          requireLowercase: true,
          requireDigits: true,
          requireUppercase: false,
          requireSymbols: false,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const standardCognitoAttributes: StandardAttributesMask = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      lastUpdateTime: true,
      birthdate: true,
      gender: true
    };

    const clientReadAttributes =
      new cognito.ClientAttributes().withStandardAttributes(
        standardCognitoAttributes
      );

    const clientWriteAttributes =
      new cognito.ClientAttributes().withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
      });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      Constants.IDs.COGNITO_USER_POOLS_CLIENT,
      {
        userPoolClientName: Constants.NAMES.COGNITO_USER_POOLS_CLIENT,
        userPool,
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          custom: true,
          userSrp: true,
        },
        supportedIdentityProviders: [
          cognito.UserPoolClientIdentityProvider.COGNITO,
        ],
        readAttributes: clientReadAttributes,
        writeAttributes: clientWriteAttributes,
      }
    );

    const lambdaSignUp = this.createCognitoLambdas(
      this,
      Constants.IDs.SIGNUP_LAMBDA,
      Constants.NAMES.SIGNUP_LAMBDA,
      userPool.userPoolArn,
      userPoolClient.userPoolClientId,
      'signUp'
    );

    const lambdaVerifyUser = this.createCognitoLambdas(
      this,
      Constants.IDs.VALIDATION_LAMBDA,
      Constants.NAMES.VALIDATION_LAMBDA,
      userPool.userPoolArn,
      userPoolClient.userPoolClientId,
      'validationUser'
    );

    const lambdaLogIn = this.createCognitoLambdas(
      this,
      Constants.IDs.LOGIN_LAMBDA,
      Constants.NAMES.LOGIN_LAMBDA,
      userPool.userPoolArn,
      userPoolClient.userPoolClientId,
      'login'
    );

    const api = new RestApi(this, Constants.IDs.API_GATEWAY, {
      restApiName: Constants.NAMES.API_GATEWAY,
      deployOptions: {
        stageName: Constants.environment,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
    });

    const authorizer = new CognitoUserPoolsAuthorizer(
      this,
      Constants.IDs.API_GATEWAY_AUTH,
      {
        authorizerName: Constants.NAMES.API_GATEWAY_AUTH,
        cognitoUserPools: [userPool],
        identitySource: 'method.request.header.Authorization',
      },
    );

    const resourceSignUp = api.root.addResource("signUp");
    const resouceValidation = api.root.addResource("verifyUser");
    const resouceLogIn = api.root.addResource("login");

    const integrations = new LambdaIntegration(lambdaSignUp);
    const integrationsValidation = new LambdaIntegration(lambdaVerifyUser);
    const integrationsLogIn = new LambdaIntegration(lambdaLogIn);

    resourceSignUp.addMethod("POST", integrations);
    resouceValidation.addMethod("PUT", integrationsValidation);
    resouceLogIn.addMethod("POST", integrationsLogIn);

    const storage = new s3.Bucket(this, Constants.IDs.STORAGE, {
      bucketName: Constants.NAMES.STORAGE,
    });

    this.createSymptomsEndpoint(this, api, authorizer, storage);
    this.createDiagnosisEndpoint(this, api, authorizer);
    this.createIssueEndpoint(this, api, authorizer);

    const resourceHistory = api.root.addResource("history");
    this.createUserHistoryEndpoint(this, resourceHistory, authorizer, storage);
    this.createGetUserHistoryEndpoint(this, resourceHistory, authorizer, storage);
    this.createConfirmUserHistoryEndpoint(this, resourceHistory, authorizer, storage);
  }

  createCognitoLambdas(
    scope: Construct,
    id: string,
    name: string,
    userPoolArn: string,
    clientId: string,
    method: string,
  ) {
    const roleLambda = new Role(scope, `${id}-role`, {
      roleName: `${name}-role`,
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
    });

    roleLambda.addToPolicy(
      new PolicyStatement({
        actions: ["cognito-idp:*"],
        effect: Effect.ALLOW,
        resources: [userPoolArn],
      })
    );

    const lambdaFunction = new NodejsFunction(scope, id, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: name,
      handler: "main",
      entry: path.join(__dirname, `/../handles/${method}/index.ts`),
      role: roleLambda,
      environment: {
        REGION: Constants.region,
        CLIENT_ID: clientId
      }
    });

    return lambdaFunction;
  }

  createDiagnosisEndpoint(scope: Construct, restApi: RestApi, authorizer: IAuthorizer) {
    const lambdaDiagnosis = new NodejsFunction(scope, Constants.IDs.GET_DiAGNOSIS_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.GET_DiAGNOSIS_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/getDiagnosis/index.ts`),
      environment: {
        API_MEDIC_ENDPOINT: Constants.endpointApiMedic,
        API_MEDIC_USERNAME: Constants.usernameApiMedic,
        API_MEDIC_PASSWORD: Constants.passwordApiMedic,
        API_MEDIC_AUTH_ENDPOINT: Constants.endpointAuthApiMedic
      }
    });

    const resourceDiagnosis = restApi.root.addResource("diagnosis");

    const integrationsDiagnosis = new LambdaIntegration(lambdaDiagnosis);

    resourceDiagnosis.addMethod('GET', integrationsDiagnosis, {
      authorizer
    })
  }

  createSymptomsEndpoint(scope: Construct, restApi: RestApi, authorizer: IAuthorizer, storage: s3.Bucket) {
    const lambdaSymptoms = new NodejsFunction(scope, Constants.IDs.GET_SYMPTOMS_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.GET_SYMPTOMS_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/getSymptoms/index.ts`),
      environment: {
        BUCKET_NAME: storage.bucketName,
        API_MEDIC_ENDPOINT: Constants.endpointApiMedic,
        API_MEDIC_USERNAME: Constants.usernameApiMedic,
        API_MEDIC_PASSWORD: Constants.passwordApiMedic,
        API_MEDIC_AUTH_ENDPOINT: Constants.endpointAuthApiMedic
      }
    });

    storage.grantReadWrite(lambdaSymptoms);

    const resourceSymptoms = restApi.root.addResource("symptoms");

    const integrationsSymptoms = new LambdaIntegration(lambdaSymptoms);

    resourceSymptoms.addMethod('GET', integrationsSymptoms, {
      authorizer
    })
  }

  createIssueEndpoint(scope: Construct, restApi: RestApi, authorizer: IAuthorizer) {
    const lambdaIssue = new NodejsFunction(scope, Constants.IDs.GET_ISSUE_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.GET_ISSUE_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/getIssue/index.ts`),
      environment: {
        API_MEDIC_ENDPOINT: Constants.endpointApiMedic,
        API_MEDIC_USERNAME: Constants.usernameApiMedic,
        API_MEDIC_PASSWORD: Constants.passwordApiMedic,
        API_MEDIC_AUTH_ENDPOINT: Constants.endpointAuthApiMedic
      }
    });

    const resourceIssue = restApi.root.addResource("issue");

    const integrationsIssue = new LambdaIntegration(lambdaIssue);

    resourceIssue.addMethod('GET', integrationsIssue, {
      authorizer
    })
  }

  createUserHistoryEndpoint(scope: Construct, resource: IResource, authorizer: IAuthorizer, storage: s3.Bucket) {
    const lambdaUserHistory = new NodejsFunction(scope, Constants.IDs.USER_HISTORY_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.USER_HISTORY_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/historyUserDiagnosis/index.ts`),
      environment: {
        BUCKET_NAME: storage.bucketName,
      }
    });

    storage.grantReadWrite(lambdaUserHistory);

    const integrationsUserHistory = new LambdaIntegration(lambdaUserHistory);

    resource.addMethod('POST', integrationsUserHistory, {
      authorizer
    })
  }

  createGetUserHistoryEndpoint(scope: Construct, resource: IResource, authorizer: IAuthorizer, storage: s3.Bucket) {
    const lambdaGetUserHistory = new NodejsFunction(scope, Constants.IDs.GET_USER_HISTORY_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.GET_USER_HISTORY_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/getHistoryUserDiagnosis/index.ts`),
      environment: {
        BUCKET_NAME: storage.bucketName,
      }
    });

    storage.grantReadWrite(lambdaGetUserHistory);

    const integrationsGetUserHistory = new LambdaIntegration(lambdaGetUserHistory);

    resource.addMethod('GET', integrationsGetUserHistory, {
      authorizer
    })
  }

  createConfirmUserHistoryEndpoint(scope: Construct, resource: IResource, authorizer: IAuthorizer, storage: s3.Bucket) {
    const lambdaConfirmUserHistory = new NodejsFunction(scope, Constants.IDs.CONFIRM_USER_HISTORY_LAMBDA, {
      runtime: lambda.Runtime.NODEJS_14_X,
      functionName: Constants.NAMES.CONFIRM_USER_HISTORY_LAMBDA,
      handler: "main",
      entry: path.join(__dirname, `/../handles/confirmHistoryUserDiagnosis/index.ts`),
      environment: {
        BUCKET_NAME: storage.bucketName,
      }
    });

    storage.grantReadWrite(lambdaConfirmUserHistory);

    const integrationsConfirmUserHistory = new LambdaIntegration(lambdaConfirmUserHistory);

    const idHistoryResource = resource.addResource('{id}');

    idHistoryResource.addMethod('PUT', integrationsConfirmUserHistory, {
      authorizer
    })
  }
}
