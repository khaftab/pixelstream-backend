
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();

const requiredEnvVars = [
  'AWS_REGION',
  'AWS_CLUSTER_ARN',
  'AWS_TASK_ARN',
  'ECS_CONTAINER_NAME',
  "AWS_QUEUE_URL",
  'SUBNET1',
  'SUBNET2',
  'SUBNET3',
  'SECURITY_GROUP_ID',
  'R2_BUCKET',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'WEBHOOK_URL',
  'WEBHOOK_API_KEY',
  'UPSTASH_REDIS_URL',
  'UPSTASH_REDIS_TOKEN'
];

// Validate required environment variables at startup

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

AWS.config.update({
  region: process.env.AWS_REGION,
});
const ecs = new AWS.ECS();


const deleteMessage = async (receiptHandle) => {
  const sqs = new AWS.SQS();
  const params = {
    QueueUrl: process.env.AWS_QUEUE_URL, // You'll need to add this to your requiredEnvVars
    ReceiptHandle: receiptHandle
  };

  try {
    await sqs.deleteMessage(params).promise();
    console.log(`Successfully deleted message: ${receiptHandle}`);
  } catch (error) {
    console.error(`Error deleting message: ${receiptHandle}`, error);
    // Don't throw here - we've already processed the message
  }
};

const createEcsParams = (s3Bucket, s3Key) => ({
  cluster: process.env.AWS_CLUSTER_ARN,
  taskDefinition: process.env.AWS_TASK_ARN,
  count: 1,
  launchType: "FARGATE",
  networkConfiguration: {
    awsvpcConfiguration: {
      subnets: [process.env.SUBNET1, process.env.SUBNET2, process.env.SUBNET3],
      securityGroups: [process.env.SECURITY_GROUP_ID],
      assignPublicIp: "ENABLED",
    },
  },
  overrides: {
    containerOverrides: [
      {
        name: process.env.ECS_CONTAINER_NAME,
        environment: [
          { name: "S3_BUCKET", value: s3Bucket },
          { name: "S3_KEY", value: s3Key },
          { name: "USER_ID", value: s3Key.split('/')[1] },
          { name: "OUTPUT_BASE", value: s3Key.split('/')[2].split('.')[0] },
          { name: "R2_BUCKET", value: process.env.R2_BUCKET },
          { name: "R2_ACCESS_KEY_ID", value: process.env.R2_ACCESS_KEY_ID },
          { name: "R2_SECRET_ACCESS_KEY", value: process.env.R2_SECRET_ACCESS_KEY },
          { name: "R2_ENDPOINT", value: process.env.R2_ENDPOINT },
          { name: "API_KEY", value: process.env.WEBHOOK_API_KEY },
          { name: "BACKEND_API", value: process.env.WEBHOOK_URL },
          { name: "REDIS_URL", value: process.env.UPSTASH_REDIS_URL },
          { name: "REDIS_TOKEN", value: process.env.UPSTASH_REDIS_TOKEN },
        ],
      },
    ],
  },
});

const startECSTask = async (s3Bucket, s3Key) => {
  try {
    const params = createEcsParams(s3Bucket, s3Key);
    console.log(`Starting ECS task for ${s3Key}`);
    // return;
    const data = await ecs.runTask(params).promise();

    if (!data.tasks || data.tasks.length === 0) {
      throw new Error('No tasks were created');
    }

    console.log(`ECS task started successfully: ${data.tasks[0].taskArn}`);
    return data.tasks[0].taskArn;
  } catch (error) {
    console.error('Error starting ECS task:', error);
    throw error;
  }
};

const processS3Event = async (record) => {
  const bucket = record.s3.bucket.name;
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

  try {
    const taskArn = await startECSTask(bucket, key);
    return { bucket, key, taskArn };
  } catch (error) {
    console.error(`Failed to process ${key} from bucket ${bucket}:`, error);
    throw error;
  }
};

// New function to extract S3 events from SQS messages
const extractS3EventsFromSQSMessages = (sqsRecords) => {
  const s3Records = [];

  for (const sqsRecord of sqsRecords) {
    try {
      // Parse the SQS message body which contains the S3 event
      const messageBody = JSON.parse(sqsRecord.body);

      // Check if the message body contains S3 Records
      if (messageBody.Records && Array.isArray(messageBody.Records)) {
        // Add each S3 record to our array
        messageBody.Records.forEach(record => {
          if (record.eventSource === 'aws:s3') {
            s3Records.push(record);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing SQS message body:', error);
      console.error('SQS message body:', sqsRecord.body);
      // Continue processing other records even if one fails
    }
  }

  return s3Records;
};

const handler = async (event) => {
  try {
    validateEnvironment();


    // Determine if this is a direct S3 event or an SQS event containing S3 notifications
    let s3Records = [];

    if (event.Records && event.Records.length > 0) {
      if (event.Records[0].eventSource === 'aws:sqs') {
        // This is an SQS event containing S3 notifications
        s3Records = extractS3EventsFromSQSMessages(event.Records);
        console.log(`Extracted ${s3Records.length} S3 records from SQS messages`);
      } else if (event.Records[0].eventSource === 'aws:s3') {
        // This is a direct S3 event
        s3Records = event.Records;
      }
    }

    if (s3Records.length === 0) {
      console.log('No S3 records found in the event');
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No S3 records to process',
        })
      };
    }

    const results = await Promise.all(
      s3Records.map(record => processS3Event(record))
    );

    if (event.Records[0].eventSource === 'aws:sqs') {
      console.log(" I am called");

      // Delete the SQS messages after processing. This is only needed for SQS events. Direct S3 events are not deleted.
      await Promise.all(event.Records.map(sqsRecord => deleteMessage(sqsRecord.receiptHandle)));

    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully processed all records',
        results
      })
    };
  } catch (error) {
    console.error('Error in Lambda handler:', error);
    throw error;
  }
};


module.exports = { handler };