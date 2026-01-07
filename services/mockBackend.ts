
import { Partner, Event, UserRole, Invitation, User, PartnerAsset, GuestGroup, WelcomeScreenDesign, Guest } from '../types';

const DELAY_MS = 300;

const delay = (ms: number = DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms));

const KEYS = {
  SESSION: 'devents_session',
  USERS: 'devents_users',
  PARTNERS: 'devents_partners',
  EVENTS: 'devents_events',
  ASSETS: 'devents_assets',
  INVITATIONS: 'devents_invitations',
  GUEST_GROUPS: 'devents_guest_groups',
  SCREENS: 'devents_screens'
};

// --- INITIAL MOCK DATA ---

const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Super Admin', email: 'admin@devents.com', role: UserRole.SUPER_ADMIN, avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=random' },
    { id: 'u2', name: 'Partner User', email: 'partner@devents.com', role: UserRole.PARTNER, partnerIds: ['p1'], avatar: 'https://ui-avatars.com/api/?name=Partner+User&background=random' }
];

const MOCK_PARTNERS: Partner[] = [
    { id: 'p1', name: 'Elite Weddings', logo: 'https://ui-avatars.com/api/?name=Elite+Weddings&background=random', address: '123 Luxury Lane', contactEmail: 'contact@elite.com', phone: '555-0101', eventLimit: 10, eventsCreated: 2, status: 'active', createdAt: new Date().toISOString() }
];

const MOCK_EVENTS: Event[] = [
    { 
        id: 'e1', 
        partnerId: 'p1', 
        name: 'Smith Wedding', 
        type: 'Wedding', 
        date: '2024-12-15', 
        socialMedia: [],
        locations: [
            { id: 'l1', name: 'Main Hall', address: '123 Luxury Lane', layout: { width: 2000, height: 1500, objects: [] } }
        ] 
    }
];

// Helper to initialize storage if empty
const initStorage = () => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(KEYS.USERS)) localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    if (!localStorage.getItem(KEYS.PARTNERS)) localStorage.setItem(KEYS.PARTNERS, JSON.stringify(MOCK_PARTNERS));
    if (!localStorage.getItem(KEYS.EVENTS)) localStorage.setItem(KEYS.EVENTS, JSON.stringify(MOCK_EVENTS));
};

initStorage();

// --- AUTH SERVICES ---

export const loginUser = async (email: string, pass: string): Promise<User | null> => {
    await delay();
    const storedUsers = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
    // For demo: password check is simplified (accept 'password')
    if (pass !== 'password') return null;
    
    const user = storedUsers.find((u: User) => u.email === email);
    if (user) {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
        return user;
    }
    return null;
};

export const logoutUser = () => {
    localStorage.removeItem(KEYS.SESSION);
};

export const getCurrentSession = (): User | null => {
    const session = localStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
};

// --- PARTNER SERVICES ---

export const getPartners = async (): Promise<Partner[]> => {
    await delay();
    return JSON.parse(localStorage.getItem(KEYS.PARTNERS) || '[]');
};

export const createPartner = async (data: Partial<Partner>): Promise<Partner> => {
    await delay();
    const partners = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || '[]');
    const newPartner: Partner = {
        id: `p${Date.now()}`,
        name: 'New Partner',
        logo: '',
        address: '',
        contactEmail: '',
        phone: '',
        eventLimit: 5,
        eventsCreated: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...data
    } as Partner;
    
    partners.push(newPartner);
    localStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners));
    return newPartner;
};

// --- EVENT SERVICES ---

export const getEvents = async (partnerIds?: string[]): Promise<Event[]> => {
    await delay();
    const allEvents = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    if (!partnerIds) return allEvents; // Super Admin sees all
    return allEvents.filter((e: Event) => partnerIds.includes(e.partnerId));
};

export const getEvent = async (id: string): Promise<Event | undefined> => {
    await delay();
    const allEvents = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    return allEvents.find((e: Event) => e.id === id);
};

export const createEvent = async (data: Partial<Event>): Promise<Event> => {
    await delay();
    const allEvents = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    const newEvent: Event = {
        id: `e${Date.now()}`,
        partnerId: data.partnerId || 'p1',
        name: 'New Event',
        type: 'Other',
        date: new Date().toISOString().split('T')[0],
        locations: [],
        socialMedia: [],
        ...data
    } as Event;
    
    allEvents.push(newEvent);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(allEvents));
    
    // Update partner event count
    const partners = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || '[]');
    const pIndex = partners.findIndex((p: Partner) => p.id === newEvent.partnerId);
    if (pIndex > -1) {
        partners[pIndex].eventsCreated += 1;
        localStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners));
    }

    return newEvent;
};

