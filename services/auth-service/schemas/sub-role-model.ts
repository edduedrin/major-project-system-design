import {
  integer,
  varchar,
  timestamp,
  pgTable,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

export const SubRoleModel = pgTable("tbl_sub_roles", {
  subRoleId: serial("sub_role_id").primaryKey(),
  subRoleName: varchar("sub_role_name", { length: 50 }),
  subRoleDescription: varchar("sub_role_description", { length: 100 }),
  roleId: integer("role_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
});
