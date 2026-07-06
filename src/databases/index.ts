import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { DeliveryMemoItemEntity } from '@/entities/deliveryMemoItem.entity';
import { DeliveryMemoItemDamageEntity } from '@/entities/DeliveryMemoItemDamage.entity';
import { DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';
import { FabricEntity } from '@/entities/fabric.entity';
import { FabricDamageEntity } from '@/entities/fabricDamage.entity';
import { FabricShirtMappingEntity } from '@/entities/fabricShirtMapping.entity';
import { FabricTransactionHistoryEntity } from '@/entities/fabricTransitionHistory';
import { KanchButtonDetailsEntity } from '@/entities/KanchButtonDetails.entity';
import { PreStitcherAssignmentEntity } from '@/entities/preStitcher.entity';
import { PreStitcherPartialCompletionEntity } from '@/entities/preStitcherPartialCompletion.entity';

import { PreStitchOptionsEntity } from '@/entities/prestitchOptions.entity';
import { RolesEntity } from '@/entities/roles.entity';
import { TailorAssignmentEntity } from '@/entities/tailorAssignment.entity';
import { TailorDetailsEntity } from '@/entities/TailorDetails.entity';
import { UserEntity } from '@/entities/users.entity';
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from '@config';
import { DataSource } from 'typeorm';

export const DBDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_DATABASE,
  username: DB_USER,
  password: DB_PASSWORD,
  synchronize: true,
  logging: false,
  entities: [
    UserEntity,
    RolesEntity,
    FabricEntity,
    DeliveryMemoEntity,
    DeliveryMemoStageHistoryEntity,
    DeliveryMemoItemEntity,
    FabricTransactionHistoryEntity,
    FabricDamageEntity,
    PreStitcherAssignmentEntity,
    PreStitchOptionsEntity,
    TailorDetailsEntity,
    KanchButtonDetailsEntity,
    FabricShirtMappingEntity,
    PreStitcherPartialCompletionEntity,
    DeliveryMemoItemDamageEntity,
    TailorAssignmentEntity
  ],
});
