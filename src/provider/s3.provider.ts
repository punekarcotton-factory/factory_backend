import S3Service from '@/services/s3.service';
import { logger } from '@/utils/logger';

let s3Instance: S3Service | null = null;

export const getS3Service = async (): Promise<S3Service> => {
  if (!s3Instance) {
    s3Instance = await S3Service.create();
  }
  return s3Instance;
};

/**
 * Enriches an array of memos (or any objects) that contain items[].imageUrl
 * with pre-signed URLs. Works recursively for nested structures.
 * Safe to call — silently skips items without imageUrl.
 */
export const enrichMemosWithPresignedUrls = async (
  memos: any[],
  s3Service: S3Service,
): Promise<any[]> => {
  if (!memos || !Array.isArray(memos)) return memos;

  return Promise.all(
    memos.map(async memo => {
      if (!memo) return memo;

      // Enrich items array if present
      if (memo.items && Array.isArray(memo.items)) {
        memo.items = await Promise.all(
          memo.items.map(async (item: any) => {
            if (item?.imageUrl) {
              try {
                item.imageUrl = await s3Service.getPresignedUrlOrSame(item.imageUrl);
              } catch (e) {
                logger.error(`[S3] Failed to presign imageUrl for item: ${e}`);
              }
            }
            return item;
          }),
        );
      }

      // Also enrich top-level imageUrl if present (for single-item objects)
      if (memo.imageUrl) {
        try {
          memo.imageUrl = await s3Service.getPresignedUrlOrSame(memo.imageUrl);
        } catch (e) {
          logger.error(`[S3] Failed to presign top-level imageUrl: ${e}`);
        }
      }

      return memo;
    }),
  );
};
