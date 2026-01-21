export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  isActive?: boolean;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProfileSettings {
  pushNotifications: boolean;
  darkMode: boolean;
  faceId: boolean;
}

