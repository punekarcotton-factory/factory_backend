import S3Controller from '@/controllers/s3.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';

class S3Route implements Routes {
  public path = '/api/s3';
  public router = Router();
  public s3Controller = new S3Controller();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // Proxy endpoint for local development.
    // Streams a MinIO object back to the client so the Flutter app
    // does not need to reach localhost:9000 directly.
    this.router.get(`${this.path}/proxy/:key`, this.s3Controller.proxyImage);
  }
}

export default S3Route;
