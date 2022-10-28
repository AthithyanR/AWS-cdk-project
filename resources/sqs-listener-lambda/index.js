const AWS = require('aws-sdk');
const sf = new AWS.StepFunctions();

const stateMachineArn = process.env.stateMachineArn;

const main = async (event) => {
    console.log("lambda invoked")
    for (const record of event.Records) {
        console.log('Record: ', record);
        try {
            const params = {
                stateMachineArn,
                input: record.body,
            };
            const result = await sf.startSyncExecution(params).promise();
            console.log(result)
        } catch(err) {
            console.error(err);
        }
    }
}

module.exports = {
    main,
}