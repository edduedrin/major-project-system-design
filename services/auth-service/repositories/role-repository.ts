// repositories/role-repository.ts
import { RoleModel } from "../schemas/index";
import { database } from "../server";
import { eq } from "drizzle-orm";
import { CustomError } from "../types";

export class RoleRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    /**
     * Fetch a role by its ID
     * @param roleId - ID of the role to fetch
     * @returns role object or null if not found
     */
    async getRoleById(roleId: number) {
        const result = await database
            .select()
            .from(RoleModel)
            .where(eq(RoleModel.roleId, roleId))
            .limit(1);

        return result[0] || null;
    }

    /**
     * Optional: fetch all active roles
     */
    async getAllActiveRoles() {
        const result = await database
            .select()
            .from(RoleModel)
            .where(eq(RoleModel.isActive, true));
        return result;
    }

    async getRoleByName(roleName: string) {
        const result = await database
            .select()
            .from(RoleModel)
            .where(eq(RoleModel.roleName, roleName))
            .limit(1);

        return result[0] || null;
    }
}

export const roleRepository = new RoleRepository();
