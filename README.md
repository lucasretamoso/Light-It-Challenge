# Light It Challenge

## Description

ApiMedic is a medical data symptom checker that allows users multiple functionalities related to symptom evaluation
in order to deliver a diagnostic, based on a list of symptoms in different body locations. Using the ApiMedic API as a
data origin, develop a web application with following specifications:

### Front end:
- A register/login module. Registration should require user&#39;s basic information including (full name, gender, date of
birth and credentials)
- A diagnosis module that should include:
- A form with a drop down menu that lists all available symptoms from ApiMedic&#39;s API. You can decide the
best strategy to load this list into the drop down component, keep in mind that performance will be
considered.
    - A submit button that should trigger symptoms evaluation in order to obtain a list of possible diagnoses.
    - A result area that should display the list of diagnosis and the level of accuracy. You must use a visual
element to display the accuracy of each diagnosis (%).
    - A historic diagnosis module that displays the user’s previous diagnosis. Each diagnosis should have a button in order to confirm if the diagnosis was correct for this case.

### Back end:
- Functionalities for user register and login.
- Functionalities for communication with ApiMedic. Consider authentication and all the relevant endpoints.
- Functionalities for user’s historic diagnosis. Consider diagnosis confirm functionality.

### Considerations:
- You may use any data storing and cache strategy you consider the best possible choice. 
- You may implement any architectural design you consider the best possible choice (SPA,MVC, ADR,etc).
- You must register on ApiMedic’s free tier in order to access their services.
- We suggest using Laravel, Vue and Tailwind to write the code.

## Structure

The project has 3 part, the stack definition, the CDK project definition and the Lambdas code.

- The stack definition is hosted on src/lib and define all the Stack which will deploy on CloudFormation. These have all the AWS architecture.

- CDK project is a file which get all the stack in the same file. It is the main file needing to deploy using CDK. It is hosted on src/bin

- The Lambda code are hosted on src/handles. If is necessary, each Lambda will have a Service code.

## Pre-requirements

1. [AWS Command Line Interface](https://aws.amazon.com/cli/): This tool helps us to configure the AWS account and provides us the credential to deploy the solution.
2. [Docker](https://www.docker.com/): We use @aws-cdk/aws-lambda-nodejs which compiles the code using a docker image.
    1. WSL: Docker needs this program to work.
3. [NodeJS](https://nodejs.org/en/)
4. [Typescript](https://www.typescriptlang.org/)

## Testing

I planned to create a test for CDK and the Lambda services. Is a good practice that the lambda handler doesn't have a lot of code or complex code, so is not necessary to check it with a test.

The tests are hosted in the `test` folder.

## Deploy the solution

To deploy the CDK solution you need to configurate the AWS account using the AWS CLI. You can do that following this [tutorial](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html#getting_started_prerequisites).

After that, you need to install cdk running the script `npm install -g aws-cdk`.

CDK uses a S3 bucket to upload the assets like Lambda codes, ECS files, etc. So, you need to start that running the following script `cdk bootstrap`.

Now you can deploy the solution, you only need to run the script `npm install` and `cdk deploy`.

## Test the application

In this repository, there is a postman file to import all the endpoints which are created.

## Next Steps
- Change S3 bucket to DynamoDB. Right now, the user history are stored as JSON files on S3 bucket. The best way is change that to DynamoDB.
- Add test to all environments

## Contact

If you have problems or issues, you can write me in the email lucasretamoso@gmail.com or via [LinkedIn](https://www.linkedin.com/in/ing-llrg/).
