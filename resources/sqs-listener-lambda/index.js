const main = async (event) => {
    event.Records.forEach((record) => {
        console.log('Record: %j', record);
    });
}

module.exports = {
    main,
}