import { SponsorCategory } from './sponsor-category.type';

export interface Sponsor {
  id: number;
  name: string;
  contactEmail: string;
  phone: string | null;
  websiteUrl: string | null;
  category: SponsorCategory;
  createdAt: string;
  updatedAt: string | null;
}
