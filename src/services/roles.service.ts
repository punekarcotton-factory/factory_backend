import { RolesEntity } from '@/entities/roles.entity';
import { Roles } from '@/interfaces/roles.interface';
import AuthService from './auth.service';

class RolesService {
  public roles = RolesEntity;
  public authService = new AuthService();

  public async findAllRoles(): Promise<Roles[]> {
    const roles: Roles[] = await this.roles.find();
    return roles;
  }
}

export default RolesService;
