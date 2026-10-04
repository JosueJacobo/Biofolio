export type SpecimenCategory = 'plant' | 'animal' | 'fungi';

export interface CollectorProfile {
  uid: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  location: string;
  specialty: string;
  isPublic: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Specimen {
  id: string;
  ownerId: string;
  ownerHandle: string;
  ownerName: string;
  scientificName: string;
  commonName: string;
  category: SpecimenCategory;
  family: string;
  kingdom: string;
  photoDataUrl: string;
  locationName: string;
  coordinates: string;
  habitat: string;
  conservationStatus: string;
  notes: string;
  confidence: number;
  observedDate: string;
  isPublic: boolean;
  isOfflinePending?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FollowRelation {
  id: string;
  followerId: string;
  followingId: string;
  createdAt?: unknown;
}

export interface SpecimenLike {
  id: string;
  specimenId: string;
  userId: string;
  userHandle: string;
  isPublic: boolean;
  createdAt?: unknown;
}

export interface SpecimenComment {
  id: string;
  specimenId: string;
  authorId: string;
  authorHandle: string;
  authorName: string;
  text: string;
  isPublic: boolean;
  createdAt?: unknown;
}

export interface DirectMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderHandle: string;
  senderName: string;
  recipientId: string;
  text: string;
  timestamp: string;
  createdAt?: unknown;
}

export interface IdentificationResult {
  scientificName: string;
  commonName: string;
  category: SpecimenCategory;
  family: string;
  kingdom: string;
  confidence: number;
  conservationStatus: string;
  habitat: string;
  description: string;
  similarSpecies?: string[];
}
