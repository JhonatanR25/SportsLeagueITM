export interface SponsorUpsertPayload {
  name: string;
  contactEmail: string;
  phone: string | null;
  websiteUrl: string | null;
  category: number;
}
