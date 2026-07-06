import App from '@/app';
import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import UsersRoute from '@routes/users.route';
import FabricRoute from '@routes/fabric.route';
import validateEnv from '@utils/validateEnv';
import RolesRoute from './routes/roles.routes';
import DeliveryMemoRoute from './routes/deliverymemo.route';
import PreStitcherRoute from './routes/preStitcher.route';
import DeliveryMemoStageHistoryRoute from './routes/deliverymemoStageHistory.route';
import AssignTailorRoute from './routes/assignTailor.route';
import KanchButtonRoute from './routes/kanchButton.route';
import PreStitcherPartialCompletionRoute from './routes/preStitcherPartialCompletion.route';
import S3Route from './routes/s3.route';

validateEnv();

const app = new App([
  new IndexRoute(),
  new UsersRoute(),
  new AuthRoute(),
  new RolesRoute(),
  new FabricRoute(),
  new S3Route(),
  new DeliveryMemoRoute(),
  new PreStitcherRoute(),
  new DeliveryMemoStageHistoryRoute(),
  new AssignTailorRoute(),
  new KanchButtonRoute(),
  new PreStitcherPartialCompletionRoute(),
]);


(async () => {
  try {
    await app.listen();
  } catch (err) {
    console.error('Fatal: failed to start server —', err);
    process.exit(1);
  }
})();
