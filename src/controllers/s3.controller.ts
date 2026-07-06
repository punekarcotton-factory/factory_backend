import { getS3Service } from '@/provider/s3.provider';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

class S3Controller {
  /**
   * GET /api/s3/proxy/:key
   *
   * Dev + Staging: streams an S3 object directly from MinIO (dev) or Garage (staging)
   * back to the client. Both MinIO and Garage run on internal LAN IPs that are
   * not reachable by browsers outside the LAN. The backend server (on the same LAN)
   * fetches the object with its S3 credentials and relays it to the browser.
   *
   * The frontend's resolveImageUrl() prepends VITE_APP_SERVER_URL to turn the
   * relative /api/s3/proxy/... path into a full public URL.
   */
  public proxyImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.params.key is already decoded once by Express (%25 → %).  
      // Do NOT call decodeURIComponent again — that would turn %20 into a space
      // and break keys like "Image%20(2).jpg" which are stored literally in MinIO.
      const key = req.params.key;
      if (!key) {
        return res.status(400).json({ message: 'Missing image key' });
      }

      const s3Service = await getS3Service();

      // Access the S3 client via a friend method (we expose a getter below)
      // We call GetObjectCommand ourselves so we can stream to Express response
      const s3Client = (s3Service as any).s3Client;
      const bucketName = (s3Service as any).bucketName as string;

      const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
      const response = await s3Client.send(command);

      if (!response.Body) {
        return res.status(404).json({ message: 'Object not found' });
      }

      // Set content-type so Flutter displays the image correctly
      if (response.ContentType) {
        res.setHeader('Content-Type', response.ContentType);
      } else {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      if (response.ContentLength) {
        res.setHeader('Content-Length', response.ContentLength);
      }

      // Stream directly from MinIO → client (no buffering in memory)
      (response.Body as any).pipe(res);
    } catch (error: any) {
      logger.error(`S3 proxy error for key "${req.params.key}":`, error);
      next(error);
    }
  };
}

export default S3Controller;
