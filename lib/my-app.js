const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const ddb = require("aws-cdk-lib/aws-dynamodb");
const sqs = require('aws-cdk-lib/aws-sqs');
const lambdaEventSources = require('aws-cdk-lib/aws-lambda-event-sources');
const { Construct } = require('constructs');
const { DynamoAttributeValue, DynamoUpdateItem, LambdaInvoke } = require("aws-cdk-lib/aws-stepfunctions-tasks");
const { Choice, Condition, JsonPath, Chain, StateMachine, LogLevel, StateMachineType } = require("aws-cdk-lib/aws-stepfunctions");
const { AttributeType } = require("aws-cdk-lib/aws-dynamodb");
const cdk = require("aws-cdk-lib");
const { LogGroup } = require("aws-cdk-lib/aws-logs");
const { S3EventSource } = require("aws-cdk-lib/aws-lambda-event-sources");

class MyApp extends Construct {
    constructor(scope, id) {
        super(scope, id);

        const bucket = new s3.Bucket(this, "atr-bucket", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        const queue = new sqs.Queue(this, "atr-queue", {
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            fifo: true,
            contentBasedDeduplication: true,
        });
        const table = new ddb.Table(this, "atr-table", {
            partitionKey: { name: 'purchaseId', type: AttributeType.STRING },
            tableName: "atr-table",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // let addPurchase;
        // {
        //     const productId = DynamoAttributeValue.fromString(JsonPath.stringAt("$.productId"));
        //     const price = DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', $.price)`));
        //     const tax = DynamoAttributeValue.numberFromString(JsonPath.stringAt(`States.Format('{}', $.price)`));
        //     no way to calculate above tax :-(
        //     const orderType = DynamoAttributeValue.fromString('purchase');
        //     const purchaseId = DynamoAttributeValue.fromString(JsonPath.stringAt("$.productId"));
        //     const isDeleted = DynamoAttributeValue.fromBoolean(false);

        //     addPurchase = new DynamoPutItem(this, "addPurchase", {
        //         item: {
        //             purchaseId,
        //             orderType,
        //             productId,
        //             price,
        //             tax,
        //             isDeleted
        //         },
        //         table,
        //     })

        // }

        const addPurchaseLambda = new lambda.Function(this, "atr-purchase-add-lambda", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset("resources/step-purchase-add-lambda"),
            handler: "index.main",
            environment: {
                tableName: table.tableName
            },
        });

        table.grantWriteData(addPurchaseLambda);

        const addPurchase = new LambdaInvoke(this, 'add-purchase', {
            lambdaFunction: addPurchaseLambda,
        });

        const purchaseId = DynamoAttributeValue.fromString(JsonPath.stringAt("$.purchaseId"));
        const isDeleted = DynamoAttributeValue.fromBoolean(true);
        const softDeletePurchase = new DynamoUpdateItem(this, "softDeletePurchase", {
            key: { purchaseId },
            updateExpression: "set isDeleted = :isDeleted",
            expressionAttributeValues: {
                ":isDeleted": isDeleted,
            },
            table,
        })

        const definition = Chain.start(
            new Choice(this, "Is event purchase or refund?")
                .when(
                    Condition.stringEquals("$.eventType", "purchase"),
                    addPurchase
                ).when(
                    Condition.stringEquals("$.eventType", "refund"),
                    softDeletePurchase
                ));

        const stateMachine = new StateMachine(this, 'StateMachine', {
            definition,
            stateMachineType: StateMachineType.EXPRESS,
            logs: {
                destination: new LogGroup(this, "atr-sm-logGroup"),
                level: LogLevel.ALL
            }
        });


        const s3Listener = new lambda.Function(this, "atr-s3-listener", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset("resources/s3-listener-lambda"),
            handler: "index.main",
            environment: {
                queueUrl: queue.queueUrl
            },
        });

        // bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(s3Listener))
        bucket.grantRead(s3Listener);
        s3Listener.addEventSource(new S3EventSource(bucket, {
            events: [s3.EventType.OBJECT_CREATED]
        }));

        queue.grantSendMessages(s3Listener);

        const sqsListener = new lambda.Function(this, "atr-sqs-listener", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset("resources/sqs-listener-lambda"),
            handler: "index.main",
            environment: {
                stateMachineArn: stateMachine.stateMachineArn
            },
            
        });

        const queueEventSource = new lambdaEventSources.SqsEventSource(queue, { batchSize: 1 });
        sqsListener.addEventSource(queueEventSource);

        stateMachine.grantStartSyncExecution(sqsListener)

    }
}

module.exports = { MyApp }