const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.tableName;

const main = async (event, _context) => {
    try {
        console.log("lambda invoked");
        console.log("event", event);
        const { productId, price } = event;
        const params = {
            Item: {
                orderType: 'purchase',
                purchaseId: productId + '100',
                productId,
                price,
                tax: price * 0.1,
                orderDate: new Date().toISOString(),
                isDeleted: false
            },
            TableName,
        }
        const resp = await ddb.put(params).promise();
        console.log("put response", resp);
        return resp;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

module.exports = {
    main,
}