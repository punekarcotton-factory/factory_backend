import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS } from '@config';
import { Routes } from '@interfaces/routes.interface';
import errorMiddleware from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { DBDataSource } from './databases';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'staging';
    this.port = PORT || 3000;

    // NOTE: DB connection is NOT started here.
    // It is awaited inside listen() so the HTTP server only
    // opens AFTER the DataSource is fully initialized.
    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeSwagger();
    this.initializeErrorHandling();
  }

  public async listen() {
    // Wait for DB to be fully ready before accepting any HTTP requests.
    // This prevents the "DataSource is not set for this entity" race condition
    // that appears in staging where the remote DB takes longer to connect.
    await this.connectToDatabase();

    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public async closeDatabaseConnection(): Promise<void> {
    try {
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  public getServer() {
    return this.app;
  }

  private async connectToDatabase() {
    try {
      await DBDataSource.initialize();
      logger.info('====== DB CONNECTED ======');
    } catch (error) {
      logger.error('====== DB CONNECTION FAILED — server will NOT start ======');
      logger.error(error);
      // Re-throw so listen() stops and the process exits with an error.
      // This makes the failure visible in pm2 logs immediately.
      throw error;
    }
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT || 'dev', { stream }));
    // Enhanced CORS configuration
    this.app.use(
      cors({
        origin: ORIGIN,
        credentials: CREDENTIALS,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['Set-Cookie'],
        preflightContinue: false,
        optionsSuccessStatus: 204,
      }),
    );

    // Handle preflight requests explicitly
    this.app.options('*', cors());

    this.app.use(hpp());

    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());

    // Add a simple middleware to log all requests (helpful for debugging)
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeSwagger() {
    const options = {
      swaggerDefinition: {
        info: {
          title: 'REST API',
          version: '1.0.0',
          description: 'Example docs',
        },
      },
      apis: ['swagger.yaml'],
    };

    const specs = swaggerJSDoc(options);
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}

export default App;