export const updateEvent = async (id: string, updates: Partial<Event>): Promise<Event> => {
    await delay();
    const allEvents = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    const index = allEvents.findIndex((e: Event) => e.id === id);
    if (index === -1) throw new Error("Event not found");
    
    const updated = { ...allEvents[index], ...updates };
    allEvents[index] = updated;
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(allEvents));
    return updated;
};

export const deleteEvent = async (id: string): Promise<void> => {
    await delay();
    let allEvents = JSON.parse(localStorage.getItem(KEYS.EVENTS) || '[]');
    const event = allEvents.find((e: Event) => e.id === id);
    allEvents = allEvents.filter((e: Event) => e.id !== id);
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(allEvents));
    
     // Update partner event count
     if (event) {
        const partners = JSON.parse(localStorage.getItem(KEYS.PARTNERS) || '[]');
        const pIndex = partners.findIndex((p: Partner) => p.id === event.partnerId);
        if (pIndex > -1) {
            partners[pIndex].eventsCreated = Math.max(0, partners[pIndex].eventsCreated - 1);
            localStorage.setItem(KEYS.PARTNERS, JSON.stringify(partners));
        }
    }
};

// --- ASSET SERVICES ---

export const getAssets = async (partnerId: string, type?: 'image' | 'video' | 'audio'): Promise<PartnerAsset[]> => {
    await delay();
    const allAssets = JSON.parse(localStorage.getItem(KEYS.ASSETS) || '[]');
    let filtered = allAssets.filter((a: PartnerAsset) => a.partnerId === partnerId);
    if (type) {
        filtered = filtered.filter((a: PartnerAsset) => a.type === type);
    }
    return filtered;
};

export const createAsset = async (data: Partial<PartnerAsset>): Promise<PartnerAsset> => {
    await delay();
    const allAssets = JSON.parse(localStorage.getItem(KEYS.ASSETS) || '[]');
    const newAsset: PartnerAsset = {
        id: `a${Date.now()}`,
        partnerId: 'p1',
        type: 'image',
        name: 'Asset',
        url: '',
        createdAt: new Date().toISOString(),
        ...data
    } as PartnerAsset;
    
    allAssets.push(newAsset);
    localStorage.setItem(KEYS.ASSETS, JSON.stringify(allAssets));
    return newAsset;
};

// --- INVITATION SERVICES ---

export const getInvitations = async (partnerId?: string, eventId?: string): Promise<Invitation[]> => {
    await delay();
    const allInvs = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
    let filtered = allInvs;
    if (partnerId) filtered = filtered.filter((i: Invitation) => i.partnerId === partnerId);
    if (eventId) filtered = filtered.filter((i: Invitation) => i.eventId === eventId);
    return filtered;
};

export const getInvitation = async (id: string): Promise<Invitation | undefined> => {
    await delay();
    const allInvs = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
    return allInvs.find((i: Invitation) => i.id === id);
};

export const createInvitation = async (data: Partial<Invitation>): Promise<Invitation> => {
    await delay();
    const allInvs = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
    const newInv: Invitation = {
        id: `inv${Date.now()}`,
        eventId: 'e1',
        partnerId: 'p1',
        type: 'dynamic',
        name: 'Invitation',
        content: { scenes: [] },
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...data
    } as Invitation;
    
    allInvs.push(newInv);
    localStorage.setItem(KEYS.INVITATIONS, JSON.stringify(allInvs));
    return newInv;
};

export const updateInvitation = async (id: string, updates: Partial<Invitation>): Promise<Invitation> => {
    await delay();
    const allInvs = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
    const index = allInvs.findIndex((i: Invitation) => i.id === id);
    if (index === -1) throw new Error("Invitation not found");
    
    const updated = { ...allInvs[index], ...updates, updatedAt: new Date().toISOString() };
    allInvs[index] = updated;
    localStorage.setItem(KEYS.INVITATIONS, JSON.stringify(allInvs));
    return updated;
};

export const deleteInvitation = async (id: string): Promise<void> => {
    await delay();
    let allInvs = JSON.parse(localStorage.getItem(KEYS.INVITATIONS) || '[]');
    allInvs = allInvs.filter((i: Invitation) => i.id !== id);
    localStorage.setItem(KEYS.INVITATIONS, JSON.stringify(allInvs));
};

// --- GUEST SERVICES ---

