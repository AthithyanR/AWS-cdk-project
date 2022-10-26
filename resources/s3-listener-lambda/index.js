const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const QueueUrl = process.env.queueUrl;

const main = async (event, _context) => {
    try {
        console.log("lambda invoked");
        const { bucket, object } = event.Records[0].s3;
        const params = {Bucket: bucket.name, Key: object.key};
        const resp = await s3.getObject(params).promise();
        const stringBody = resp.Body.toString();
        console.log("stringBody", stringBody);
        const lines = stringBody.split('\r\n').flatMap((e) => e.split('\n'));
        console.log("lines", lines)
        for (const line of lines) {
            const msgParams = {
                MessageBody: line,
                QueueUrl,
            };
            console.log("sending message with params", msgParams);
            await sqs.sendMessage(msgParams).promise();
        }
    } catch (err) {
        console.error(err);
        return {
            statusCode: 400,
            body: err.message
        };

    }
}

module.exports = {
    main,
}