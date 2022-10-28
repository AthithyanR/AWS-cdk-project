const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sqs = new AWS.SQS();

const QueueUrl = process.env.queueUrl;

const main = async(event, _context) => {
    try {
        console.log("lambda invoked");
        const file = await getFileFromDb(event);
        const lines = parseFile(file.Body);
        console.log("lines", lines);
        for (const line of lines) {
            const msgParams = {
                MessageBody: line,
                MessageGroupId: "MessageGroupId",
                QueueUrl,
            };
            console.log("sending message with params", msgParams);
            await sqs.sendMessage(msgParams).promise();
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

const getFileFromDb = async(event) => {
    const { bucket, object } = event.Records[0].s3;
    const params = {Bucket: bucket.name, Key: object.key};
    const file = await s3.getObject(params).promise();
    return file;
}

const parseFile = (body) => {
    return body.toString().split('\r\n').flatMap((e) => e.split('\n'));
}

module.exports = {
    main,
}