export const getGuestGroups = async (eventId: string): Promise<GuestGroup[]> => {
    await delay();
    const allGroups = JSON.parse(localStorage.getItem(KEYS.GUEST_GROUPS) || '[]');
    return allGroups.filter((g: GuestGroup) => g.eventId === eventId);
};

export const createGuestGroup = async (data: Partial<GuestGroup>): Promise<GuestGroup> => {
    await delay();
    const allGroups = JSON.parse(localStorage.getItem(KEYS.GUEST_GROUPS) || '[]');
    const newGroup: GuestGroup = {
        id: `gg${Date.now()}`,
        eventId: 'e1',
        formalAddressee: 'Guest Family',
        maxGuests: 1,
        status: 'pending',
        guests: [],
        ...data
    } as GuestGroup;
    
    allGroups.push(newGroup);
    localStorage.setItem(KEYS.GUEST_GROUPS, JSON.stringify(allGroups));
    return newGroup;
};

export const updateGuestGroup = async (id: string, updates: Partial<GuestGroup>): Promise<GuestGroup> => {
    await delay();
    const allGroups = JSON.parse(localStorage.getItem(KEYS.GUEST_GROUPS) || '[]');
    const index = allGroups.findIndex((g: GuestGroup) => g.id === id);
    if (index === -1) throw new Error("Group not found");
    
    const updated = { ...allGroups[index], ...updates };
    allGroups[index] = updated;
    localStorage.setItem(KEYS.GUEST_GROUPS, JSON.stringify(allGroups));
    return updated;
};

export const deleteGuestGroup = async (id: string): Promise<void> => {
    await delay();
    let allGroups = JSON.parse(localStorage.getItem(KEYS.GUEST_GROUPS) || '[]');
    allGroups = allGroups.filter((g: GuestGroup) => g.id !== id);
    localStorage.setItem(KEYS.GUEST_GROUPS, JSON.stringify(allGroups));
};

// --- WELCOME SCREENS SERVICES ---

export const getWelcomeDesigns = async (eventId: string): Promise<WelcomeScreenDesign[]> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.SCREENS);
    const allDesigns: WelcomeScreenDesign[] = stored ? JSON.parse(stored) : [];
    return allDesigns.filter(d => d.eventId === eventId);
};

export const getWelcomeDesign = async (id: string): Promise<WelcomeScreenDesign | undefined> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.SCREENS);
    const allDesigns: WelcomeScreenDesign[] = stored ? JSON.parse(stored) : [];
    return allDesigns.find(d => d.id === id);
};

export const createWelcomeDesign = async (design: Partial<WelcomeScreenDesign>): Promise<WelcomeScreenDesign> => {
    await delay(300);
    const stored = localStorage.getItem(KEYS.SCREENS);
    const allDesigns: WelcomeScreenDesign[] = stored ? JSON.parse(stored) : [];
    
    const newDesign: WelcomeScreenDesign = {
        id: Math.random().toString(36).substr(2, 9),
        updatedAt: new Date().toISOString(),
        eventId: 'e1',
        partnerId: 'p1',
        name: 'New Screen',
        orientation: 'landscape',
        resolution: { width: 1920, height: 1080 },
        elements: [],
        idleGallery: [],
        background: '#ffffff', // Changed default to white
        ...design
    } as WelcomeScreenDesign;
    
    allDesigns.push(newDesign);
    localStorage.setItem(KEYS.SCREENS, JSON.stringify(allDesigns));
    return newDesign;
};

export const updateWelcomeDesign = async (id: string, updates: Partial<WelcomeScreenDesign>): Promise<WelcomeScreenDesign> => {
    await delay(300);
    const stored = localStorage.getItem(KEYS.SCREENS);
    const allDesigns: WelcomeScreenDesign[] = stored ? JSON.parse(stored) : [];
    
    const index = allDesigns.findIndex(d => d.id === id);
    if (index === -1) throw new Error("Design not found");
    
    const updatedDesign = { ...allDesigns[index], ...updates, updatedAt: new Date().toISOString() };
    allDesigns[index] = updatedDesign;
    localStorage.setItem(KEYS.SCREENS, JSON.stringify(allDesigns));
    return updatedDesign;
};

export const deleteWelcomeDesign = async (id: string): Promise<void> => {
    await delay(200);
    const stored = localStorage.getItem(KEYS.SCREENS);
    const allDesigns: WelcomeScreenDesign[] = stored ? JSON.parse(stored) : [];
    const filtered = allDesigns.filter(d => d.id !== id);
    localStorage.setItem(KEYS.SCREENS, JSON.stringify(filtered));
};
