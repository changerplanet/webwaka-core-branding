export interface BrandConfig {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

export function createBrandConfig(config: BrandConfig): BrandConfig {
  return {
    name: config.name,
    primaryColor: config.primaryColor ?? '#000000',
    secondaryColor: config.secondaryColor ?? '#ffffff',
    logoUrl: config.logoUrl,
  };
}

export function getVersion(): string {
  return '0.1.0';
}
