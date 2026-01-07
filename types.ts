
// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PARTNER = 'PARTNER'
}

// User Model (Simulating MySQL 'users' table)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partnerIds?: string[]; // CHANGED: Now supports multiple partners
  avatar?: string;
}

// Partner Data Model
export interface Partner {
  id: string;
  name: string;
  logo: string; // URL
  address: string;
  // Suggested additional fields
  contactEmail: string;
  phone: string;
  website?: string;
  eventLimit: number; // Assigned by SuperAdmin
  eventsCreated: number;
  status: 'active' | 'suspended';
  createdAt: string;
}

// Asset Model (Resource Bank)
export interface PartnerAsset {
  id: string;
  partnerId: string;
  type: 'image' | 'video' | 'audio';
  name: string;
  url: string; // URL or Base64
  createdAt: string;
}

// --- VENUE / LAYOUT MODELS ---
// ADDED: led-screen, lounge-area
export type LayoutObjectType = 'table-round' | 'table-rect' | 'chair' | 'sofa' | 'dance-floor' | 'altar' | 'stage' | 'plant' | 'wall' | 'decor' | 'photo-booth' | 'photo-set' | 'led-screen' | 'lounge-area';

export interface LayoutObject {
  id: string;
  type: LayoutObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  label?: string; // e.g. "Mesa 1", "Novios"
  capacity?: number; // Number of seats (for tables)
  seatsPerSide?: { top: number; bottom: number; left: number; right: number }; // NEW: Custom chair distribution
  loungeConfig?: { 
      chairs: number; 
      tables: number; 
      tableType: 'round' | 'rect';
      seatsPerSide?: { top: number; bottom: number; left: number; right: number }; // NEW: Custom chair distribution per table in lounge
  }; 
  gridConfig?: { rows: number; cols: number; itemSize?: number }; // UPDATED: Added itemSize
  color?: string; // For differentiating zones
}

export interface VenueLayout {
  objects: LayoutObject[];
  width: number; // Room width in px (simulated)
  height: number; // Room height in px
}

// Event Data Model
export interface EventLocation {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  layout?: VenueLayout; // NEW: Stores the furniture arrangement
}

export interface SocialMediaLink {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'website';
  url: string;
}

export interface Event {
  id: string;
  partnerId: string;
  name: string;
  type: string; // e.g., Wedding, Corporate, Birthday
  date: string;
  locations: EventLocation[];
  socialMedia: SocialMediaLink[];
  invitationId?: string; // Optional: Link to primary invitation
}

// --- GUEST MANAGEMENT MODELS ---

export type GuestRole = 'Primary' | 'Spouse' | 'Child' | 'Companion' | 'Other';
export type RSVPStatus = 'pending' | 'confirmed' | 'declined';

// The Individual Person
export interface Guest {
  id: string;
  name: string;
  role: GuestRole;
  isConfirmed: boolean;
  dietaryRestrictions?: string;
  // NEW: Seating Assignment
  assignedSeat?: {
    locationId: string; // Which room/location
    tableId: string;    // The LayoutObject ID (Table/Chair/Lounge)
    seatIndex: number;  // Specific seat number (0-based)
  };
  // NEW: Check-In Timestamp for Protocol
  checkedInAt?: string; 
}

// The "Envelope" / Group Entity
export interface GuestGroup {
  id: string;
  eventId: string;
  formalAddressee: string; // e.g. "Sr. Aristides Castro y Familia"
  assignedInvitationId?: string; // NEW: Specific invitation linked to this guest group
  contactEmail?: string;
  contactPhone?: string;
  maxGuests: number; // Allocated seats
  status: 'sent' | 'delivered' | 'confirmed' | 'partially_confirmed' | 'declined' | 'pending';
  guests: Guest[]; // List of actual people in this group
}

// Invitation Builder Types (Dynamic)
export type ElementType = 'image' | 'video' | 'audio' | 'text' | 'button' | 'gallery';

