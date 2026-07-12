import type { ComponentType } from 'react';

export interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  image: string;
  cta: {
    primary: { text: string; icon: ComponentType<{ className?: string }> };
    secondary: { text: string; icon: ComponentType<{ className?: string }> };
  };
}

export interface Review {
  id: number;
  name: string;
  text: string;
  rating: number;
  model: string;
  avatar: string;
  verified: boolean;
  date: string;
  helpful: number;
}

export interface PlatformStat {
  value: number;
  label: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  suffix: string;
}

export interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  gradient: string;
}

export interface TrustBadge {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

export interface PaymentMethod {
  name: string;
  icon: string;
}

export interface ShippingPartner {
  name: string;
  icon: string;
}

export interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}