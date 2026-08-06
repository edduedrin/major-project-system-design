import { database } from "../server";
import { emailTemplates } from "../database/schema/schema";
import { eq, and } from "drizzle-orm";

export class EmailTemplateRepository {
  public async findByName(templateName: string) {
    const [result] = await database
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.templateName, templateName), eq(emailTemplates.isActive, true)));
    return result || null;
  }

  public async upsertTemplate(data: typeof emailTemplates.$inferInsert) {
    const existing = await database
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.templateName, data.templateName));

    if (existing.length > 0) {
      const [updated] = await database
        .update(emailTemplates)
        .set({
          subject: data.subject,
          htmlBody: data.htmlBody,
          textBody: data.textBody,
          isActive: data.isActive !== undefined ? data.isActive : true,
          updatedAt: new Date(),
        })
        .where(eq(emailTemplates.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await database.insert(emailTemplates).values(data).returning();
      return created;
    }
  }
}
