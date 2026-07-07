import { CreateUserDto, UpdateUserDto, ReassignTasksDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { User } from '@interfaces/users.interface';
import { isEmpty } from '@utils/util';
import { UserEntity } from '@/entities/users.entity';
import { RolesEntity } from '@/entities/roles.entity';
import { DeliveryMemoEntity } from '@/entities/deliverymemo.entity';
import { PreStitcherAssignmentEntity } from '@/entities/preStitcher.entity';
import { TailorDetailsEntity } from '@/entities/TailorDetails.entity';
import { KanchButtonDetailsEntity } from '@/entities/KanchButtonDetails.entity';
import AuthService from './auth.service';
import { DEFAULT_USER_PASSWORD } from '@/config';
import { Not, ILike, In } from 'typeorm';
import { DBDataSource } from '@/databases';
import { TailorAssignmentStatus as TailorMemoStatus } from '@/constants/tailorStatus.enum';
import { KanchButtonAssignmentStatus, KanchButtonReturnStatus } from '@/constants/KanchButtonStatus.enum';
import { TailorAssignmentStatus as TailorEntryStatus, TailorAssignmentEntity } from '@/entities/tailorAssignment.entity';
import { DeliveryMemoStageHistoryEntity } from '@/entities/deliveryMemoStageHistory.entity';

class UserService {
  public users = UserEntity;
  public roles = RolesEntity;
  public authService = new AuthService();

  public async findAllUser(): Promise<User[]> {
    const users: User[] = await this.users.find();
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  public async findUserById(userId: string): Promise<User[]> {
    const findUsers: User[] = await this.users.find({
      where: { _id: Not(userId) },
    });

    if (findUsers.length === 0) {
      throw new HttpException(409, 'No other users exist');
    }

    return findUsers.map(user => {
      delete user.password;
      return user;
    });
  }

  private async resolveRole(roleId?: string, roleName?: string): Promise<{ roleId: string; roleName: string }> {
    let resolvedRoleId = roleId;
    let resolvedRoleName = roleName;

    if (!resolvedRoleId && resolvedRoleName) {
      const role = await this.roles.findOne({ where: { roleName: resolvedRoleName } });
      if (role) {
        resolvedRoleId = role._id;
        resolvedRoleName = role.roleName;
      } else {
        throw new HttpException(404, `Role "${resolvedRoleName}" not found`);
      }
    } else if (resolvedRoleId && !resolvedRoleName) {
      const role = await this.roles.findOne({ where: { _id: resolvedRoleId } });
      if (role) {
        resolvedRoleName = role.roleName;
      } else {
        throw new HttpException(404, `Role with ID "${resolvedRoleId}" not found`);
      }
    } else if (resolvedRoleId && resolvedRoleName) {
      const role = await this.roles.findOne({ where: { _id: resolvedRoleId } });
      if (!role) {
        throw new HttpException(404, `Role with ID "${resolvedRoleId}" not found`);
      }
      resolvedRoleName = role.roleName;
    } else {
      const defaultRole = await this.roles.findOne({ where: { roleName: 'Fabric Manager' } });
      if (defaultRole) {
        resolvedRoleId = defaultRole._id;
        resolvedRoleName = defaultRole.roleName;
      } else {
        throw new HttpException(404, 'Default role "Fabric Manager" not found');
      }
    }

    return { roleId: resolvedRoleId, roleName: resolvedRoleName };
  }

  public async createUser(userData: CreateUserDto): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const findUser = await this.users.findOne({ where: { email: userData.email } });
    if (findUser) {
      if (findUser.isActive) {
        throw new HttpException(409, `This email ${userData.email} already exists`);
      } else {
        throw new HttpException(409, `DEACTIVATED_USER_EXISTS:${findUser._id}`);
      }
    }

    const password = DEFAULT_USER_PASSWORD;
    const hashedPassword = await this.authService.hashPassword(password);

    const { roleId, roleName } = await this.resolveRole(userData.roleId, userData.roleName);

    const createUserData: User = await this.users.save({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      roleId: roleId,
      roleName: roleName,
      createdBy: userData.createdBy,
      tailorIdentifierId: userData.tailorIdentifierId
    });

    // Remove password from response
    delete createUserData.password;

    return createUserData;
  }

  public async updateUser(userId: string, userData: UpdateUserDto): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const user = await this.users.findOneBy({
      _id: userId,
      isActive: true,
    });

    if (!user) {
      throw new HttpException(404, "User doesn't exist or is deactivated");
    }

    const updateData: Partial<UserEntity> = {};

    if (userData.email) {
      const findUser = await this.users.findOneBy({
        email: userData.email,
        isActive: true,
      });

      if (findUser && findUser._id != userId) {
        throw new HttpException(409, `This email ${userData.email} already exists`);
      }

      updateData.email = userData.email;
    }

    if (userData.firstName) {
      updateData.firstName = userData.firstName;
    }

    if (userData.lastName) {
      updateData.lastName = userData.lastName;
    }

    if (userData.phone) {
      updateData.phone = userData.phone;
    }

    if (userData.roleId || userData.roleName) {
      const { roleId, roleName } = await this.resolveRole(
        userData.roleId,
        userData.roleName,
      );

      updateData.roleId = roleId;
      updateData.roleName = roleName;
    }

    // Update password if provided
    if (userData.password) {
      const hashedPassword = await this.authService.hashPassword(userData.password);

      updateData.password = hashedPassword;
    }

    const updatedUser: User = await this.users
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateData)
      .where('_id = :id', { id: userId })
      .returning('*')
      .execute()
      .then(res => res.raw[0]);

    delete updatedUser.password;

    return updatedUser;
  }

  public async getUserTaskSummary(userId: string): Promise<any> {
    const user = await this.users.findOne({ where: { _id: userId } });
    if (!user) throw new HttpException(404, 'User not found');

    const memoRepo = DBDataSource.getRepository(DeliveryMemoEntity);
    const tailorDetailRepo = DBDataSource.getRepository(TailorDetailsEntity);
    const kanchButtonDetailRepo = DBDataSource.getRepository(KanchButtonDetailsEntity);
    const tailorAssignmentRepo = DBDataSource.getRepository(TailorAssignmentEntity);

    let tailorDetailId = null;
    let kanchButtonDetailId = null;

    if (user.phone) {
      if (user.roleName?.toLowerCase().includes('tailor')) {
        const tailor = await tailorDetailRepo.findOne({ where: { phoneNumber: user.phone } });
        if (tailor) tailorDetailId = tailor._id;
      }
      if (user.roleName?.toLowerCase().includes('kanch')) {
        const kanch = await kanchButtonDetailRepo.findOne({ where: { phoneNumber: user.phone } });
        if (kanch) kanchButtonDetailId = kanch._id;
      }
    }

    const ongoingPreStitcher = await memoRepo.count({
      where: { assignedPreStitcherId: userId, stage: In(['PRE_STITCHER_ASSIGNED', 'PRE_STITCHER_IN_PROGRESS']) },
    });

    let ongoingTailor = 0;
    if (tailorDetailId) {
      const singleTailorMemos = await memoRepo.count({
        where: { tailorDetailsId: tailorDetailId, tailorAssignmentStatus: In([TailorMemoStatus.ASSIGNED, TailorMemoStatus.IN_PROGRESS]) },
      });
      const multipleTailorAssignments = await tailorAssignmentRepo.count({
        where: { tailorId: tailorDetailId, status: In([TailorEntryStatus.ASSIGNED, TailorEntryStatus.IN_PROGRESS]) },
      });
      ongoingTailor = singleTailorMemos + multipleTailorAssignments;
    }

    let ongoingKanch = 0;
    if (kanchButtonDetailId) {
      ongoingKanch = await memoRepo.count({
        where: { KanchButtonDetailsId: kanchButtonDetailId, kanchButtonAssignmentStatus: KanchButtonAssignmentStatus.ASSIGNED },
      });
    }

    const ongoingTasksCount = ongoingPreStitcher + ongoingTailor + ongoingKanch;

    // Completed tasks count
    const completedPreStitcher = await memoRepo.count({
      where: { assignedPreStitcherId: userId, stage: In(['PRE_STITCHER_COMPLETED', 'ASSIGN_TAILOR']) },
    });
    let completedTailor = 0;
    if (tailorDetailId) {
      const singleTailorMemos = await memoRepo.count({
        where: { tailorDetailsId: tailorDetailId, tailorAssignmentStatus: TailorMemoStatus.COMPLETED },
      });
      const multipleTailorAssignments = await tailorAssignmentRepo.count({
        where: { tailorId: tailorDetailId, status: TailorEntryStatus.COMPLETED },
      });
      completedTailor = singleTailorMemos + multipleTailorAssignments;
    }
    let completedKanch = 0;
    if (kanchButtonDetailId) {
      completedKanch = await memoRepo.count({
        where: { KanchButtonDetailsId: kanchButtonDetailId, kanchButtonAssignmentStatus: KanchButtonAssignmentStatus.COMPLETED },
      });
    }

    const completedTasksCount = completedPreStitcher + completedTailor + completedKanch;

    let eligibleReassignees: User[] = [];
    if (ongoingTasksCount > 0) {
      eligibleReassignees = await this.users.find({
        where: { roleId: user.roleId, _id: Not(userId), isActive: true },
      });
      eligibleReassignees.forEach(u => delete u.password);
    }

    delete user.password;
    return {
      user,
      ongoingTasks: ongoingTasksCount,
      completedTasks: completedTasksCount,
      canDelete: ongoingTasksCount === 0,
      eligibleReassignees,
    };
  }

  public async deleteUser(userId: string, deletedBy: string): Promise<User> {
    const user = await this.users.findOneBy({ _id: userId, isActive: true });
    if (!user) throw new HttpException(404, "User doesn't exist");

    const { ongoingTasks, eligibleReassignees } = await this.getUserTaskSummary(userId);

    if (ongoingTasks > 0) {
      if (eligibleReassignees.length === 0) {
        throw new HttpException(409, `User has ongoing tasks and no eligible reassignees are available. Please create a new user with the same role first.`);
      }
      throw new HttpException(409, `User has ongoing tasks. Please reassign tasks to another user with the same role before deleting.`);
    }

    const deletedUser: User = await this.users
      .createQueryBuilder()
      .update(UserEntity)
      .set({ isActive: false, deletedAt: new Date(), deletedBy })
      .where('_id = :id', { id: userId })
      .returning('*')
      .execute()
      .then(res => res.raw[0]);

    delete deletedUser.password;
    return deletedUser;
  }

  public async reassignUserTasks(reassignData: ReassignTasksDto, reassignedBy: string): Promise<any> {
    const fromUser = await this.users.findOneBy({ _id: reassignData.fromUserId, isActive: true });
    const toUser = await this.users.findOneBy({ _id: reassignData.toUserId, isActive: true });

    if (!fromUser || !toUser) throw new HttpException(404, 'Users not found');
    if (fromUser.roleId !== toUser.roleId) {
      throw new HttpException(400, `Role mismatch: cannot reassign tasks from ${fromUser.roleName} to ${toUser.roleName}. Please pick a user with the same role.`);
    }

    const memoRepo = DBDataSource.getRepository(DeliveryMemoEntity);
    const tailorAssignmentRepo = DBDataSource.getRepository(TailorAssignmentEntity);
    const preStitcherAssignmentRepo = DBDataSource.getRepository(PreStitcherAssignmentEntity);
    const tailorDetailRepo = DBDataSource.getRepository(TailorDetailsEntity);
    const kanchButtonDetailRepo = DBDataSource.getRepository(KanchButtonDetailsEntity);

    // Resolve details IDs for FROM user
    let fromTailorDetailId = null;
    let fromKanchDetailId = null;
    if (fromUser.phone) {
      if (fromUser.roleName?.toLowerCase().includes('tailor')) {
        const t = await tailorDetailRepo.findOne({ where: { phoneNumber: fromUser.phone } });
        if (t) fromTailorDetailId = t._id;
      }
      if (fromUser.roleName?.toLowerCase().includes('kanch')) {
        const k = await kanchButtonDetailRepo.findOne({ where: { phoneNumber: fromUser.phone } });
        if (k) fromKanchDetailId = k._id;
      }
    }

    // Resolve details IDs for TO user
    let toTailorDetailId = null;
    let toKanchDetailId = null;
    if (toUser.phone) {
      if (toUser.roleName?.toLowerCase().includes('tailor')) {
        const t = await tailorDetailRepo.findOne({ where: { phoneNumber: toUser.phone } });
        if (t) toTailorDetailId = t._id;
      }
      if (toUser.roleName?.toLowerCase().includes('kanch')) {
        const k = await kanchButtonDetailRepo.findOne({ where: { phoneNumber: toUser.phone } });
        if (k) toKanchDetailId = k._id;
      }
    }

    // 1. Reassign Pre-Stitcher tasks
    const preStitcherMemos = await memoRepo.find({
      where: { assignedPreStitcherId: fromUser._id, stage: In(['PRE_STITCHER_ASSIGNED', 'PRE_STITCHER_IN_PROGRESS']) }
    });
    if (preStitcherMemos.length > 0) {
      const ids = preStitcherMemos.map(m => m._id);
      await memoRepo.update({ _id: In(ids) }, { assignedPreStitcherId: toUser._id });
      await preStitcherAssignmentRepo.update({ preStitcherId: fromUser._id, deliveryMemoId: In(ids) }, { preStitcherId: toUser._id });
    }

    // 2. Reassign Tailor tasks
    if (fromTailorDetailId) {
      if (!toTailorDetailId) {
        // Create TailorDetails for the target user if missing
        const newTailor = await tailorDetailRepo.save({
          name: `${toUser.firstName} ${toUser.lastName}`,
          phoneNumber: toUser.phone,
        });
        toTailorDetailId = newTailor._id;
      }

      // Multiple assignments
      await tailorAssignmentRepo.update(
        { tailorId: fromTailorDetailId, status: In([TailorEntryStatus.ASSIGNED, TailorEntryStatus.IN_PROGRESS]) },
        { tailorId: toTailorDetailId }
      );
      // Single assignments in DeliveryMemo
      await memoRepo.update(
        { tailorDetailsId: fromTailorDetailId, tailorAssignmentStatus: In([TailorMemoStatus.ASSIGNED, TailorMemoStatus.IN_PROGRESS]) },
        { tailorDetailsId: toTailorDetailId }
      );
    }

    // 3. Reassign Kanch-Button tasks
    if (fromKanchDetailId) {
      if (!toKanchDetailId) {
        // Create KanchButtonDetails for the target user if missing
        const newKanch = await kanchButtonDetailRepo.save({
          name: `${toUser.firstName} ${toUser.lastName}`,
          phoneNumber: toUser.phone,
        });
        toKanchDetailId = newKanch._id;
      }

      await memoRepo.update(
        { KanchButtonDetailsId: fromKanchDetailId, kanchButtonAssignmentStatus: KanchButtonAssignmentStatus.ASSIGNED },
        { KanchButtonDetailsId: toKanchDetailId }
      );
    }

    // 4. Log Reassignment History
    const stageHistoryRepo = DBDataSource.getRepository(DeliveryMemoStageHistoryEntity);
    const allMemos = [...preStitcherMemos.map(m => m._id)];

    // Add memos from tailor and kanch reassignment if they weren't covered
    // (Existing logic updates memoRepo.update based on IDs, but we need to track which ones changed)
    // For simplicity, let's track the ones we specifically found as ongoing for the fromUser

    const reassignMetadata = {
      reassignedFromId: fromUser._id,
      reassignedFromName: `${fromUser.firstName} ${fromUser.lastName}`,
      reassignedToId: toUser._id,
      reassignedToName: `${toUser.firstName} ${toUser.lastName}`,
      reassignedBy,
      type: 'TASK_REASSIGNMENT'
    };

    if (allMemos.length > 0) {
      const historyEntries = allMemos.map(memoId => ({
        deliveryMemoId: memoId,
        stage: 'TASK_REASSIGNED',
        enteredAt: new Date(),
        performedBy: reassignedBy,
        metadata: reassignMetadata
      }));
      await stageHistoryRepo.save(historyEntries);
    }

    return { message: `Successfully reassigned tasks to ${toUser.firstName} ${toUser.lastName}` };
  }

  public async findUsersByRole(roleName: string): Promise<User[]> {
    const role = await this.roles.findOne({
      where: { roleName: ILike(roleName) }
    });

    if (!role) {
      throw new HttpException(404, `Role "${roleName}" not found`);
    }

    const users: User[] = await this.users.find({
      where: { roleId: role._id, isActive: true }
    });

    // Remove passwords from response
    users.forEach(user => delete user.password);

    return users;
  }

  public async reactivateUser(userId: string): Promise<User> {
    const user = await this.users.findOneBy({ _id: userId, isActive: false });
    if (!user) throw new HttpException(404, "Inactive user doesn't exist");

    const updatedUser: User = await this.users
      .createQueryBuilder()
      .update(UserEntity)
      .set({ isActive: true, deletedAt: null, deletedBy: null })
      .where('_id = :id', { id: userId })
      .returning('*')
      .execute()
      .then(res => res.raw[0]);

    delete updatedUser.password;
    return updatedUser;
  }
}

export default UserService;
