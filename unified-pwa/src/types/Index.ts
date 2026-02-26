export interface Service {
  id: string;
  title: string;
  provider: string;
  providerImage: string;
  location: string;
  distance: string;
  rating: number;
  jobsCount: number;
  image: string;
  pricing: {
    label: string;
    amount: number;
  }[];
}


export type ViewType = 'overview' | 'dashboard' | 'calendar' | 'settings' | 'bookings' | 'services' | 'new-listing' | 'customers' | 'messages' | 'payouts' | 'payouts-report' | 'notification' | 'reviews' | 'profile' | 'availability' | 'edit-profile' | 'booking-details' | 'earnings';

export interface ProfileData {
  displayName: string;
  contactEmail: string;
  phoneNumber: string;
  profilePhoto: string;
  companyName: string;
  serviceCategories: string[];
  serviceArea: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  workingDays: string[];
  startTime: string;
  endTime: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export interface DashboardStat {
  label: string;
  value: string;
  change: string;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}


export interface Booking {
  avatar: string;
  customer: string;
  service: string;
  date: string;
  status: string;
}

export interface AppState {
  category: string;
  selectedServices: Service[];
  location: string;
  radius: number;
}


export interface PortfolioPhoto {
  preview: string;
  file: File;
}


export interface Provider {
  id: string;
  name: string;
  category: string;
  jobsCompleted: number;
  verified: boolean;
  avgReplyTime: string;
  experience: string;
  serviceRadius: string;
  location: string;
  avatar: string;
  services: Service[];
  about?: string;
  tags?: string[];
  reviews?: Review[];
  image: string;
  rating: number;
  jobsCount: number;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}


export interface City {
  name: string;
  state?: string;
  distance?: string;
  description?: string;
}

export interface ServiceWithProvider {
  id: string;
  title: string;
  provider: string;
  providerImage: string;
  location: string;
  distance: string;
  rating: number;
  jobsCount: number;
  image: string;
  pricing: {
    label: string;
    amount: number;
  }[];
}

export interface SimpleProvider {
  id: string;
  name: string;
  image: string;
  rating: number;
  jobsCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Offer {
  id: string;
  title: string;
  image: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'debit' | 'credit';
  date: string;
  method: string;
  status: 'paid' | 'refunded' | 'added';
}


export interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  identifier: string;
  status?: string;
}

export interface ProviderDetails {
  name: string;
  category: string;
  location: string;
  jobsCount: number;
  rating: number;
  avatar: string;
  description: string;
  images: string[];
  stats: {
    projectsCompleted: number;
    repeatClientsPercentage: number;
  };
  services: {
    id: string;
    name: string;
    price: number;
  }[];
  reviews: {
    id: string;
    user: string;
    avatar: string;
    rating: number;
    date: string;
    serviceUsed: string;
    comment: string;
  }[];
}




export interface PortfolioPhoto {
  preview: string;
  file: File;
}

export const getInitialData = (): OnboardingData => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  address: '',
  city: '',
  zip: '',
  radius: 0,
  state: 'string',
  country: '',
  providerType: 'freelancer',
  serviceCategory: undefined,
  yearsExperience: '',
  skills: [],
  bio: '',
  idProof: null,
  idProofName: '',
  idProofType: '',
  paymentMethod: 'cash',
  upiId: '',
  whatsapp: '',
  preferredMethod: 'call',
  hourlyRate: '',
  password: '',
  agreedToTerms: false,
  agreedToPrivacy: false,
  businessName: '',
  businessAddress: '',
  profilePhoto: new File([], ''),
  profilePhotoName: '',
  profilePhotoType: '',
  panNumber: '',
  aadhaarNumber: '',
  portfolioPhotos: []
});

export interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  zip: string;
  state: string;
  country: string;
  radius: number;
  providerType: 'freelancer' | 'shop';
  serviceCategory: 'Plumbing' | 'Cleaning' | 'Electrical' | undefined;
  yearsExperience: string;
  skills: string[];
  bio: string;
  idProof: File | null;
  idProofName: string;
  idProofType: string;
  paymentMethod: 'cash' | 'upi';
  upiId: string;
  whatsapp: string;
  preferredMethod: 'call' | 'whatsapp' | 'email';
  hourlyRate: string;
  password: string;
  agreedToTerms: boolean;
  agreedToPrivacy: boolean;
  businessName: string;
  businessAddress: string;
  profilePhoto: File | null;
  profilePhotoName: string;
  profilePhotoType: string;
  panNumber: string;
  aadhaarNumber: string;
  portfolioPhotos: PortfolioPhoto[];
}


export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
}

export interface ServiceIssue {
  id: string;
  name: string;
  categoryId: string;
}

export interface SimpleProvider {
  id: string;
  name: string;
  image: string;
  rating: number;
  jobsCount: number;
}

export enum DashboardState {
  REQUEST_PANEL = 'REQUEST_PANEL',
  SEARCHING = 'SEARCHING',
  RESULTS = 'RESULTS',
  BOOKED = 'BOOKED'
}



export default OnboardingData;

