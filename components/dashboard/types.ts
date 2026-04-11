import { IconProps } from "@tabler/icons-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  category?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
  identifier?: string; // NIM or NIP
}

export interface DashboardConfig {
  role: 'admin' | 'mahasiswa' | 'dosen';
  brandName: string;
  brandIcon: React.ComponentType<IconProps>;
  navItems: NavItem[];
  categories?: string[];
}
