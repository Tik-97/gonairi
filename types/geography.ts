export type GeographyRegionOption = {
  id: string;
  countryId: string;
  isoCode: string | null;
  name: string;
  type: string | null;
  isActive: boolean;
};

export type GeographyCountryOption = {
  id: string;
  iso2: string;
  name: string;
};
