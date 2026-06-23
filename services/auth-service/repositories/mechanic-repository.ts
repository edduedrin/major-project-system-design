// repositories/mechanic-repository.ts
import { userRepository } from ".";
import { MechanicModel, UserModel } from "../schemas";
import { tiersEnum } from "../schemas/mechanic-model";
import { database } from "../server";
import { CustomError, registerUserPayload } from "../types";
import { eq } from "drizzle-orm";

export type CreateMechanicPayload = {
    userId: number;           // mandatory
    workshopName?: string;
    age?: string;
    gender?: string;
    currentAddress?: string;
    currentCity?: string;
    currentDistrict?: string;
    currentPincode?: number;
    currentState?: string;
    profileUrl?: string;
    tier?: number;
    language?: string;
    referralCode?: number;
    panNumber?: string;
    panUrl?: Date;
    aadhaarNumber?: string;
    aadhaarProfileUrl?: string;
    aadhaarFrontUrl?: number;
    aadhaarBackUrl?: Date;
};

export class MechanicRepository {
    customError: CustomError;

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    /**
     * Create a new mechanic
     */
    async createMechanic(payload: CreateMechanicPayload) {
        const result = await database
            .insert(MechanicModel)
            .values({
                userId: payload.userId,
                workshopName: payload.workshopName || null,
                age: Number(payload.age) ? Number(payload.age) : null,
                // gender: payload.gender || null,
                // currentAddress: payload.currentAddress || null,
                // currentCity: payload.currentCity || null,
                // currentDistrict: payload.currentDistrict || null,
                // currentPincode: payload.currentPincode || null,
                // currentState: payload.currentState || null,
                profileUrl: payload.profileUrl || null,
                language: "English"
            })
            .returning(); // returns all columns

        return result[0];
    }

    /**
     * Get mechanic by userId
     */
    async getMechanicByUserId(userId: number) {
        const result = await database
            .select()
            .from(MechanicModel)
            .where(eq(MechanicModel.userId, userId))
            .limit(1);

        return result[0] || null;
    }

    /**
     * Update mechanic details
     */
    // async updateMechanic(userId: number, payload: Partial<CreateMechanicPayload>) {
    //     const result = await database
    //         .update(MechanicModel)
    //         .set(payload)
    //         .where(eq(MechanicModel.userId, userId))
    //         .returning(); // returns updated row

    //     return result[0];
    // }

    /**
     * Delete mechanic by userId
     */
    async deleteMechanic(userId: number) {
        await database
            .delete(MechanicModel)
            .where(eq(MechanicModel.userId, userId));
        return true;
    }

    async createMechanicWithTransaction(payload: registerUserPayload) {
        return await database.transaction(async (tx) => {
            const newUser = await tx.insert(UserModel)
                .values(payload)
                .returning();

            await tx.insert(MechanicModel)
                .values({
                    userId: newUser[0].userId,
                });

            return newUser[0]; // maybe return combined info if needed
        });
    }
}

export const mechanicRepository = new MechanicRepository();
