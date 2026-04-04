import { SponsorCategory } from './sponsor-category.type';

const categoryCodeMap: Record<number, SponsorCategory> = {
  0: 'Main',
  1: 'Gold',
  2: 'Silver',
  3: 'Bronze',
};

const categoryValueMap: Record<SponsorCategory, number> = {
  Main: 0,
  Gold: 1,
  Silver: 2,
  Bronze: 3,
};

export function toSponsorCategory(value: number | string): SponsorCategory {
  if (typeof value === 'string') {
    if (value in categoryValueMap) {
      return value as SponsorCategory;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed in categoryCodeMap) {
      return categoryCodeMap[parsed];
    }
  }

  if (typeof value === 'number' && value in categoryCodeMap) {
    return categoryCodeMap[value];
  }

  return 'Bronze';
}

export function toSponsorCategoryCode(category: SponsorCategory): number {
  return categoryValueMap[category];
}
