import { pgTable, serial, integer, boolean, varchar } from "drizzle-orm/pg-core";

export const DistrictModel = pgTable("tbl_districts", {
  districtId: serial("district_id").primaryKey(),
  districtName: varchar("district_name", { length: 30 }).notNull(),
  stateId: integer("state_id").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});
