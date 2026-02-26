import { ServiceCategory, ServiceIssue, Provider } from './types/Index';


export const CATEGORIES: ServiceCategory[] = [
  { id: 'mobile', name: 'Mobile', icon: 'smartphone' },
  { id: 'bike', name: 'Bike', icon: 'bike' },
  { id: 'car', name: 'Car', icon: 'car' },
  { id: 'ac', name: 'AC / WM', icon: 'wind' },
];

export const ISSUES: ServiceIssue[] = [
  { id: 'display', name: 'Display Issue', categoryId: 'mobile' },
  { id: 'battery', name: 'Battery Problem', categoryId: 'mobile' },
  { id: 'charging', name: 'Charging Port issue', categoryId: 'mobile' },
  { id: 'touch', name: 'Screen touch not working', categoryId: 'mobile' },
  { id: 'cooling', name: 'Not Cooling', categoryId: 'ac' },
  { id: 'noise', name: 'Excessive Noise', categoryId: 'ac' },
];

export const POPULAR_PROVIDERS: Provider[] = [
  {
    id: '1',
    name: 'Akash Kumar',
    image: 'https://i.pravatar.cc/150?u=akash',
    rating: 4.9,
    totalRatings: 520,
    distance: 1.2,        // changed back to number
    price: 350,            // changed back to number
    estimatedTime: '2 hours',
    visitCharge: 99,       // changed back to number
    availability: true,
    specialties: ['iPhone Specialist'],
    category: 'mobile',
    jobsCompleted: 150,
    verified: true,
    avgReplyTime: '15 mins',
    experience: '5 years',
    serviceRadius: 10,     // changed back to number
    location: 'Tirunelveli',
    avatar: 'https://i.pravatar.cc/150?u=akash',
  },
  {
    id: '2',
    name: 'Neha Sharma',
    image: 'https://i.pravatar.cc/150?u=neha',
    rating: 4.8,
    totalRatings: 430,
    distance: 2.5,        // changed back to number
    price: 299,            // changed back to number
    estimatedTime: '4 hours',
    visitCharge: 49,       // changed back to number
    availability: true,
    specialties: ['Home Services'],
    category: 'ac',
    jobsCompleted: 120,
    verified: true,
    avgReplyTime: '20 mins',
    experience: '3 years',
    serviceRadius: 15,     // changed back to number
    location: 'Tirunelveli',
    avatar: 'https://i.pravatar.cc/150?u=neha',
  },
  {
    id: '3',
    name: 'Rahul Verma',
    image: 'https://i.pravatar.cc/150?u=rahul',
    rating: 5.0,
    totalRatings: 610,
    distance: 0.8,        // changed back to number
    price: 450,            // changed back to number
    estimatedTime: '45 mins',
    visitCharge: 150,      // changed back to number
    availability: true,
    specialties: ['Car Expert'],
    category: 'car',
    jobsCompleted: 200,
    verified: true,
    avgReplyTime: '10 mins',
    experience: '7 years',
    serviceRadius: 20,     // changed back to number
    location: 'Tirunelveli',
    avatar: 'https://i.pravatar.cc/150?u=rahul',
  },
  {
    id: '4',
    name: 'Priya Iyer',
    image: 'https://i.pravatar.cc/150?u=priya',
    rating: 4.7,
    totalRatings: 390,
    distance: 3.1,        // changed back to number
    price: 199,            // changed back to number
    estimatedTime: '1 hour',
    visitCharge: 0,        // changed back to number
    availability: true,
    specialties: ['AC Repair'],
    category: 'ac',
    jobsCompleted: 100,
    verified: true,
    avgReplyTime: '30 mins',
    experience: '4 years',
    serviceRadius: 12,     // changed back to number
    location: 'Tirunelveli',
    avatar: 'https://i.pravatar.cc/150?u=priya',
  }
];


export const MOCK_PROVIDERS = POPULAR_PROVIDERS;
