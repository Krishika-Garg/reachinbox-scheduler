import { parse } from "csv-parse/sync";

type CsvRecord = Record<string, unknown>;

export function extractEmailsFromCsv(
  fileContent: string
): string[] {
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRecord[];

  const emails: string[] = [];

  for (const record of records) {
    const possibleEmail =
      record.email ||
      record.Email ||
      record.EMAIL;

    if (
      typeof possibleEmail === "string" &&
      possibleEmail.trim()
    ) {
      emails.push(possibleEmail.trim());
    }
  }

  return [...new Set(emails)];
}