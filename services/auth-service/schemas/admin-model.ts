import { boolean, integer, numeric, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { genderEnum } from "./user-model";
 
export const departmentEnum = pgEnum("department", [
    "IT",
    "Sales",
    "Operations",
    "Marketing",
    "Finance"
]);
 
export const AdminModel = pgTable("tbl_admins", {
    adminId: serial("admin_id").primaryKey(),
    userId: integer("user_id").unique().notNull(),
    department: departmentEnum("department").notNull()
});