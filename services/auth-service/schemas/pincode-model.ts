import { pgTable, serial, integer, varchar, boolean } from "drizzle-orm/pg-core";

// Define the tbl_pincodes table schema
export const PincodeModel = pgTable("tbl_pincodes", {
  pincodeId: serial("pincode_id").primaryKey(),
  pincode: integer("pincode").notNull(),
  cityName: varchar("city_name", { length: 50 }).notNull(),
  districtName: varchar("district_name", { length: 50 }).notNull(),
  stateName: varchar("state_name", { length: 50 }).notNull(),
  zoneName: varchar("zone_name", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});