// Properties that can change between Idle and Info states
export interface ElementStateProps {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    styles?: Record<string, string | number>;
    // NEW: Animations specifically for this state entry/exit
    animationEntry?: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'pop-in' | 'blur-in' | 'elastic-right';
    animationExit?: 'none' | 'fade-out' | 'slide-down-out' | 'slide-up-out' | 'pop-out' | 'blur-out';
    
    // Gallery Specific Props (These can be overridden in states too if needed)
    galleryImages?: string[]; 
    galleryDuration?: number; // Seconds per slide
    galleryFit?: 'cover' | 'contain' | 'fill';
    galleryTransitionType?: 'none' | 'fade' | 'slide-left' | 'slide-up' | 'zoom' | 'blur' | 'flip';
    galleryAlignment?: {
        vertical: 'top' | 'center' | 'bottom';
        horizontal: 'left' | 'center' | 'right';
    };
    // NEW: Advanced Gallery Control
    galleryGuestImageIndex?: number; // Specific index to show when in Guest Info mode (static)
    galleryGuestImageHiddenInIdle?: boolean; // If true, the image at GuestImageIndex is skipped during Idle slideshow
}

export interface CanvasElement extends ElementStateProps {
  id: string;
  type: ElementType;
  name: string; // Name of the layer (defaulting to filename or type)
  content: string; // URL for media, text content for text
  zIndex: number;
  
  // Timeline Properties
  startTime?: number; // When the element appears (seconds)
  duration?: number; // How long it stays visible (seconds). If undefined, defaults to scene duration - start time.

  // Advanced Animation Properties (Jitter-style) - MAINLY FOR DYNAMIC INVITE
  animationEntry?: 'none' | 'fade-in' | 'slide-up' | 'slide-down' | 'pop-in' | 'blur-in' | 'elastic-right';
  animationEmphasis?: 'none' | 'pulse' | 'float' | 'shake' | 'heartbeat';
  animationExit?: 'none' | 'fade-out' | 'slide-down-out' | 'slide-up-out' | 'pop-out' | 'blur-out';

  // New Property for Aspect Ratio
  lockAspectRatio?: boolean;
  
  // Video specific
  loop?: boolean;
  
  // NEW: For Welcome Screens State Management
  isPlaceholder?: boolean; 
  // If present, these properties override the root properties when the screen is in "Info/Welcome" state
  infoState?: Partial<ElementStateProps>;
}

export interface Scene {
  id: string;
  order: number;
  duration: number; // in seconds
  elements: CanvasElement[];
  background: string; // Color or Image URL
}

export interface Invitation {
  id: string;
  eventId: string;
  partnerId: string;
  type: 'dynamic' | 'web';
  name: string; // Internal name (e.g. "Wedding Save the Date")
  
  // Content Store (JSON)
  content: {
    scenes: Scene[]; // For Dynamic
    canvasSettings?: { width: number; height: number };
    // We can add specific WebBuilder properties here later (e.g., sections, scroll effects)
  };
  
  thumbnail?: string; // Preview image
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

// --- WELCOME SCREEN MODELS ---

export interface WelcomeScreenDesign {
    id: string;
    eventId: string;
    partnerId: string;
    name: string;
    
    // Technical Configuration
    orientation: 'landscape' | 'portrait';
    resolution: { width: number, height: number }; // Specific resolution (e.g., 1920x1080)
    
    // Shared Configuration
    guestDisplayDuration?: number; // NEW: How long (seconds) the guest info stays on screen
    
    // Content
    elements: CanvasElement[]; 
    
    // Shared Configuration
    idleGallery: PartnerAsset[]; // Array of images/videos to loop when idle
    background: string; // Shared background color
    
    updatedAt: string;
}

export interface DisplayDevice {
    id: string;
    eventId: string;
    name: string; // e.g., "Main Hall TV", "Entrance Tablet"
    type: 'tv' | 'tablet' | 'mobile';
    orientation: 'landscape' | 'portrait';
    status: 'online' | 'offline';
    lastHeartbeat?: string;
}

// Auth Context Type
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
