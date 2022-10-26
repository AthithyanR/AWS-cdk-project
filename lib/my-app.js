const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const s3n = require("aws-cdk-lib/aws-s3-notifications");
const sqs = require('aws-cdk-lib/aws-sqs');
const lambdaEventSources = require('aws-cdk-lib/aws-lambda-event-sources');
const { Construct } = require('constructs');

class MyApp extends Construct {
    constructor(scope, id) {
        super(scope, id);

        const bucket = new s3.Bucket(this, "atr-bucket");
        const queue = new sqs.Queue(this, "atr-queue");

        const s3Listener = new lambda.Function(this, "atr-s3-listener", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset("resources/s3-listener-lambda"),
            handler: "index.main",
            environment: {
                queueUrl: queue.queueUrl
            }
        });

        bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(s3Listener))
        bucket.grantRead(s3Listener);

        queue.grantSendMessages(s3Listener);

        const sqsListener = new lambda.Function(this, "atr-sqs-listener", {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset("resources/sqs-listener-lambda"),
            handler: "index.main"
        });

        const queueEventSource = new lambdaEventSources.SqsEventSource(queue);
        sqsListener.addEventSource(queueEventSource);
    }
}

module.exports = { MyApp }