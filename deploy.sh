#!/bin/bash

# Set's the deployment action.
ACTION=$1

# Constants
CLUSTER_NAME=benchmark-cluster
POLICY_NAME=NeonLatencyBenchmarkSchedulerPolicy
POLICY_FILE=setup/schedule-policy.json
ROLE_NAME=neon-latency-benchmark-execute-role
REGION=$(aws configure get region)
SCHEDULER_NAME=NeonLatencyBenchmarkScheduler
TASK_FAMILY=BenchmarkTask
TASK_DEFINITION_FILE=setup/task-definition.json
TASK_DEFINITION_IMAGE=joaco36/neon-latency-benchmarks:latest

if [[ "$ACTION" == "delete" ]]; then
    echo "(1/3) Deleting ECS cluster."
    aws ecs list-tasks --cluster $CLUSTER_NAME --query 'taskArns[]' --output text | xargs -I{} aws ecs stop-task --cluster "$CLUSTER_NAME" --task {} > /dev/null 
    aws ecs delete-cluster --cluster $CLUSTER_NAME > /dev/null

    echo "(2/3) Deleting role."
    POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`NeonLatencyBenchmarkSchedulerPolicy`].Arn' --output text)
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
    aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn $POLICY_ARN
    aws iam delete-role --role-name $ROLE_NAME
    aws iam delete-policy --policy-arn $POLICY_ARN

    echo "(3/3) Deleting schedule."
    aws scheduler delete-schedule --name $SCHEDULER_NAME
else
    echo "Fetching deployment configuration."

    VPC_ID=$(aws ec2 describe-vpcs --query "Vpcs[*].VpcId" --output text --max-items 1 | head -n 1)
    SUBNET=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[*].SubnetId" --output text --max-items 1 | head -n 1)
    SECURITY_GROUP=$(aws ec2 get-security-groups-for-vpc --vpc-id $VPC_ID --query "SecurityGroupForVpcs[*].GroupId" --output text --max-items 1 | head -n 1)

    # Prompt the user with a message
    echo ""
    echo "The deployment will use the following network configuration:"
    echo "VPC: $VPC_ID"
    echo "Subnet: $SUBNET"
    echo "Security group: $SECURITY_GROUP"
    echo ""
    echo "Do you wish to continue? (y/n)"

    read -r -n 1 answer

    if [[ -z "$answer" ]]; then
        :
    else
        case "$answer" in
            y|Y)
                :
                ;;
            n|N)
                exit 0
                ;;
            *)
                exit 0
                ;;
        esac
    fi

    # 1. Load env. vars:
    echo "(1/6) Loading env. vars."
    source .env

    # 2. Create a role and attach the policy:
    echo "(2/6) Creating role and attaching policy."
    ROLE_ARN=$(aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://setup/trust-policy.json --query 'Role.Arn' --output text)
    sleep 5
    aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy > /dev/null
    sleep 5

    # 3. Create ECS cluster
    echo "(3/6) Creating ECS cluster."
    CLUSTER_ARN=$(aws ecs create-cluster --cluster-name $CLUSTER_NAME --output text --query 'cluster.clusterArn')
    aws ecs put-cluster-capacity-providers --cluster $CLUSTER_ARN \
        --capacity-providers FARGATE FARGATE_SPOT \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=1 capacityProvider=FARGATE_SPOT,weight=4 > /dev/null

    # 4. Create ECS Taks
    echo "(4/6) Registering task definition."
    # Read the task definition.
    TASK_DEFINITION=$(cat "$TASK_DEFINITION_FILE")
    # Add the API KEY.
    TASK_DEFINITION="${TASK_DEFINITION/\$API_KEY/$API_KEY}"
    # Add the Role ARN.
    TASK_DEFINITION="${TASK_DEFINITION/\$ROLE_ARN/$ROLE_ARN}"
    # Set the region for the logs.
    TASK_DEFINITION="${TASK_DEFINITION/\$REGION/$REGION}"
    # Set the image.
    TASK_DEFINITION="${TASK_DEFINITION/\$TASK_DEFINITION_IMAGE/$TASK_DEFINITION_IMAGE}"

    # Register ECS task
    aws ecs register-task-definition --family "$TASK_FAMILY" --cli-input-json "$TASK_DEFINITION" > /dev/null
    aws ecs run-task \
        --cluster $CLUSTER_NAME \
        --task-definition $TASK_FAMILY \
        --launch-type FARGATE \
        --query 'tasks[0].taskArn' \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET],securityGroups=[$SECURITY_GROUP]}" > /dev/null

    # 5. Create policy to run an ECS task using the scheduler.
    echo "(5/6) Creating and attaching the policy to schedule the task."
    # Create the IAM policy for the scheduler
    TASK_DEFINITION_ARN=$(aws ecs list-task-definitions --sort DESC --max-items 1 --query 'taskDefinitionArns[0]' --output text | head -n1)
    POLICY_DOCUMENT=$(cat "$POLICY_FILE")
    POLICY_DOCUMENT="${POLICY_DOCUMENT/\$CLUSTER_ARN/$CLUSTER_ARN}"
    POLICY_DOCUMENT="${POLICY_DOCUMENT/\$TASK_DEFINITION_ARN/$TASK_DEFINITION_ARN}"
    POLICY_ARN=$(aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document "$POLICY_DOCUMENT" \
        --query 'Policy.Arn' \
        --output text)

    # Attach the policy to the IAM role
    aws iam attach-role-policy \
        --policy-arn $POLICY_ARN \
        --role-name $ROLE_NAME > /dev/null

    # 6. Schedule the task.
    echo "(6/6) Creating schedule."
    aws scheduler create-schedule \
        --name $SCHEDULER_NAME \
        --schedule-expression "rate(30 minutes)" \
        --target "{
            \"Arn\": \"$CLUSTER_ARN\",
            \"RoleArn\": \"$ROLE_ARN\",
            \"EcsParameters\": {
                \"CapacityProviderStrategy\": [
                    {
                        \"base\": 1,
                        \"capacityProvider\": \"FARGATE\",
                        \"weight\": 1
                    }
                ],
                \"TaskDefinitionArn\": \"$TASK_DEFINITION_ARN\",
                \"TaskCount\": 1,
                \"NetworkConfiguration\": {
                    \"awsvpcConfiguration\": {
                        \"AssignPublicIp\": \"ENABLED\",
                        \"SecurityGroups\": [\"$SECURITY_GROUP\"],
                        \"Subnets\": [\"$SUBNET\"]
                    }
                }
            }
        }" \
        --flexible-time-window '{ "Mode": "OFF"}' > /dev/null
fi
