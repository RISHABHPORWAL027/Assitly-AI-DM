export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'Pricing' | 'Location' | 'Shipping' | 'General';
  tags?: string[];
}

export interface Contact {
  id: string;
  username: string;
  phone: string;
  email: string;
  dateAdded: string; // e.g. "Today", "Yesterday", "2 days ago", or "Oct 24, 2023"
  source: 'Instagram' | 'Automation';
  avatar?: string;
}

export interface AutomationSettings {
  triggerType: string;
  triggerKeywords: string[];
  messageText: string;
  isLive: boolean;
}

export interface BusinessProfile {
  name: string;
  email: string;
  address: string;
  hoursWeekdays: string;
  hoursWeekends: string;
  statusOn: boolean;
}

export interface Activity {
  id: string;
  username: string;
  timestamp: string;
  action: string;
  type: 'person' | 'call' | 'chat_bubble' | 'flag';
}

export type ScreenType = 'landing' | 'onboarding1' | 'dashboard' | 'automation_builder' | 'faq_settings' | 'contacts' | 'pricing';
