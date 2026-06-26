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
  status?: 'pending' | 'paid' | 'failed' | 'rejected' | string;
  revenue?: number;
}

export type ResponseType = 'text' | 'card' | 'image' | 'follow' | 'lead_form';

/** What contact info the lead form block accepts from the user */
export type LeadCaptureType = 'phone' | 'email' | 'both' | 'either';

export interface ResponseBlock {
  id: string;
  type: ResponseType;
  // Text message fields
  text?: string;
  buttonText?: string;
  buttonType?: 'link' | 'trigger';
  buttonValue?: string; // URL link or greeting/info trigger keyword
  // Card message fields
  cardImage?: string;
  cardHeader?: string;
  cardDescription?: string;
  cardButtonText?: string;
  cardButtonType?: 'link' | 'trigger';
  cardButtonValue?: string;
  // Image message fields
  imageUrl?: string;
  // Ask For Follow fields
  followGateText?: string;
  followGateButtonText?: string;
  // Lead forms fields
  leadCaptureType?: LeadCaptureType;
  leadPrompt?: string;
  leadSuccessMessage?: string;
  leadInvalidMessage?: string;
}

export interface Automation {
  id: string;
  name: string;
  triggerType: 'comment' | 'dm';
  status: 'active' | 'inactive';
  createdAt: string;
  lastModified: string;
  // Trigger options
  mediaId?: string;
  mediaUrl?: string;
  caption?: string;
  keywords: string[];
  matchType?: 'exact' | 'contains';
  // Response options
  replyText: string;
  enableFollowGate: boolean;
  notFollowingMessage?: string;
  responses?: ResponseBlock[];
  commentReplies?: string[];
}

export interface InstagramProfile {
  name?: string;
  username?: string;
  profile_picture_url?: string;
  biography?: string;
  website?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  caption?: string;
  permalink?: string;
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

export type ScreenType = 
  | 'landing' 
  | 'privacy'
  | 'terms'
  | 'faq'
  | 'contact'
  | 'automations' 
  | 'automation_builder' 
  | 'faq_settings' 
  | 'contacts' 
  | 'settings';

