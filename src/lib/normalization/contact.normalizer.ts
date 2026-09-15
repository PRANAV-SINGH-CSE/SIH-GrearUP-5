import { ConsumerCareDetail } from '../types/extraction';

export class ContactNormalizer {
  /**
   * Extracts consumer helpline numbers, email addresses, and postal grievance details.
   */
  static extractConsumerCare(text: string): ConsumerCareDetail | null {
    if (!text || typeof text !== 'string') return null;

    let phone: string | undefined;
    let email: string | undefined;
    let name: string | undefined;
    let address: string | undefined;

    // 1. Phone / Toll Free extraction: 1800-xxx-xxxx or 10-11 digit numbers
    const phoneMatch = text.match(
      /(?:(?:Toll\s*Free|Tel|Phone|Helpline|Call)[:\s]*)?((?:1800[\-\s]?\d{3}[\-\s]?\d{3,4})|(?:\+?91[\-\s]?)?[0-9]{10,11}|(?:0\d{2,4}[\-\s]?\d{6,8}))/i
    );
    if (phoneMatch) {
      phone = phoneMatch[1].trim();
    }

    // 2. Email extraction
    const emailMatch = text.match(
      /(?:Email[:\s]*)?([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i
    );
    if (emailMatch) {
      email = emailMatch[1].trim();
    }

    // 3. Contact person / officer
    const personMatch = text.match(
      /(?:Contact|Officer|Manager)[:\s]*([a-zA-Z\s]{4,30})(?:at|,|\.|\n|$)/i
    );
    if (personMatch) {
      name = personMatch[1].trim();
    }

    // 4. Postal address
    const addressMatch = text.match(
      /(?:Address|Cell\s*at|at)[:\s]*([^\n]+?(?:\d{6}|India|Industrial\s*Area))/i
    );
    if (addressMatch) {
      address = addressMatch[1].trim();
    }

    if (!phone && !email) {
      return null;
    }

    return {
      phone,
      email,
      name,
      address,
    };
  }
}
