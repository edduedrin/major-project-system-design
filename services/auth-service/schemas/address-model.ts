import {
  integer,
  varchar,
  pgTable,
  serial,
} from "drizzle-orm/pg-core";

export const AddressModel = pgTable("tbl_address", {
  addressId: serial("address_id").primaryKey(),
  userId: integer("user_id"),
  currentAddress: varchar("current_address", { length: 255 }),
  workshopAddress: varchar("workshopAddress"),
  currentCity: varchar("current_city").notNull(),
  currentDistrict: varchar("current_district").notNull(),
  currentPincode: integer("current_pincode").notNull(),
  currentState: varchar("current_state").notNull(),
  zoneName: varchar("zone_name", { length: 50 }),
  branchId: integer("branch_id"),
});