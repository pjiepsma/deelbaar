import type { Mail } from "@/payload-types";
import { PayloadRequest } from "payload";
import { buildHtmlEmailTemplate } from "@/globals/Mail/utilities/htmlEmailTemplate";
import { extractObject } from "@/lib/extractID";

type MailOptions = Omit<
  Mail,
  "id" | "createdAt" | "updatedAt" | "headerLogo" | "footerLogo" | "businessEmail"
>;

type GenerateMail = {
  subject: string;
  body: string;
};

type GenerateMailArgs = {
  type: keyof MailOptions;
  placeholders: Record<string, string>;
  req: PayloadRequest;
};

type SendMailArgs = GenerateMailArgs & {
  to: string[];
  bcc?: string[];
};

type MailRichText = {
  [k: string]: unknown;
}[];

export const generateMail = async ({
  type,
  placeholders,
  req,
}: GenerateMailArgs): Promise<GenerateMail> => {
  const {
    [type]: mail,
    headerLogo,
    footerLogo,
  } = await req.payload.findGlobal({
    slug: "mail",
    select: {
      headerLogo: true,
      footerLogo: true,
      [type]: true,
    },
  });

  const subject = replacePlaceholders(mail?.subject || "", placeholders);
  const content = buildHtmlBody(mail?.content || [], placeholders);

  const headerLogoObj = extractObject(headerLogo);
  const footerLogoObj = extractObject(footerLogo);

  return {
    subject,
    body: await buildHtmlEmailTemplate({
      title: subject,
      body: content,
      headerLogoUrl:
        headerLogoObj?.sizes?.mail?.url || headerLogoObj?.url || "",
      footerLogoUrl:
        footerLogoObj?.sizes?.mail?.url || footerLogoObj?.url || "",
    }),
  };
};

export const sendMail = async ({
  type,
  placeholders,
  req,
  to,
  bcc,
}: SendMailArgs): Promise<void> => {
  // Queue the email sending to avoid rate limiting issues
  await req.payload.jobs.queue({
    task: "sendEmail",
    queue: "email",
    input: {
      type,
      bcc: bcc?.map((email) => ({ email })) || [],
      to: to.map((email) => ({ email })),
      placeholders: Object.entries(placeholders).map(([key, value]) => ({
        key,
        value,
      })),
    },
  });
};

const lexicalToHtml = (lexicalState: any): string => {
  if (!lexicalState || !lexicalState.root) {
    return '';
  }

  const renderNode = (node: any): string => {
    if (!node) return '';

    // Text node
    if (node.type === 'text') {
      let text = node.text || '';
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>`; // Bold
        if (node.format & 2) text = `<em>${text}</em>`; // Italic
        if (node.format & 4) text = `<u>${text}</u>`; // Underline
      }
      return text;
    }

    // Paragraph
    if (node.type === 'paragraph') {
      const children = node.children?.map(renderNode).join('') || '';
      return `<p>${children}</p>`;
    }

    // Heading
    if (node.type === 'heading') {
      const level = node.tag || 'h1';
      const children = node.children?.map(renderNode).join('') || '';
      return `<${level}>${children}</${level}>`;
    }

    // Link
    if (node.type === 'link') {
      const url = node.url || '#';
      const children = node.children?.map(renderNode).join('') || '';
      return `<a href="${url}">${children}</a>`;
    }

    // List
    if (node.type === 'list') {
      const tag = node.listType === 'number' ? 'ol' : 'ul';
      const children = node.children?.map(renderNode).join('') || '';
      return `<${tag}>${children}</${tag}>`;
    }

    // List item
    if (node.type === 'listitem') {
      const children = node.children?.map(renderNode).join('') || '';
      return `<li>${children}</li>`;
    }

    // Line break
    if (node.type === 'linebreak') {
      return '<br>';
    }

    // Quote
    if (node.type === 'quote') {
      const children = node.children?.map(renderNode).join('') || '';
      return `<blockquote>${children}</blockquote>`;
    }

    // Default: try to render children
    if (node.children) {
      return node.children.map(renderNode).join('');
    }

    return '';
  };

  return renderNode(lexicalState.root);
};

const buildHtmlBody = (
  content: MailRichText,
  placeholders: Record<string, string>
): string => {
  const html = lexicalToHtml(content);
  return replacePlaceholders(html, placeholders);
};

const replacePlaceholders = (
  content: string,
  placeholders: Record<string, string>
): string => {
  return Object.entries(placeholders).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`{{${key}}}`, "g"), value);
  }, content);
};
