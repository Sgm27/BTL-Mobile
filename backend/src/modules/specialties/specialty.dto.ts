import { Specialty } from '@prisma/client';

export interface SpecialtyListItemDto {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  symptoms: string[];
}

export function mapSpecialtyToDto(specialty: Specialty): SpecialtyListItemDto {
  return {
    id: specialty.id,
    name: specialty.name,
    description: specialty.description,
    iconUrl: specialty.iconUrl,
    symptoms: specialty.symptoms,
  };
}
