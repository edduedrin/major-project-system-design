import { pgTable, serial, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export const CityModel = pgTable('tbl_cities', {
    cityId: serial('city_id').primaryKey(),  
    cityName: varchar('city_name', { length: 255 }).notNull(),
    districtId: integer('district_id').notNull(),
    stateId: integer('state_id').notNull(),
    isActive: boolean('is_active').notNull().default(true),  
});