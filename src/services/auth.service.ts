import { UserEntity } from '@/entities/users.entity';
import { RolesEntity } from '@/entities/roles.entity';
import { SECRET_KEY } from '@config';
import { CreateUserDto, LoginUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { User } from '@interfaces/users.interface';
import { isEmpty } from '@utils/util';
import { pbkdf2Sync, randomBytes } from 'crypto';
import { sign } from 'jsonwebtoken';

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

class AuthService {
  public users = UserEntity;
  public roles = RolesEntity;

  public async signup(userData: CreateUserDto): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const findUser = await this.users.findOneBy({ email: userData.email });
    if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

    const hashedPassword = await this.hashPassword(userData.password);

    let roleId = userData.roleId;
    let roleName = userData.roleName;


    if (!roleId && roleName) {
      const role = await this.roles.findOne({ where: { roleName: roleName } });
      if (role) {
        roleId = role._id;
        roleName = role.roleName;
      } else {
        throw new HttpException(404, `Role "${roleName}" not found`);
      }
    }

    else if (roleId && !roleName) {
      const role = await this.roles.findOne({ where: { _id: roleId } });
      if (role) {
        roleName = role.roleName;
      } else {
        throw new HttpException(404, `Role with ID "${roleId}" not found`);
      }
    }

    else if (roleId && roleName) {
      const role = await this.roles.findOne({ where: { _id: roleId } });
      if (!role) {
        throw new HttpException(404, `Role with ID "${roleId}" not found`);
      }
      roleName = role.roleName; 
    }

    else {
      const defaultRole = await this.roles.findOne({ where: { roleName: 'Fabric Manager' } });
      if (defaultRole) {
        roleId = defaultRole._id;
        roleName = defaultRole.roleName;
      }
    }

    const createUserData = await this.users.save({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      roleId: roleId,
      roleName: roleName,
      createdBy: userData.createdBy,
    });

    delete createUserData.password;

    return createUserData;
  }

  public async login(userData: LoginUserDto): Promise<{ cookie: string; findUser: User; token: string }> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const { email, phone, password } = userData;

    if (!email && !phone) throw new HttpException(400, 'Email or phone is required');
    if (!password) throw new HttpException(400, 'Password is required');

    // Find user by email or phone
    const findUser = await this.users.findOne({
      where: email ? { email } : { phone },
    });

    if (!findUser) throw new HttpException(409, `User not found`);

    if (!findUser.isActive) {
      throw new HttpException(403, 'User deactivated. Contact admin for more details.');
    }

    const isPasswordMatching = await this.verifyPassword(password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    if (findUser.roleId && !findUser.roleName) {
      const role = await this.roles.findOne({ where: { _id: findUser.roleId } });
      if (role) {
        findUser.roleName = role.roleName;
        await this.users.save(findUser);
      }
    }

    const tokenData = this.createToken(findUser);
    const cookie = this.createCookie(tokenData);

    delete findUser.password;

    return { cookie, findUser, token: tokenData.token };
  }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const findUser: User = await this.users.findOne({
      where: { email: userData.email },
    });

    if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    delete findUser.password;

    return findUser;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { _id: user._id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60*24; // 24 hours

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn};`;
  }

  public async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

    return `${salt}:${hash}`;
  }

  public async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [salt, originalHash] = storedHash.split(':');
    const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');

    return hash === originalHash;
  }
}

export default AuthService;
