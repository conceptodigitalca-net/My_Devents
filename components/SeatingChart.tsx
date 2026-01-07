import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Event, LayoutObject, Guest, GuestGroup, LayoutObjectType } from '../types';
import { getEvent, getGuestGroups, updateGuestGroup } from '../services/mockBackend';
import { ArrowLeft, ZoomIn, ZoomOut, Search, User, Filter, Check, MapPin, X, Sofa, Users, GripVertical, CheckCircle2, Monitor, Camera, Image as ImageIcon, Sparkles, Grid, ArrowRight, PieChart } from 'lucide-react';

const DEFAULT_CHAIR_SIZE = 22; 
const CHAIR_GAP = 4;   
const OBJ_PADDING = 8; 

const SeatingChart: React.FC<{ user: any }> = ({ user }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [allGuestGroups, setAllGuestGroups] = useState<GuestGroup[]>([]);
    const [layoutObjects, setLayoutObjects] = useState<LayoutObject[]>([]);
    const [activeLocationId, setActiveLocationId] = useState<string>('');
    const [roomDimensions, setRoomDimensions] = useState({ width: 2000, height: 1500 });

    // UI State
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [guestFilter, setGuestFilter] = useState<'all' | 'unassigned' | 'assigned'>('unassigned');
    const [searchQuery, setSearchQuery] = useState('');
    const [zoom, setZoom] = useState(0.6);
    
    // Derived State: Flattened Guests for Dragging
    const [guests, setGuests] = useState<Guest[]>([]);

    useEffect(() => {
        if (eventId) {
            Promise.all([getEvent(eventId), getGuestGroups(eventId)]).then(([ev, groups]) => {
                if (ev) {
                    setEvent(ev);
                    if (ev.locations.length > 0) {
                        setActiveLocationId(ev.locations[0].id);
                        const loc = ev.locations[0];
                        if (loc.layout) {
                            setLayoutObjects(loc.layout.objects);
                            setRoomDimensions({ width: loc.layout.width, height: loc.layout.height });
                        }
                    }
                }
                setAllGuestGroups(groups);
                // Flatten Confirmed Guests Only
                const flatGuests: Guest[] = [];
                groups.forEach(group => {
                    group.guests.forEach(g => {
                        if (g.isConfirmed) flatGuests.push(g);
                    });
                });
                setGuests(flatGuests);
                setLoading(false);
            });
        }
    }, [eventId]);

    // --- DRAG & DROP LOGIC ---
    const handleDragStart = (e: React.DragEvent, guestId: string) => {
        e.dataTransfer.setData('guestId', guestId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDropOnSeat = async (e: React.DragEvent, tableId: string, seatIndex: number) => {
        e.preventDefault();
        e.stopPropagation(); // Stop bubbling to prevent selecting the table on drop
        const guestId = e.dataTransfer.getData('guestId');
        if (!guestId) return;

        // Find the group owning this guest
        const group = allGuestGroups.find(g => g.guests.some(person => person.id === guestId));
        if (!group) return;

        // Check if seat is already occupied
        const existingOccupant = guests.find(g => g.assignedSeat?.tableId === tableId && g.assignedSeat?.seatIndex === seatIndex);
        if (existingOccupant) {
            if (!window.confirm(`This seat is already taken by ${existingOccupant.name}. Replace them?`)) {
                return;
            }
        }

        // Update guest assignation locally first
        const updatedGuests = group.guests.map(g => {
            if (g.id === guestId) {
                return { ...g, assignedSeat: { locationId: activeLocationId, tableId, seatIndex } };
            }
            return g;
        });

        // Update Backend
        try {
            await updateGuestGroup(group.id, { guests: updatedGuests });
            
            // Handle displacement if occupant was from DIFFERENT group
            const updatedGroups = allGuestGroups.map(g => g.id === group.id ? { ...g, guests: updatedGuests } : g);
            
            if (existingOccupant) {
                const otherGroup = updatedGroups.find(g => g.guests.some(p => p.id === existingOccupant.id));
                if (otherGroup && otherGroup.id !== group.id) {
                    const cleanOtherGuests = otherGroup.guests.map(g => g.id === existingOccupant.id ? { ...g, assignedSeat: undefined } : g);
                    await updateGuestGroup(otherGroup.id, { guests: cleanOtherGuests });
                    const idx = updatedGroups.findIndex(g => g.id === otherGroup.id);
                    if (idx !== -1) updatedGroups[idx] = { ...updatedGroups[idx], guests: cleanOtherGuests };
                }
            }

            setAllGuestGroups(updatedGroups);
            
            // Re-flatten
            const flatGuests: Guest[] = [];
            updatedGroups.forEach(g => {
                g.guests.forEach(p => { if (p.isConfirmed) flatGuests.push(p); });
            });
            setGuests(flatGuests);

        } catch (error) {
            console.error("Failed to assign seat", error);
            alert("Failed to assign seat.");
        }
    };

    const handleRemoveAssignment = async (guestId: string) => {
        const group = allGuestGroups.find(g => g.guests.some(person => person.id === guestId));
        if (!group) return;

        const updatedGuests = group.guests.map(g => {
            if (g.id === guestId) {
                const { assignedSeat, ...rest } = g;
                return rest;
            }
            return g;
        });

        try {
            await updateGuestGroup(group.id, { guests: updatedGuests });
            const updatedGroups = allGuestGroups.map(g => g.id === group.id ? { ...g, guests: updatedGuests } : g);
            setAllGuestGroups(updatedGroups);
            
            const flatGuests: Guest[] = [];
            updatedGroups.forEach(g => {
                g.guests.forEach(p => { if (p.isConfirmed) flatGuests.push(p); });
            });
            setGuests(flatGuests);
        } catch (err) { console.error(err); }
    };

    // --- HELPER TO GET OCCUPANT ---
    const getSeatOccupant = (tableId: string, seatIndex: number): Guest | undefined => {
        return guests.find(g => g.assignedSeat?.tableId === tableId && g.assignedSeat?.seatIndex === seatIndex);
    };

    const handleLocationChange = (locId: string) => {
        if (!event) return;
        setActiveLocationId(locId);
        const loc = event.locations.find(l => l.id === locId);
        if (loc && loc.layout) {
            setLayoutObjects(loc.layout.objects);
            setRoomDimensions({ width: loc.layout.width, height: loc.layout.height });
            setSelectedTableId(null);
        }
    };

    // --- FILTERED LIST ---
    const filteredGuests = guests.filter(g => {
        const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = 
            guestFilter === 'all' ? true :
            guestFilter === 'assigned' ? !!g.assignedSeat :
            !g.assignedSeat;
        return matchesSearch && matchesFilter;
    });

    // --- STATISTICS ---
    const totalGuests = guests.length;
    const assignedCount = guests.filter(g => g.assignedSeat).length;
    const unassignedCount = totalGuests - assignedCount;

    // --- CALCULATE CAPACITY HELPERS ---
    const getObjectCapacity = (obj: LayoutObject): number => {
        if (obj.type === 'chair' && obj.gridConfig) return obj.gridConfig.rows * obj.gridConfig.cols;
        if (obj.type === 'lounge-area' && obj.loungeConfig) return obj.loungeConfig.chairs;
        return obj.capacity || 0;
    };

    // --- VISUAL RENDERERS ---

    // Generic Seat Renderer
    const renderSeatVisual = (objId: string, seatIndex: number, x: number, y: number, size: number, shape: 'round' | 'rect' = 'rect', rotation: number = 0) => {
        const occupant = getSeatOccupant(objId, seatIndex);
        
        return (
            <div
                key={`seat-${objId}-${seatIndex}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnSeat(e, objId, seatIndex)}
                title={occupant ? `Occupied by: ${occupant.name}` : `Seat ${seatIndex + 1}`}
                className={`absolute border transition-all cursor-pointer flex items-center justify-center shadow-sm z-20 group
                    ${shape === 'round' ? 'rounded-full' : 'rounded-sm'}
                    ${occupant 
                        ? 'bg-emerald-500 border-emerald-600' 
                        : 'bg-white border-slate-400 hover:border-indigo-500 hover:bg-indigo-50'
                    }
                `}
                style={{ 
                    left: x, 
                    top: y, 
                    width: size, 
                    height: size,
                    transform: `rotate(${rotation}deg)` 
                }}
            >
                {occupant ? (
                    <span className="text-[8px] font-bold text-white truncate max-w-full px-0.5 pointer-events-none">
                        {occupant.name.charAt(0)}
                    </span>
                ) : (
                    <span className="text-[6px] text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 pointer-events-none">
                        {seatIndex + 1}
                    </span>
                )}
                
                {/* Tooltip for Occupant Name */}
                {occupant && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        {occupant.name}
                    </div>
                )}
            </div>
        );
    };

    const renderLoungeContents = (obj: LayoutObject) => {
        if (obj.type !== 'lounge-area' || !obj.loungeConfig) return null;
        const { chairs, tables, tableType, seatsPerSide } = obj.loungeConfig;
        if (tables === 0) return null;

        const tableElements = [];
        
        const baseChairsPerTable = Math.floor(chairs / tables);
        const remainder = chairs % tables;

        const cols = Math.ceil(Math.sqrt(tables));
        const rows = Math.ceil(tables / cols);
        
        const cellW = obj.width / cols;
        const cellH = obj.height / rows;

        const minDimension = Math.min(cellW, cellH);
        const baseTableSize = Math.max(20, minDimension * 0.3);
        const chairSize = Math.max(16, minDimension * 0.25); 
        const gap = 2;

        let globalSeatIndex = 0; 

        for (let i = 0; i < tables; i++) {
            const row = Math.floor(i / cols);
            const col = i % cols;
            
            const cx = (col * cellW) + (cellW / 2);
            const cy = (row * cellH) + (cellH / 2);

            const tableChairs = [];

            if (tableType === 'round') {
                const numChairs = baseChairsPerTable + (i < remainder ? 1 : 0);
                const radius = (baseTableSize / 2) + (chairSize / 2) + gap; 
                for (let c = 0; c < numChairs; c++) {
                    const angle = (c * 360) / numChairs;
                    const rad = (angle * Math.PI) / 180;
                    const chairX = cx + radius * Math.cos(rad) - (chairSize/2); 
                    const chairY = cy + radius * Math.sin(rad) - (chairSize/2);
                    
                    tableChairs.push(renderSeatVisual(obj.id, globalSeatIndex, chairX, chairY, chairSize, 'round'));
                    globalSeatIndex++;
                }
                
                tableElements.push(
                    <React.Fragment key={`tbl-${i}`}>
                        <div className="absolute bg-white border-2 border-slate-400 rounded-full" style={{ width: baseTableSize, height: baseTableSize, left: cx - (baseTableSize/2), top: cy - (baseTableSize/2) }} />
                        {tableChairs}
                    </React.Fragment>
                );

            } else {
                let nTop, nBottom, nLeft, nRight;

                if (seatsPerSide) {
                    nTop = seatsPerSide.top; nBottom = seatsPerSide.bottom; nLeft = seatsPerSide.left; nRight = seatsPerSide.right;
                } else {
                    const numChairs = baseChairsPerTable + (i < remainder ? 1 : 0);
                    let remaining = numChairs;
                    nTop = 0; nBottom = 0; nLeft = 0; nRight = 0;
                    while(remaining > 0) {
                        if (remaining > 0) { nTop++; remaining--; }
                        if (remaining > 0) { nBottom++; remaining--; }
                        if (remaining > 0) { nLeft++; remaining--; }
                        if (remaining > 0) { nRight++; remaining--; }
                    }
                }

                const maxHorizontalChairs = Math.max(nTop, nBottom);
                const reqWidthForChairs = maxHorizontalChairs * (chairSize + gap) - gap;
                const actualTableWidth = Math.max(baseTableSize, reqWidthForChairs);
                
                const maxVerticalChairs = Math.max(nLeft, nRight);
                const reqHeightForChairs = maxVerticalChairs * (chairSize + gap) - gap;
                const actualTableHeight = Math.max(baseTableSize, reqHeightForChairs);

                // Top Chairs
                for (let k = 0; k < nTop; k++) {
                    const groupWidth = (nTop * chairSize) + ((nTop - 1) * gap);
                    const startX = cx - (groupWidth / 2);
                    const x = startX + (k * (chairSize + gap));
                    const y = cy - (actualTableHeight / 2) - chairSize - gap;
                    tableChairs.push(renderSeatVisual(obj.id, globalSeatIndex, x, y, chairSize, 'rect'));
                    globalSeatIndex++;
                }
                // Bottom Chairs
                for (let k = 0; k < nBottom; k++) {
                    const groupWidth = (nBottom * chairSize) + ((nBottom - 1) * gap);
                    const startX = cx - (groupWidth / 2);
                    const x = startX + (k * (chairSize + gap));
                    const y = cy + (actualTableHeight / 2) + gap;
                    tableChairs.push(renderSeatVisual(obj.id, globalSeatIndex, x, y, chairSize, 'rect'));
                    globalSeatIndex++;
                }
                // Left Chairs
                for (let k = 0; k < nLeft; k++) {
                    const groupHeight = (nLeft * chairSize) + ((nLeft - 1) * gap);
                    const startY = cy - (groupHeight / 2);
                    const y = startY + (k * (chairSize + gap));
                    const x = cx - (actualTableWidth / 2) - chairSize - gap;
                    tableChairs.push(renderSeatVisual(obj.id, globalSeatIndex, x, y, chairSize, 'rect'));
                    globalSeatIndex++;
                }
                // Right Chairs
                for (let k = 0; k < nRight; k++) {
                    const groupHeight = (nRight * chairSize) + ((nRight - 1) * gap);
                    const startY = cy - (groupHeight / 2);
                    const y = startY + (k * (chairSize + gap));
                    const x = cx + (actualTableWidth / 2) + gap;
                    tableChairs.push(renderSeatVisual(obj.id, globalSeatIndex, x, y, chairSize, 'rect'));
                    globalSeatIndex++;
                }

                tableElements.push(
                    <React.Fragment key={`tbl-${i}`}>
                        <div 
                            className="absolute bg-white border-2 border-slate-400 rounded-sm" 
                            style={{ 
                                width: actualTableWidth, 
                                height: actualTableHeight, 
                                left: cx - (actualTableWidth/2), 
                                top: cy - (actualTableHeight/2) 
                            }} 
                        />
                        {tableChairs}
                    </React.Fragment>
                );
            }
        }
        return <div className="absolute inset-0">{tableElements}</div>;
    };

    const renderChairs = (obj: LayoutObject) => {
        if (!obj.capacity || obj.capacity <= 0) return null;
        const chairs = [];
        const radius = (obj.width / 2) + 15; 

        if (obj.type === 'table-round') {
            for (let i = 0; i < obj.capacity; i++) {
                const angle = (i * 360) / obj.capacity;
                const rad = (angle * Math.PI) / 180;
                const cx = obj.width / 2;
                const cy = obj.height / 2;
                const chairX = cx + radius * Math.cos(rad) - 10; 
                const chairY = cy + radius * Math.sin(rad) - 10;
                
                chairs.push(renderSeatVisual(obj.id, i, chairX, chairY, 20, 'round'));
            }
        } else if (obj.type === 'table-rect') {
            let nTop, nBottom, nLeft, nRight;
            if (obj.seatsPerSide) {
                nTop = obj.seatsPerSide.top; nBottom = obj.seatsPerSide.bottom; nLeft = obj.seatsPerSide.left; nRight = obj.seatsPerSide.right;
            } else {
                const capacity = obj.capacity; const base = Math.floor(capacity / 4); const remainder = capacity % 4;
                nTop = base; nBottom = base; nLeft = base; nRight = base;
                if (remainder >= 1) nTop++; if (remainder >= 2) nBottom++; if (remainder >= 3) nRight++;
            }
            
            let seatCounter = 0;
            // Top
            for (let i = 0; i < nTop; i++) {
                const leftPos = (obj.width / (nTop + 1)) * (i + 1) - 10;
                chairs.push(renderSeatVisual(obj.id, seatCounter++, leftPos, -25, 20, 'rect'));
            }
            // Bottom
            for (let i = 0; i < nBottom; i++) {
                const leftPos = (obj.width / (nBottom + 1)) * (i + 1) - 10;
                chairs.push(renderSeatVisual(obj.id, seatCounter++, leftPos, obj.height + 5, 20, 'rect'));
            }
            // Left
            for (let i = 0; i < nLeft; i++) {
                const topPos = (obj.height / (nLeft + 1)) * (i + 1) - 10;
                chairs.push(renderSeatVisual(obj.id, seatCounter++, -25, topPos, 20, 'rect'));
            }
            // Right
             for (let i = 0; i < nRight; i++) {
                const topPos = (obj.height / (nRight + 1)) * (i + 1) - 10;
                chairs.push(renderSeatVisual(obj.id, seatCounter++, obj.width + 5, topPos, 20, 'rect'));
            }
        }
        return chairs;
    };

    const renderObjectVisuals = (obj: LayoutObject) => {
        // --- CHAIR GRID VISUALIZATION ---
        if (obj.type === 'chair' && obj.gridConfig) {
            const { rows, cols, itemSize } = obj.gridConfig;
            const currentItemSize = itemSize || DEFAULT_CHAIR_SIZE;
            const seats = [];
            
            let seatCounter = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const left = (c * (currentItemSize + CHAIR_GAP)) + (OBJ_PADDING / 2);
                    const top = (r * (currentItemSize + CHAIR_GAP)) + (OBJ_PADDING / 2);
                    
                    const occupant = getSeatOccupant(obj.id, seatCounter);
                    const idx = seatCounter; // Capture for closure

                    seats.push(
                        <div 
                            key={`${r}-${c}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDropOnSeat(e, obj.id, idx)}
                            className={`absolute border rounded-sm shadow-sm flex items-center justify-center overflow-hidden cursor-pointer transition-colors
                                ${occupant ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-slate-400 hover:border-indigo-500'}
                            `}
                            style={{
                                width: currentItemSize,
                                height: currentItemSize,
                                left: left,
                                top: top
                            }}
                            title={occupant ? occupant.name : `Seat ${idx + 1}`}
                        >
                            {!occupant && <div className="w-full h-1.5 bg-slate-200 border-b border-slate-300 rounded-t-sm absolute top-0 pointer-events-none"></div>}
                            {occupant && <span className="text-[8px] font-bold text-white pointer-events-none">{occupant.name.charAt(0)}</span>}
                        </div>
                    );
                    seatCounter++;
                }
            }
            
            return (
                <div 
                    className="w-full h-full relative overflow-visible border border-transparent hover:border-slate-300/50"
                    onClick={(e) => { e.stopPropagation(); setSelectedTableId(obj.id); }}
                >
                    {seats}
                    <div className="pointer-events-none flex flex-col items-center justify-center w-full h-full p-1 absolute inset-0 z-20 opacity-50 hover:opacity-100 transition-opacity">
                        <span className="font-bold text-center leading-none text-slate-800 bg-white/50 px-1 rounded backdrop-blur-sm" style={{ fontSize: `${Math.max(10, 12 / zoom)}px` }}>
                            {obj.label}
                        </span>
                    </div>
                </div>
            );
        }

        // --- STANDARD RENDERING ---
        const isSeatable = ['table-round', 'table-rect', 'lounge-area'].includes(obj.type);
        const isSelected = selectedTableId === obj.id;

        return (
            <div 
                className={`w-full h-full border-2 flex items-center justify-center relative text-xs text-center font-semibold overflow-visible cursor-pointer
                    ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/20 z-30' : 'border-slate-400 hover:border-indigo-300 z-10'}
                    ${obj.type === 'table-round' ? 'rounded-full bg-slate-100' : ''}
                    ${obj.type === 'table-rect' ? 'rounded-md bg-slate-100' : ''}
                    ${obj.type === 'dance-floor' ? 'bg-indigo-50 border-dashed rounded-none cursor-default' : ''}
                    ${obj.type === 'stage' ? 'bg-slate-800 text-white rounded-sm cursor-default' : ''}
                    ${obj.type === 'sofa' ? 'bg-slate-200 rounded-xl cursor-default' : ''}
                    ${obj.type === 'decor' ? 'bg-pink-50 border-pink-200 text-pink-500 rounded-full cursor-default' : ''}
                    ${obj.type === 'photo-booth' ? 'bg-purple-100 border-purple-300 text-purple-700 cursor-default' : ''}
                    ${obj.type === 'photo-set' ? 'bg-blue-50 border-blue-200 text-blue-600 cursor-default' : ''}
                    ${obj.type === 'led-screen' ? 'bg-black border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] cursor-default' : ''}
                    ${obj.type === 'lounge-area' ? 'bg-slate-100/50 border-slate-300 border-dashed rounded-lg' : ''}
                `}
                onClick={(e) => {
                    e.stopPropagation();
                    if (isSeatable) setSelectedTableId(obj.id);
                }}
            >
                <div className="pointer-events-none flex flex-col items-center justify-center w-full h-full p-1 absolute inset-0 z-10">
                    {obj.type === 'decor' && <Sparkles size={obj.width/2} />}
                    {obj.type === 'photo-booth' && <Camera size={24} />}
                    {obj.type === 'photo-set' && <ImageIcon size={24} />}
                    {obj.type === 'led-screen' && <Monitor size={20} />}
                    
                    <span 
                        className="font-bold text-center leading-none"
                        style={{
                            fontSize: `${Math.max(10, 12 / zoom)}px`,
                            textShadow: '0 0 3px rgba(255, 255, 255, 0.9)',
                            color: obj.type === 'led-screen' ? '#22d3ee' : 'black'
                        }}
                    >
                        {obj.label}
                    </span>
                </div>

                {renderChairs(obj)}
                {renderLoungeContents(obj)}
            </div>
        );
    };

    if (loading || !event) return <div className="h-screen flex items-center justify-center text-slate-500">Loading Seating Chart...</div>;

    const activeObject = layoutObjects.find(o => o.id === selectedTableId);

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
            
            {/* CANVAS (LEFT/CENTER) */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-200 dark:bg-black/20">
                
                {/* Header/Controls Bar */}
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-between pointer-events-none">
                    <div className="pointer-events-auto flex gap-2 items-center">
                        <button onClick={() => navigate('/seating-select')} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        {event.locations.map(loc => (
                            <button 
                                key={loc.id} 
                                onClick={() => handleLocationChange(loc.id)} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-md shadow-sm flex items-center gap-2 transition-colors ${activeLocationId === loc.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white' : 'bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:bg-white'}`}
                            >
                                <MapPin size={12} /> {loc.name}
                            </button>
                        ))}

                        {/* COUNTERS */}
                        <div className="ml-2 flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 h-[38px]">
                            <div className="px-3 flex flex-col items-center border-r border-slate-100 dark:border-slate-700">
                                <span className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-0.5">Total</span>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{totalGuests}</span>
                            </div>
                            <div className="px-3 flex flex-col items-center border-r border-slate-100 dark:border-slate-700">
                                <span className="text-[9px] uppercase font-bold text-emerald-500 leading-none mb-0.5">Seated</span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-none">{assignedCount}</span>
                            </div>
                            <div className="px-3 flex flex-col items-center">
                                <span className="text-[9px] uppercase font-bold text-indigo-500 leading-none mb-0.5">To Seat</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-none">{unassignedCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pointer-events-auto flex bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-1">
                        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded"><ZoomOut size={16}/></button>
                        <span className="px-2 flex items-center text-xs font-mono text-slate-500 w-10 justify-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded"><ZoomIn size={16}/></button>
                    </div>
                </div>

                {/* The Canvas Itself */}
                <div 
                    className="flex-1 overflow-auto flex items-center justify-center p-20 cursor-default"
                    onClick={() => setSelectedTableId(null)}
                >
                    <div 
                        className="bg-white relative shadow-xl transition-transform origin-center" 
                        style={{ 
                            width: roomDimensions.width, 
                            height: roomDimensions.height, 
                            transform: `scale(${zoom})`,
                            backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', 
                            backgroundSize: '40px 40px' 
                        }}
                    >
                        {layoutObjects.map(obj => (
                            <div key={obj.id} style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.width, height: obj.height, transform: `rotate(${obj.rotation}deg)` }}>
                                {renderObjectVisuals(obj)}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR: GUEST LIST & ASSIGNMENT PANEL */}
            <div className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-30 shadow-xl">
                
                {/* Top: Guest List */}
                <div className={`flex flex-col ${activeObject ? 'h-1/2 border-b border-slate-200 dark:border-slate-800' : 'h-full'}`}>
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                        <h2 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Users size={16}/> Guest List</h2>
                        {/* Search */}
                        <div className="relative mb-2">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                            <input 
                                placeholder="Search guest..." 
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {/* Filters */}
                        <div className="flex gap-1">
                            <button onClick={() => setGuestFilter('unassigned')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${guestFilter === 'unassigned' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>To Seat</button>
                            <button onClick={() => setGuestFilter('assigned')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${guestFilter === 'assigned' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>Seated</button>
                            <button onClick={() => setGuestFilter('all')} className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors ${guestFilter === 'all' ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>All</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {filteredGuests.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">No guests found.</p>}
                        {filteredGuests.map(guest => (
                            <div 
                                key={guest.id}
                                draggable={!guest.assignedSeat} 
                                onDragStart={(e) => handleDragStart(e, guest.id)}
                                className={`p-2.5 rounded-lg border flex items-center justify-between group bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${!guest.assignedSeat ? 'cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-sm' : 'opacity-70'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${guest.assignedSeat ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {guest.assignedSeat ? <Check size={12}/> : <GripVertical size={12} className="opacity-50"/>}
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{guest.name}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{guest.role}</p>
                                    </div>
                                </div>
                                {guest.assignedSeat && (
                                    <button onClick={() => handleRemoveAssignment(guest.id)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Unassign">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom: Table Details (Only when selected) */}
                {activeObject && (
                    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50 overflow-hidden animate-fade-in">
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shadow-sm z-10">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">
                                    <Sofa size={14} className="text-indigo-600"/> {activeObject.label}
                                </h3>
                                <p className="text-[10px] text-slate-500">Capacity: {getObjectCapacity(activeObject)} seats</p>
                            </div>
                            <button onClick={() => setSelectedTableId(null)} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            <p className="text-[10px] text-slate-400 italic text-center mb-2">Drag guests from the list above to assign seats.</p>
                            
                            {Array.from({ length: getObjectCapacity(activeObject) }).map((_, idx) => {
                                const occupant = getSeatOccupant(activeObject.id, idx);
                                return (
                                    <div 
                                        key={idx}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDropOnSeat(e, activeObject.id, idx)}
                                        className={`p-2 rounded-lg border-2 border-dashed transition-all flex items-center gap-3 ${occupant ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${occupant ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            {idx + 1}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            {occupant ? (
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{occupant.name}</p>
                                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 size={10}/> Assigned</p>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-400">Empty Seat</p>
                                            )}
                                        </div>

                                        {occupant && (
                                            <button onClick={() => handleRemoveAssignment(occupant.id)} className="p-1 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded shadow-sm hover:shadow">
                                                <X size={12}/>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeatingChart;