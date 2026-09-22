import { createDataStore } from '../storage/storage.factory';
import { RolesService } from '../modules/roles/roles.service';
import { UsersService } from '../modules/users/users.service';
import { AuthService } from '../modules/auth/auth.service';
import { CatalogService } from '../modules/catalog/catalog.service';
import { DailyRoutesService } from '../modules/daily-routes/daily-routes.service';
import { ReportsService } from '../modules/reports/reports.service';

export const dataStore = createDataStore();

export const rolesService = new RolesService(dataStore);
export const usersService = new UsersService(dataStore, rolesService);
export const authService = new AuthService(usersService, rolesService);
export const catalogService = new CatalogService(dataStore, usersService, rolesService);
export const dailyRoutesService = new DailyRoutesService(dataStore, catalogService);
export const reportsService = new ReportsService(dataStore);
