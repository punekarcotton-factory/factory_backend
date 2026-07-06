import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: 'us-east-1',
  endpoint: 'https://postman-echo.com/post', // this will return JSON
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
  requestHandler: {
    // maybe we can mock it?
  }
});

async function run() {
  try {
    await client.send(new ListBucketsCommand({}));
  } catch (err: any) {
    console.log(err.name);
    console.log(err.message);
    console.log(err);
  }
}
run();
