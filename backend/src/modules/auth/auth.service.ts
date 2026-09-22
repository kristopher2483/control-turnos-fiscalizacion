import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { PublicUser } from '../../types';
import { comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import { unauthorized } from '../../utils/http-error';
import { LoginInput } from './auth.schemas';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class AuthService {
  constructor(private readonly usersService: UsersService, private readonly rolesService: RolesService) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.usersService.findUserByUsername(input.username);
    if (!user || !user.active) {
      throw unauthorized('Usuario o contraseña incorrectos');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw unauthorized('Usuario o contraseña incorrectos');
    }

    const role = await this.rolesService.findRoleById(user.roleId);
    if (!role) {
      throw unauthorized('El usuario no tiene un rol válido asignado');
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      roleId: user.roleId,
      roleName: role.name
    });

    const publicUser = await this.usersService.toPublicUser(user);
    return { token, user: publicUser };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findUserById(userId);
    if (!user) {
      throw unauthorized('Usuario no encontrado');
    }
    return this.usersService.toPublicUser(user);
  }
}
