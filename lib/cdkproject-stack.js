const { Stack } = require('aws-cdk-lib');
const myApp = require('../lib/my-app.js');

class CdkprojectStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    new myApp.MyApp(this, "myApp")

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkprojectQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });
  }
}

module.exports = { CdkprojectStack }
