const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB();

const TableName = process.env.tableName;

const main = async (event, _context) => {
    try {
        // console.log("lambda invoked");
        // console.log("event", event);
        // console.log("tableName", TableName);
        // console.log(!!nanoId, "!!nanoid");
        // const params = {
        //     TableName,
        //     Item: {
        //         ...event,
        //         deleted: 0,
        //     }
        // };
        // const resp = await ddb.putItem(params).promise();
        // console.log("put response", resp);
        // return resp;
    } catch (err) {
        console.error(err);
        return err;
    }
}

module.exports = {
    main,
}