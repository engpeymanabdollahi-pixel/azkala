import type { ComponentType } from 'react';

export interface TrustBadge {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  color: string;
}

export interface QuickLink {
  id: string;
  label: string;
}

export interface ServiceLink {
  label: string;
  path: string;
}

export interface ContactInfo {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

export interface TrustCertificate {
  icon: ComponentType<{ className?: string }>;
  label: string;
  title: string;
  color: string;
}

export interface SocialLink {
  name: string;
  ariaLabel: string;
  color: string;
  icon: string; // SVG path
}