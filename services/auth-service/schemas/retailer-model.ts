import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const RetailerModel = pgTable("tbl_retailers", {
  retailerId: serial("retailer_id").primaryKey(),
  // userId: integer("user_id").notNull(), // since, there is no login for retailer. need to enable once retailer can login and eligible for loyalty platform
  storeName: varchar("store_name", { length: 255 }).notNull(),
  retailerName: varchar("retailer_name", { length: 255 }).notNull(),
  mobileNumber: varchar("mobile_number", { length: 10 }).unique().notNull(),
  currentAddress: varchar("current_address", { length: 255 }),
  currentPincode: integer("current_pincode").notNull(),
  gstNumber: varchar("gst_number", { length: 15 }),
  stateName: varchar("state_name", { length: 255 }),
  districtName: varchar("district_name", { length: 255 }),
  cityName: varchar("city_name", { length: 255 }),
  timings: varchar("timings", { length: 255 }).default("9 am to 9pm").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
