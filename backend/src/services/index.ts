import { RolesService } from '../modules/roles/roles.service';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../modules/auth/auth.service';
import { CatalogService } from '../modules/catalog/catalog.service';
import { DailyRoutesService } from '../modules/daily-routes/daily-routes.service';
import { ReportsService } from '../modules/reports/reports.service';

export const rolesService = new RolesService();
export const usersService = new UsersService(rolesService);
export const authService = new AuthService(usersService, rolesService);
export const catalogService = new CatalogService(usersService, rolesService);
export const dailyRoutesService = new DailyRoutesService(catalogService);
export const reportsService = new ReportsService();
