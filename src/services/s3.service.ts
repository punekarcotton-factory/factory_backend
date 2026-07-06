import { S3Client, PutObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MINIO_HOST } from '@/config';
import { logger } from '@/utils/logger';

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  // constructor() {
  //   this.bucketName = MINIO_BUCKET || 'punekar';

  //   // Parse endpoint and port if necessary, though AWS SDK expects a full URL usually or region.
  //   // Assuming MINIO_ENDPOINT is the full URL or hostname.
  //   // If MINIO_ENDPOINT was like "localhost:9000", we might need to prepend http/https if missing.
  //   // But typically for S3 compatible services, we provide the full endpoint.
  //   // Let's adapt based on typical MinIO config which might have been just hostname.

  //   let endpoint = MINIO_ENDPOINT;
  //   if (endpoint && !endpoint.startsWith('http')) {
  //       // If it was just 'localhost' or '192.168.1.12', we assume http for local/internal
  //       endpoint = `http://${endpoint}`;
  //   }

  //   const config: any = {
  //     credentials: {
  //       accessKeyId: MINIO_ACCESS_KEY,
  //       secretAccessKey: MINIO_SECRET_KEY,
  //     },
  //     forcePathStyle: true, // Needed for MinIO/Garage often
  //   };

  //   if (endpoint) {
  //       config.endpoint = endpoint;
  //       logger.info(`S3 Service initialized with endpoint: ${endpoint}`);
  //   }

  //   config.region = 'garage';

  //   this.s3Client = new S3Client(config);
  //   logger.info(`S3 Client initialized with region: ${config.region}`);

  //   this.initializeBucket();
  // }

  // private async initializeBucket() {
  //   try {
  //     try {
  //       await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
  //     } catch (error: any) {
  //       if (error.$metadata?.httpStatusCode === 404) {
  //            logger.info(`Bucket '${this.bucketName}' does not exist. Creating...`);
  //            await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
  //            logger.info(`Bucket '${this.bucketName}' created successfully.`);
  //       } else {
  //           throw error;
  //       }
  //     }

  //     // Set policy to public - similar to previous MinioService
  //     const policy = {
  //       Version: '2012-10-17',
  //       Statement: [
  //         {
  //           Effect: 'Allow',
  //           Principal: { AWS: ['*'] },
  //           Action: ['s3:GetObject'],
  //           Resource: [`arn:aws:s3:::${this.bucketName}/*`],
  //         },
  //       ],
  //     };

  //     try {
  //       await this.s3Client.send(new PutBucketPolicyCommand({
  //           Bucket: this.bucketName,
  //           Policy: JSON.stringify(policy)
  //       }));
  //       logger.info(`Bucket '${this.bucketName}' is now PUBLIC`);
  //     } catch (error) {
  //       logger.warn('Could not set bucket policy automatically', error);
  //     }

  //   } catch (error: any) {
  //     if (error.name === 'DeserializationError' || error.message?.includes('not expected')) {
  //        logger.error(`Deserialization Error in initializeBucket: The server at ${MINIO_ENDPOINT} might not be a valid S3 API or is returning JSON.`);
  //     }
  //     logger.error(`Error checking/creating bucket '${this.bucketName}':`, error);
  //   }
  // }

    private constructor() {
    this.bucketName = MINIO_BUCKET || 'punekar';

    let endpoint = MINIO_ENDPOINT;
    if (endpoint && !endpoint.startsWith('http')) {
      endpoint = `http://${endpoint}`;
    }

    // In dev with a LAN IP set as MINIO_HOST (e.g. for Flutter on phone),
    // replace localhost with the LAN IP in the endpoint BEFORE creating the client.
    // This ensures pre-signed URLs are signed for 192.168.1.x:9000 directly,
    // so the signature stays valid when the phone accesses the URL.
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev && MINIO_HOST && MINIO_HOST !== 'localhost' && MINIO_HOST !== '127.0.0.1') {
      endpoint = endpoint
        ?.replace('localhost', MINIO_HOST)
        ?.replace('127.0.0.1', MINIO_HOST);
    }

    // Use 'us-east-1' for MinIO (local dev) and 'garage' for Garage (staging/prod)
    const config: any = {
      credentials: {
        accessKeyId: MINIO_ACCESS_KEY,
        secretAccessKey: MINIO_SECRET_KEY,
      },
      forcePathStyle: true,
      region: isDev ? 'us-east-1' : 'garage',
    };

    if (endpoint) {
      config.endpoint = endpoint;
      logger.info(`S3 Service initialized with endpoint: ${endpoint}`);
    }

    this.s3Client = new S3Client(config);
    logger.info(`S3 Client initialized with region: ${config.region}`);
  }

  //  Proper async factory
  public static async create(): Promise<S3Service> {
    const service = new S3Service();
    await service.initializeBucket();
    return service;
  }

  private async initializeBucket() {
    try {
      // Try creating bucket directly (more reliable across providers)
      try {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName })
        );
        logger.info(`Bucket '${this.bucketName}' created successfully.`);
      } catch (err: any) {
        // Handle "already exists" from any S3-compatible provider
        if (
          err.name === 'BucketAlreadyOwnedByYou' ||
          err.name === 'BucketAlreadyExists' ||
          err.Code === 'BucketAlreadyOwnedByYou' ||
          err.Code === 'BucketAlreadyExists' ||
          err.$metadata?.httpStatusCode === 409
        ) {
          logger.info(`Bucket '${this.bucketName}' already exists.`);
        } else if (err.name === 'DeserializationError' || err.message?.includes('not expected')) {
          if (err.$metadata?.httpStatusCode === 200) {
            logger.info(`Bucket '${this.bucketName}' created successfully (bypassed JSON parsing error).`);
          } else if (err.$metadata?.httpStatusCode === 409) {
            logger.info(`Bucket '${this.bucketName}' already exists (bypassed JSON parsing error).`);
          } else {
            throw err;
          }
        } else if (err.name === 'AggregateError' || err.constructor?.name === 'AggregateError') {
          // AggregateError often happens in local dev when MinIO is not ready or returns
          // multiple errors. Log and swallow in development.
          logger.warn(`[DEV] AggregateError during bucket init — likely MinIO is not reachable yet: ${err.message}`);
          throw err; // Will be caught by the outer try-catch which skips in dev
        } else {
          throw err;
        }
      }

      // Set public policy (commented out — Garage does not support this)
      logger.info(`Bucket '${this.bucketName}' is now ready.`);

    } catch (error: any) {
      logger.error(
        `Error initializing bucket '${this.bucketName}':`,
        error?.message || error
      );
      // In development (MinIO), don't crash the app if bucket init fails.
      // The bucket may already exist or MinIO may be temporarily unavailable.
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
      logger.warn(`[DEV] Bucket init failed — continuing anyway. Make sure MinIO is running at ${MINIO_ENDPOINT}`);
    }
  }


  public async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`;

    // Construct URL before the upload command, so it's ready in catch block
    let imageUrl = '';
    try {
      const endpoint = await this.s3Client.config.endpoint();
      const protocol = endpoint.protocol;
      const hostname = endpoint.hostname;
      const port = endpoint.port ? `:${endpoint.port}` : '';
      let finalHostname = hostname;
      if (finalHostname === 'localhost' || finalHostname === '127.0.0.1') {
          finalHostname = MINIO_HOST || 'localhost';
      }
      imageUrl = `${protocol}//${finalHostname}${port}/${this.bucketName}/${fileName}`;
    } catch (e) {
      logger.warn('Could not resolve endpoint config, using fallback URL generation');
      imageUrl = `http://${MINIO_HOST || 'localhost'}:9000/${this.bucketName}/${fileName}`;
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      logger.info(`Starting upload to S3: Bucket=${this.bucketName}, Key=${fileName}, MIME=${file.mimetype}`);
      await this.s3Client.send(command);
      logger.info(`Successfully uploaded file to S3: ${fileName}`);

      return fileName;
    } catch (error: any) {
      if (error.$metadata) {
        logger.error(`S3 Error Metadata: Status=${error.$metadata.httpStatusCode}, RequestID=${error.$metadata.requestId}`);
      }
      if (error.name === 'DeserializationError' || error.message?.includes('not expected')) {
        if (error.$metadata?.httpStatusCode === 200) {
           logger.warn(`Detected Deserialization Error, but HTTP status is 200 OK. Treating upload as successful.`);
           return fileName;
        }
        logger.error(`Detected Deserialization Error. HTTP Status: ${error.$metadata?.httpStatusCode}.`);
      }
      logger.error(`Error uploading file '${fileName}' to S3 bucket '${this.bucketName}':`, error);
      throw error;
    }
  }

  public extractKeyFromUrl(url: string): string {
    if (!url) return url;
    // Handle backend proxy paths like /api/s3/proxy/filename.jpg
    const proxyPrefix = '/api/s3/proxy/';
    if (url.includes(proxyPrefix)) {
      const idx = url.indexOf(proxyPrefix);
      return url.slice(idx + proxyPrefix.length);
    }
    if (!url.startsWith('http')) return url;
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/');
      const bucketIdx = pathParts.findIndex(p => p === this.bucketName || p === 'punekar');
      if (bucketIdx !== -1 && bucketIdx < pathParts.length - 1) {
        return pathParts.slice(bucketIdx + 1).join('/');
      }
      return pathParts[pathParts.length - 1];
    } catch (e) {
      return url;
    }
  }

  public async getPresignedUrlOrSame(urlOrKey: string): Promise<string> {
    if (!urlOrKey) return urlOrKey;
    const key = this.extractKeyFromUrl(urlOrKey);
    return this.getFileUrl(key);
  }

  public async getFileUrl(fileName: string): Promise<string> {
    // Both development (MinIO) and staging (Garage) use internal LAN IPs that
    // browser clients outside the LAN cannot reach directly.
    // We always return a backend proxy path so the server (which is on the same
    // LAN as the S3 service) fetches and streams the image to the client.
    // The frontend's resolveImageUrl() will prepend VITE_APP_SERVER_URL to the
    // relative path to form the full public URL.
    return `/api/s3/proxy/${encodeURIComponent(fileName)}`;
  }
}

export default S3Service;
