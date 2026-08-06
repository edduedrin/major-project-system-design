import handlebars from "handlebars";
import { EmailTemplateRepository } from "../repositories/email-template.repository";

export class TemplateService {
  private emailTemplateRepo: EmailTemplateRepository;

  constructor() {
    this.emailTemplateRepo = new EmailTemplateRepository();
  }

  public async renderEmailTemplate(
    templateName: string,
    variables: Record<string, any>,
    fallbackSubject?: string
  ): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.emailTemplateRepo.findByName(templateName);

    if (template) {
      const subjectCompiled = handlebars.compile(template.subject)(variables);
      const htmlCompiled = handlebars.compile(template.htmlBody)(variables);
      const textCompiled = template.textBody ? handlebars.compile(template.textBody)(variables) : undefined;

      return {
        subject: subjectCompiled,
        html: htmlCompiled,
        text: textCompiled,
      };
    }

    // Default built-in fallback template logic
    const defaultSubject = fallbackSubject || `Notification: ${templateName}`;
    const defaultHtml = `<h2>${defaultSubject}</h2><pre>${JSON.stringify(variables, null, 2)}</pre>`;
    const defaultText = `${defaultSubject}\n\n${JSON.stringify(variables, null, 2)}`;

    return {
      subject: defaultSubject,
      html: defaultHtml,
      text: defaultText,
    };
  }
}
