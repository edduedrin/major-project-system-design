import { timestamp, pgTable, serial, varchar, boolean } from "drizzle-orm/pg-core";

export const RoleModel = pgTable("tbl_roles", {
    roleId: serial("role_id").primaryKey(),
    roleName: varchar("role_name", { length: 255 }),
    roleDescription: varchar("role_description", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow(), // <-- default current timestamp
    isActive: boolean("is_active"),
});
