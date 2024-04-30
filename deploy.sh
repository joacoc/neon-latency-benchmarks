#!/bin/bash

# Set's the deployment action.
ACTION=$1

# Constants
LAMBDA_NAME=LatencyBenchmarkRunner
ROLE_NAME=neon-latency-benchmark-lambda-execute-role
SCHEDULER_NAME=NeonLatencyBenchmarkscheduler

# Check if LAMBDA is true; if so, only update lambda code
if [[ "$ACTION" == "update" ]]; then
    echo "Updating lambda."

    # Assuming the zip and lambda update commands are sufficient for an update
    # 1. Zip the code:
    echo "(1/2) Building zip."
    zip -j lambda.zip ./setup/index.js && zip -j lambda.zip ./setup/config.json && zip -rq lambda.zip node_modules -x "*next*" -x "typescript" -x "*chartjs*"

    # 2. Upload the updated lambda code:
    echo "(2/2) Updating Lambda code — this may take a few seconds."
    aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://lambda.zip --query 'FunctionArn' --output text

    echo "Lambda code update complete."
elif [[ "$ACTION" == "delete" ]]; then
    echo "(1/3) Deleting lambda."
    aws lambda delete-function --function-name $LAMBDA_NAME

    echo "(2/3) Deleting Roles."
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    aws iam delete-role --role-name $ROLE_NAME

    echo "(3/3) Deleting Schedule."
    aws scheduler delete-schedule --name $SCHEDULER_NAME
else
    echo "Starting deployment."

    # 1. Load env. vars:
    echo "(1/5) Loading env. vars."
    source .env

    # 2. Zip the code:
    echo "(2/5) Building zip."
    zip -j lambda.zip ./setup/index.js && zip -j lambda.zip ./setup/config.json && zip -rq lambda.zip node_modules -x "*next*" -x "typescript" -x "*chartjs*"

    # 3. Create a role and attach the policy:
    echo "(3/5) Creating role and attaching policies."
    ROLE_ARN=$(aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://setup/trust-policy.json --query 'Role.Arn' --output text)
    sleep 5
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    sleep 5

    # 4. Upload the lambda code:
    echo "(4/5) Creating Lambda — this may take a few seconds."
    LAMBDA_ARN=$(aws lambda create-function --function-name $LAMBDA_NAME --runtime nodejs20.x --role $ROLE_ARN --handler index.handler --timeout 240 --zip-file fileb://lambda.zip --query 'FunctionArn' --output text --environment Variables={API_KEY=$API_KEY})
    sleep 5

    # 5. Schedule every 30 minutes:
    echo "(5/5) Creating schedule."
    aws scheduler create-schedule \
        --name $SCHEDULER_NAME \
        --schedule-expression "rate(30 minutes)" \
        --target "{\"RoleArn\": \"$ROLE_ARN\", \"Arn\":\"$LAMBDA_ARN\" }" \
        --flexible-time-window '{ "Mode": "FLEXIBLE", "MaximumWindowInMinutes": 15}'

    echo "Deployment complete."
fi