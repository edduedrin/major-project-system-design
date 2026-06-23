import { eq } from "drizzle-orm";
import { database } from "../server";
import { RoleModel, UserModel } from "../schemas";

export const checkIfUserIsAdmin = async (userId: number): Promise<boolean> => {
    try {
        const adminRoles = [
            "regional_manager",
            "call_centre_executive",
            "marketing_manager",
            "operator",
            "viewer",
            "qr_admin",
            "evolve_admin",
            "client_admin"
        ];

        const [userWithRole] = await database
            .select({
                roleName: RoleModel.roleName
            })
            .from(UserModel)
            .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId))
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!userWithRole?.roleName) {
            return false;
        }

        // Using optional chaining and lowercasing to be safe, though strict match is fine if data is consistent
        // The user prompt implied specific string values. I'll stick to exact match or what's reasonable.
        // Assuming strict match as per user request.
        return adminRoles.includes(userWithRole.roleName);

    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
};
