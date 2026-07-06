// // import { Client } from 'minio';
// import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET } from '@/config';
// import { logger } from '@/utils/logger';

// class MinioService {
//   private minioClient: Client;
//   private bucketName: string;
//   private endpoint: string;
//   private port: number;

//   constructor() {
//     this.bucketName = MINIO_BUCKET || 'punekar';

//     let endPoint = 'localhost';
//     let port = 9000;

//     if (MINIO_ENDPOINT) {
//       if (MINIO_ENDPOINT.includes(':')) {
//         const parts = MINIO_ENDPOINT.split(':');
//         endPoint = parts[0];
//         port = parseInt(parts[1]);
//       } else {
//         endPoint = MINIO_ENDPOINT;
//       }
//     }

//     this.endpoint = endPoint;
//     this.port = port;

//     this.minioClient = new Client({
//       endPoint,
//       port,
//       useSSL: false,
//       accessKey: MINIO_ACCESS_KEY,
//       secretKey: MINIO_SECRET_KEY,
//     });

//     this.initializeBucket();
//   }

//   private async initializeBucket() {
//     try {
//       const exists = await this.minioClient.bucketExists(this.bucketName);
//       if (!exists) {
//         await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
//         logger.info(`Bucket '${this.bucketName}' created successfully.`);
//       }

//       const policy = {
//         Version: '2012-10-17',
//         Statement: [
//           {
//             Effect: 'Allow',
//             Principal: { AWS: ['*'] },
//             Action: ['s3:GetObject'],
//             Resource: [`arn:aws:s3:::${this.bucketName}/*`],
//           },
//         ],
//       };

//       try {
//         await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
//         logger.info(`Bucket '${this.bucketName}' is now PUBLIC`);
//       } catch (error) {
//         logger.warn('Could not set bucket policy automatically');
//       }
//     } catch (error) {
//       logger.error(`Error checking/creating bucket '${this.bucketName}':`, error);
//     }
//   }

//   public async uploadFile(file: Express.Multer.File): Promise<string> {
//     const fileName = `${Date.now()}-${file.originalname}`;

//     try {
//       await this.minioClient.putObject(this.bucketName, fileName, file.buffer, file.size, { 'Content-Type': file.mimetype });

//       const HOST = process.env.MINIO_HOST || '192.168.1.12'; 

//       const imageUrl = `http://${HOST}:${this.port}/${this.bucketName}/${fileName}`;

//       return imageUrl;
//     } catch (error) {
//       logger.error('Error uploading file to MinIO:', error);
//       throw error;
//     }
//   }

//   public async getFileUrl(fileName: string): Promise<string> {
//     try {
//       const url = await this.minioClient.presignedGetObject(this.bucketName, fileName, 24 * 60 * 60 * 7);
//       return url.replace('localhost', '192.168.1.12');
//     } catch (error) {
//       logger.error('Error generating presigned URL:', error);
//       throw error;
//     }
//   }
// }

// export default MinioService;
