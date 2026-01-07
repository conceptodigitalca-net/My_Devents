import React, { useState, useEffect, useRef } from 'react';
import { User, Event, EventLocation, SocialMediaLink } from '../types';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../services/mockBackend';
import { Plus, Calendar, MapPin, Globe, Instagram, Facebook, Twitter, Linkedin, X, Save, Building2, ExternalLink, Trash2, Edit2, Map as MapIcon, Crosshair, ArrowUp, ArrowDown, Navigation, Check, Users } from 'lucide-react';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

interface MyEventsProps {
    user: User;
}

const MyEvents: React.FC<MyEventsProps> = ({ user }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // State to track editing
    const [isEditing, setIsEditing] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);

    // Form State
    const [eventName, setEventName] = useState('');
    const [eventType, setEventType] = useState('Wedding');
    const [eventDate, setEventDate] = useState('');
    
    // Dynamic Arrays state
    const [locations, setLocations] = useState<EventLocation[]>([{ id: 'loc-1', name: '', address: '' }]);
    const [socialMedia, setSocialMedia] = useState<SocialMediaLink[]>([{ platform: 'instagram', url: '' }]);

    // Map State
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [currentLocationIndex, setCurrentLocationIndex] = useState<number | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [tempCoords, setTempCoords] = useState<{lat: number, lng: number} | null>(null);
    const [tempAddress, setTempAddress] = useState('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    useEffect(() => {
        // Load events for this partner
        if (user.partnerIds && user.partnerIds.length > 0) {
            getEvents(user.partnerIds).then(setEvents);
        }
    }, [user]);

    // --- MAP LOGIC ---

    // Initialize Map when Modal Opens
    useEffect(() => {
        if (isMapOpen && mapContainerRef.current && !mapInstanceRef.current) {
            // Default center (can be 0,0 or a default city)
            const initialLat = 40.7128; 
            const initialLng = -74.0060;

            const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            mapInstanceRef.current = map;

            // Handle Click
            map.on('click', async (e) => {
                handleMapClick(e.latlng.lat, e.latlng.lng);
            });

            // If we are editing a location that already has coords, center there
            if (currentLocationIndex !== null && locations[currentLocationIndex].lat && locations[currentLocationIndex].lng) {
                 const { lat, lng } = locations[currentLocationIndex];
                 updateMapMarker(lat!, lng!);
            } else {
                 // Try to get current location if new
                 handleGetCurrentLocation();
            }
        }
        
        // Cleanup function not needed strictly for ref-based mock but good practice
        return () => {
             if (!isMapOpen && mapInstanceRef.current) {
                 mapInstanceRef.current.remove();
                 mapInstanceRef.current = null;
                 markerRef.current = null;
             }
        };
    }, [isMapOpen]);

    const updateMapMarker = (lat: number, lng: number) => {
        if (!mapInstanceRef.current) return;
        
        setTempCoords({ lat, lng });
        mapInstanceRef.current.setView([lat, lng], 16);

        if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
        } else {
            // Create custom icon to avoid 404 on default leaflet icon in some envs
            const icon = L.divIcon({
                className: 'bg-transparent',
                html: `<div style="background-color: #4f46e5; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            markerRef.current = L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
        }
    };

    const handleMapClick = async (lat: number, lng: number) => {
        updateMapMarker(lat, lng);
        setIsLoadingAddress(true);
        try {
            // Reverse Geocoding using Nominatim (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setTempAddress(data.display_name);
            }
        } catch (error) {
            console.error("Failed to fetch address", error);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    handleMapClick(latitude, longitude);
                },
                (error) => {
                    // Improved error handling
                    let errorMessage = "Could not access your location.";
                    if (error.code === 1) { // PERMISSION_DENIED
                        errorMessage = "Location permission denied. Please check your browser settings.";
                    } else if (error.code === 2) { // POSITION_UNAVAILABLE
                        errorMessage = "Location information is unavailable.";
                    } else if (error.code === 3) { // TIMEOUT
                        errorMessage = "The request to get user location timed out.";
                    }
                    console.error("Error getting location:", error.message || error);
                    alert(errorMessage);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };

    const confirmMapSelection = () => {
        if (currentLocationIndex !== null && tempCoords) {
            const updatedLocations = [...locations];
            updatedLocations[currentLocationIndex] = {
                ...updatedLocations[currentLocationIndex],
                address: tempAddress || updatedLocations[currentLocationIndex].address, // Use fetched address or keep old if fetch failed
                lat: tempCoords.lat,
                lng: tempCoords.lng
            };
            setLocations(updatedLocations);
        }
        setIsMapOpen(false);
        setTempCoords(null);
        setTempAddress('');
    };

    // --- LOCATION LIST LOGIC ---

    const handleAddLocation = () => {
        setLocations([...locations, { id: `loc-${Date.now()}`, name: '', address: '' }]);
    };

    const handleRemoveLocation = (id: string) => {
        if (locations.length > 1) {
            setLocations(locations.filter(l => l.id !== id));
        } else {
            alert("You must have at least one location for an event.");
        }
    };

    const handleMoveLocation = (index: number, direction: 'up' | 'down') => {
        const newLocations = [...locations];
        if (direction === 'up' && index > 0) {
            [newLocations[index], newLocations[index - 1]] = [newLocations[index - 1], newLocations[index]];
        } else if (direction === 'down' && index < newLocations.length - 1) {
            [newLocations[index], newLocations[index + 1]] = [newLocations[index + 1], newLocations[index]];
        }
        setLocations(newLocations);
    };

    const handleLocationChange = (id: string, field: 'name' | 'address', value: string) => {
        setLocations(locations.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const openMapForLocation = (index: number) => {
        setCurrentLocationIndex(index);
        // Pre-fill temp state if exists
        const loc = locations[index];
        if (loc.lat && loc.lng) {
            setTempCoords({ lat: loc.lat, lng: loc.lng });
        }
        setIsMapOpen(true);
    };

    // --- SOCIAL & FORM LOGIC ---

    const handleAddSocial = () => {
        setSocialMedia([...socialMedia, { platform: 'instagram', url: '' }]);
    };

    const handleRemoveSocial = (index: number) => {
        if (socialMedia.length > 0) {
            setSocialMedia(socialMedia.filter((_, i) => i !== index));
        }
    };

    const handleSocialChange = (index: number, field: 'platform' | 'url', value: string) => {
        setSocialMedia(socialMedia.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const handleEditClick = (event: Event) => {
        setEventName(event.name);
        setEventType(event.type);
        setEventDate(event.date);
        setLocations(event.locations.length > 0 ? event.locations : [{ id: 'loc-1', name: '', address: '' }]);
        setSocialMedia(event.socialMedia.length > 0 ? event.socialMedia : [{ platform: 'instagram', url: '' }]);
        setIsEditing(true);
        setEditingEventId(event.id);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (eventId: string) => {
        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            try {
                await deleteEvent(eventId);
                setEvents(prev => prev.filter(e => e.id !== eventId));
            } catch (error: any) {
                alert(error.message || "Failed to delete event");
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!user.partnerIds || user.partnerIds.length === 0) {
            alert("No partner account linked to this user.");
            return;
        }

        const eventData = {
            name: eventName,
            type: eventType,
            date: eventDate,
            locations: locations.filter(l => l.name.trim() !== ''),
            socialMedia: socialMedia.filter(s => s.url.trim() !== '')
        };

        try {
            if (isEditing && editingEventId) {
                const updatedEvent = await updateEvent(editingEventId, eventData);
                setEvents(prev => prev.map(e => e.id === editingEventId ? updatedEvent : e));
            } else {
                const newEvent = await createEvent({
                    partnerId: user.partnerIds[0],
                    ...eventData
                });
                setEvents(prev => [...prev, newEvent]);
            }
            closeModal();
        } catch (error: any) {
            alert(error.message || "Failed to save event");
        }
    };

    const resetForm = () => {
        setEventName('');
        setEventType('Wedding');
        setEventDate('');
        setLocations([{ id: 'loc-1', name: '', address: '' }]);
        setSocialMedia([{ platform: 'instagram', url: '' }]);
        setIsEditing(false);
        setEditingEventId(null);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Events</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your upcoming events and details.</p>
                </div>
                <button 
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md font-medium"
                >
                    <Plus size={20} /> New Event
                </button>
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No events yet</h3>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mb-4">Create your first event to get started.</p>
                        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="text-indigo-600 font-medium hover:underline">Create Event</button>
                    </div>
                )}
                {events.map(event => (
                    <div key={event.id} className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden">
                        
                        {/* Action Buttons */}
                        <div className="absolute top-0 right-0 p-2 flex gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-bl-xl border-b border-l border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <button onClick={() => handleEditClick(event)} className="p-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md hover:bg-indigo-100 transition-colors" title="Edit Event"><Edit2 size={16}/></button>
                            <button onClick={() => handleDeleteClick(event.id)} className="p-1.5 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-100 transition-colors" title="Delete Event"><Trash2 size={16}/></button>
                        </div>

                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full mb-2 inline-block">{event.type}</span>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{event.name}</h3>
                            </div>
                        </div>
                        
                        <div className="space-y-2 mb-4 flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Calendar size={14} className="text-slate-400" />
                                <span>{event.date}</span>
                            </div>
                            
                            <div className="space-y-1">
                                {event.locations.slice(0, 2).map((loc, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="truncate">{loc.name}</span>
                                    </div>
                                ))}
                                {event.locations.length > 2 && <span className="text-xs text-slate-400 ml-6">+{event.locations.length - 2} more locations</span>}
                            </div>
                        </div>

                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-auto">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {event.socialMedia.map((social, i) => (
                                        <a key={i} href={social.url} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 hover:text-indigo-500 transition-colors">
                                            {social.platform === 'instagram' && <Instagram size={14} />}
                                            {social.platform === 'facebook' && <Facebook size={14} />}
                                            {social.platform === 'twitter' && <Twitter size={14} />}
                                            {social.platform === 'linkedin' && <Linkedin size={14} />}
                                            {social.platform === 'website' && <Globe size={14} />}
                                        </a>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => navigate(`/events/${event.id}/guests`)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    <Users size={14} /> Guest List
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE/EDIT EVENT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col animate-entry-pop-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                                {isEditing ? 'Edit Event' : 'Create New Event'}
                            </h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <form id="create-event-form" onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">General Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Event Name</label>
                                            <input required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="e.g. Smith Wedding" value={eventName} onChange={e => setEventName(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                                            <input required type="date" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Event Type</label>
                                            <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" value={eventType} onChange={e => setEventType(e.target.value)}>
                                                <option value="Wedding">Wedding</option>
                                                <option value="Birthday">Birthday</option>
                                                <option value="Corporate">Corporate</option>
                                                <option value="Anniversary">Anniversary</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Locations (Enhanced) */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><MapPin size={16}/> Locations</h4>
                                        <button type="button" onClick={handleAddLocation} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 font-medium"><Plus size={14}/> Add Location</button>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {locations.map((loc, index) => (
                                            <div key={loc.id} className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200 dark:border-slate-700 relative group animate-fade-in">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Venue Name</label>
                                                        <input required placeholder="e.g. St. Patrick's Cathedral" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white placeholder-slate-400" value={loc.name} onChange={e => handleLocationChange(loc.id, 'name', e.target.value)} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
                                                        <input required placeholder="Full Address" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white placeholder-slate-400" value={loc.address} onChange={e => handleLocationChange(loc.id, 'address', e.target.value)} />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => openMapForLocation(index)}
                                                            className={`text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all font-medium ${loc.lat ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                                                        >
                                                            {loc.lat ? <Check size={14} /> : <MapIcon size={14} />}
                                                            {loc.lat ? 'Location Set' : 'Pick on Map'}
                                                        </button>
                                                        {loc.lat && <span className="text-[10px] text-slate-400 font-mono">{loc.lat.toFixed(4)}, {loc.lng?.toFixed(4)}</span>}
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <button type="button" onClick={() => handleMoveLocation(index, 'up')} disabled={index === 0} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowUp size={16}/></button>
                                                        <button type="button" onClick={() => handleMoveLocation(index, 'down')} disabled={index === locations.length - 1} className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ArrowDown size={16}/></button>
                                                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1"></div>
                                                        <button type="button" onClick={() => handleRemoveLocation(loc.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Social Media */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-2">
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"><Globe size={16}/> Social Media</h4>
                                        <button type="button" onClick={handleAddSocial} className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 font-medium"><Plus size={14}/> Add Link</button>
                                    </div>
                                    <div className="space-y-3">
                                        {socialMedia.map((social, index) => (
                                            <div key={index} className="flex gap-2 items-start animate-fade-in">
                                                <div className="flex-1 flex gap-2">
                                                    <select className="w-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white" value={social.platform} onChange={e => handleSocialChange(index, 'platform', e.target.value as any)}>
                                                        <option value="instagram">Instagram</option>
                                                        <option value="facebook">Facebook</option>
                                                        <option value="twitter">Twitter</option>
                                                        <option value="linkedin">LinkedIn</option>
                                                        <option value="website">Website</option>
                                                    </select>
                                                    <input placeholder="URL (https://...)" className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white" value={social.url} onChange={e => handleSocialChange(index, 'url', e.target.value)} />
                                                </div>
                                                <button type="button" onClick={() => handleRemoveSocial(index)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </form>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-white dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">Cancel</button>
                            <button form="create-event-form" type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md flex items-center gap-2">
                                <Save size={18} /> {isEditing ? 'Update Event' : 'Save Event'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAP MODAL */}
            {isMapOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[600px] animate-entry-pop-in">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><MapPin size={20} className="text-indigo-600"/> Select Location</h3>
                                <p className="text-xs text-slate-500">Click on the map to set the location.</p>
                            </div>
                            <button onClick={() => setIsMapOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                        </div>
                        
                        <div className="flex-1 relative">
                             <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-slate-100" />
                             
                             {/* Floating Locate Button */}
                             <button 
                                onClick={handleGetCurrentLocation}
                                className="absolute bottom-6 right-6 z-10 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:scale-110 transition-all"
                                title="My Current Location"
                             >
                                 <Crosshair size={24} />
                             </button>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                             <div className="mb-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Selected Address</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly 
                                        value={isLoadingAddress ? 'Fetching address...' : tempAddress || 'No location selected'} 
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                             </div>
                             <div className="flex justify-end gap-3">
                                 <button onClick={() => setIsMapOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                                 <button 
                                    onClick={confirmMapSelection} 
                                    disabled={!tempCoords}
                                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                     <Check size={18} /> Confirm Location
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEvents;