import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { Event, LayoutObject, LayoutObjectType, EventLocation } from '../types';
import { getEvent, updateEvent } from '../services/mockBackend';
import { ArrowLeft, Plus, Minus, Move, RotateCw, Trash2, Save, ZoomIn, ZoomOut, Armchair, Square, Circle, LayoutTemplate, MapPin, Grid, Users, Sparkles, Camera, Image as ImageIcon, GripHorizontal, Printer, AlertTriangle, Copy, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Magnet, Monitor, Scan, Coffee, Scaling } from 'lucide-react';

const DEFAULT_CHAIR_SIZE = 22; 
const CHAIR_GAP = 4;   
const OBJ_PADDING = 8; 

const VenueDesigner: React.FC<{ user: any }> = ({ user }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Dirty State (Unsaved Changes)
    const [isDirty, setIsDirty] = useState(false);
    
    // Custom Exit Dialog State
    const [showExitDialog, setShowExitDialog] = useState(false);

    // Navigation Blocker
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            const proceed = window.confirm("Tienes cambios sin guardar. ¿Deseas salir sin guardar?");
            if (proceed) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);

    // Current Selection
    const [activeLocationId, setActiveLocationId] = useState<string>('');
    const [objects, setObjects] = useState<LayoutObject[]>([]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    
    // Room Dimensions
    const [roomDimensions, setRoomDimensions] = useState({ width: 2000, height: 1500 });

    // Canvas State
    const [zoom, setZoom] = useState(0.8);
    const [snapToGrid, setSnapToGrid] = useState(true); 
    const GRID_SIZE = 20; 
    const canvasRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null); 
    
    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    
    // Resizing State
    const [resizingState, setResizingState] = useState<{
        active: boolean;
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        ratio: number;
    } | null>(null);

    useEffect(() => {
        if (eventId) {
            getEvent(eventId).then(ev => {
                if (ev) {
                    setEvent(ev);
                    if (ev.locations.length > 0) {
                        setActiveLocationId(ev.locations[0].id);
                        const layout = ev.locations[0].layout;
                        setObjects(layout?.objects || []);
                        if (layout?.width && layout?.height) {
                            setRoomDimensions({ width: layout.width, height: layout.height });
                        }
                    }
                }
                setLoading(false);
                setTimeout(handleFitZoom, 100);
            });
        }
    }, [eventId]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; 
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // --- CALCULATE TOTAL CAPACITY ---
    const totalCapacity = objects.reduce((acc, obj) => {
        if (obj.type === 'chair' && obj.gridConfig) {
            return acc + (obj.gridConfig.rows * obj.gridConfig.cols);
        }
        if (obj.type === 'lounge-area' && obj.loungeConfig) {
            return acc + obj.loungeConfig.chairs;
        }
        return acc + (obj.capacity || 0);
    }, 0);

    const handleBack = () => {
        if (isDirty) {
            setShowExitDialog(true);
        } else {
            navigate('/venue-select');
        }
    };

    const confirmExit = () => {
        setIsDirty(false);
        setShowExitDialog(false);
        setTimeout(() => {
            navigate('/venue-select');
        }, 0);
    };

    const cancelExit = () => {
        setShowExitDialog(false);
    };

    const handleSave = async () => {
        if (!event || !activeLocationId) return;
        setSaving(true);
        try {
            const updatedLocations = event.locations.map(loc => {
                if (loc.id === activeLocationId) {
                    return {
                        ...loc,
                        layout: {
                            objects: objects,
                            width: roomDimensions.width,
                            height: roomDimensions.height
                        }
                    };
                }
                return loc;
            });

            const updatedEvent = await updateEvent(event.id, { locations: updatedLocations });
            setEvent(updatedEvent);
            setIsDirty(false); 
            alert("Layout saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save layout.");
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleLocationChange = (locId: string) => {
        if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Continuar?")) return;

        if (event) {
             const updatedLocations = event.locations.map(loc => 
                loc.id === activeLocationId ? { ...loc, layout: { objects, width: roomDimensions.width, height: roomDimensions.height } } : loc
             );
             setEvent({ ...event, locations: updatedLocations });
             
             setActiveLocationId(locId);
             const nextLoc = updatedLocations.find(l => l.id === locId);
             setObjects(nextLoc?.layout?.objects || []);
             if (nextLoc?.layout?.width) {
                 setRoomDimensions({ width: nextLoc.layout.width, height: nextLoc.layout.height });
             }
             setSelectedObjectId(null);
             setIsDirty(false);
             setTimeout(handleFitZoom, 50); 
        }
    };

    const handleFitZoom = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            const padding = 100; 
            const wRatio = (clientWidth - padding) / roomDimensions.width;
            const hRatio = (clientHeight - padding) / roomDimensions.height;
            const newZoom = Math.min(wRatio, hRatio);
            setZoom(Math.max(0.1, Math.min(newZoom, 1.5)));
        }
    };

    const snap = (value: number) => {
        if (!snapToGrid) return value;
        return Math.round(value / GRID_SIZE) * GRID_SIZE;
    };

    // --- OBJECT MANIPULATION ---

    const addObject = (type: LayoutObjectType) => {
        const id = `obj-${Date.now()}`;
        let width = 60, height = 60, capacity = 0, baseLabel = 'Object';
        let loungeConfig = undefined;
        let gridConfig = undefined;

        // Set dimensions and Base Name
        switch(type) {
            case 'table-round': width = 100; height = 100; capacity = 8; baseLabel = 'Round Table'; break;
            case 'table-rect': width = 120; height = 80; capacity = 6; baseLabel = 'Rect Table'; break;
            case 'chair': 
                width = DEFAULT_CHAIR_SIZE + OBJ_PADDING; 
                height = DEFAULT_CHAIR_SIZE + OBJ_PADDING; 
                baseLabel = 'Chairs'; // Represents a group/grid of chairs
                gridConfig = { rows: 1, cols: 1, itemSize: DEFAULT_CHAIR_SIZE }; 
                break;
            case 'sofa': width = 100; height = 50; baseLabel = 'Sofa'; break;
            case 'dance-floor': width = 300; height = 300; baseLabel = 'Dance Floor'; break;
            case 'stage': width = 200; height = 100; baseLabel = 'Stage'; break;
            case 'altar': width = 120; height = 60; baseLabel = 'Altar'; break;
            case 'decor': width = 50; height = 50; baseLabel = 'Decor'; break;
            case 'photo-booth': width = 150; height = 100; baseLabel = 'Photo Booth'; break;
            case 'photo-set': width = 200; height = 150; baseLabel = 'Photo Set'; break;
            case 'led-screen': width = 200; height = 20; baseLabel = 'LED Screen'; break;
            case 'lounge-area': 
                width = 240; 
                height = 240; 
                baseLabel = 'Lounge Area'; 
                // Initial lounge config with seatsPerSide default
                loungeConfig = { 
                    chairs: 4, 
                    tables: 1, 
                    tableType: 'rect',
                    seatsPerSide: { top: 1, bottom: 1, left: 1, right: 1 } 
                }; 
                break;
        }

        // GENERATE UNIQUE NAME
        // Logic: Check if "Name 1" exists. If so, check "Name 2", etc.
        let counter = 1;
        let uniqueLabel = `${baseLabel} ${counter}`;
        const existingLabels = objects.map(o => o.label);
        
        while (existingLabels.includes(uniqueLabel)) {
            counter++;
            uniqueLabel = `${baseLabel} ${counter}`;
        }

        let centerX = (roomDimensions.width / 2) - (width / 2);
        let centerY = (roomDimensions.height / 2) - (height / 2);
        
        centerX = snap(centerX);
        centerY = snap(centerY);

        const newObj: LayoutObject = {
            id, 
            type, 
            x: centerX, 
            y: centerY, 
            width, 
            height, 
            rotation: 0, 
            label: uniqueLabel, // Assign the unique label here
            capacity, 
            loungeConfig, 
            gridConfig
        };

        if (type === 'table-rect') {
            newObj.seatsPerSide = { top: 2, bottom: 2, left: 1, right: 1 };
        }

        setObjects([...objects, newObj]);
        setSelectedObjectId(id);
        setIsDirty(true);
    };

    const duplicateObject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const original = objects.find(o => o.id === id);
        if (!original) return;

        const newId = `obj-${Date.now()}`;
        const newX = snap(original.x + GRID_SIZE); 
        const newY = snap(original.y + GRID_SIZE);

        // For duplication, we also want a unique name based on the original's base name
        const baseNameMatch = original.label?.match(/^(.*?)(\s\d+)?$/);
        const baseName = baseNameMatch ? baseNameMatch[1] : original.label || 'Object';
        
        let counter = 1;
        let uniqueLabel = `${baseName} ${counter}`;
        const existingLabels = objects.map(o => o.label);
        while (existingLabels.includes(uniqueLabel)) {
            counter++;
            uniqueLabel = `${baseName} ${counter}`;
        }

        const newObj: LayoutObject = {
            ...original,
            id: newId,
            x: newX,
            y: newY,
            label: uniqueLabel 
        };

        setObjects([...objects, newObj]);
        setSelectedObjectId(newId);
        setIsDirty(true);
    };

    const updateObject = (id: string, changes: Partial<LayoutObject>) => {
        setObjects(objects.map(o => o.id === id ? { ...o, ...changes } : o));
        setIsDirty(true);
    };

    const updateRectSeats = (id: string, side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
        const obj = objects.find(o => o.id === id);
        if (!obj || !obj.seatsPerSide) return;

        const newSeatsPerSide = { ...obj.seatsPerSide, [side]: Math.max(0, value) };
        const newCapacity = newSeatsPerSide.top + newSeatsPerSide.bottom + newSeatsPerSide.left + newSeatsPerSide.right;

        updateObject(id, { seatsPerSide: newSeatsPerSide, capacity: newCapacity });
    };

    // Helper to calculate lounge dimensions based on content
    const calculateLoungeDimensions = (config: any) => {
        const { tables, tableType, seatsPerSide, chairs } = config;
        const cols = Math.ceil(Math.sqrt(tables));
        const rows = Math.ceil(tables / cols);
        
        const TABLE_SPACING = 30; // Space between table units
        const CHAIR_FOOTPRINT = DEFAULT_CHAIR_SIZE + CHAIR_GAP;
        
        let cellWidth = 0;
        let cellHeight = 0;

        if (tableType === 'rect') {
            const top = seatsPerSide?.top || 0;
            const bottom = seatsPerSide?.bottom || 0;
            const left = seatsPerSide?.left || 0;
            const right = seatsPerSide?.right || 0;

            const maxHorzChairs = Math.max(top, bottom);
            const maxVertChairs = Math.max(left, right);
            
            const MIN_TABLE_SIZE = 40; 
            const reqTableW = Math.max(MIN_TABLE_SIZE, maxHorzChairs * CHAIR_FOOTPRINT - CHAIR_GAP);
            const reqTableH = Math.max(MIN_TABLE_SIZE, maxVertChairs * CHAIR_FOOTPRINT - CHAIR_GAP);

            // Cell Size = Center Table + Chairs on both sides + Internal Spacing
            cellWidth = reqTableW + (CHAIR_FOOTPRINT * 2) + TABLE_SPACING; 
            cellHeight = reqTableH + (CHAIR_FOOTPRINT * 2) + TABLE_SPACING;
        } else {
            // Round
            const chairsPerTable = Math.max(1, Math.floor(chairs / tables));
            // Approx circumference needed
            const perimeter = chairsPerTable * CHAIR_FOOTPRINT;
            const diameter = Math.max(40, perimeter / Math.PI);
            const dimension = diameter + (CHAIR_FOOTPRINT * 2) + TABLE_SPACING;
            cellWidth = dimension;
            cellHeight = dimension;
        }

        return {
            width: Math.ceil(cols * cellWidth + OBJ_PADDING),
            height: Math.ceil(rows * cellHeight + OBJ_PADDING)
        };
    };

    const updateLoungeConfig = (id: string, field: 'chairs' | 'tables' | 'tableType', value: any) => {
        const obj = objects.find(o => o.id === id);
        if (!obj || !obj.loungeConfig) return;
        
        const newConfig = { ...obj.loungeConfig, [field]: value };
        
        // If switching to rect, ensure seatsPerSide exists
        if (field === 'tableType' && value === 'rect' && !newConfig.seatsPerSide) {
            newConfig.seatsPerSide = { top: 1, bottom: 1, left: 1, right: 1 };
            // Update total chairs based on distribution * tables
            newConfig.chairs = (1 + 1 + 1 + 1) * newConfig.tables;
        }

        // Automatically resize the area
        const { width: neededWidth, height: neededHeight } = calculateLoungeDimensions(newConfig);
        const newWidth = Math.max(obj.width, neededWidth);
        const newHeight = Math.max(obj.height, neededHeight);

        updateObject(id, { loungeConfig: newConfig, width: newWidth, height: newHeight });
    };

    const updateLoungeSeats = (id: string, side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
        const obj = objects.find(o => o.id === id);
        if (!obj || !obj.loungeConfig) return;

        const currentSeats = obj.loungeConfig.seatsPerSide || { top: 1, bottom: 1, left: 1, right: 1 };
        const newSeats = { ...currentSeats, [side]: Math.max(0, value) };
        
        // Calculate new total chairs based on distribution per table * number of tables
        const chairsPerTable = newSeats.top + newSeats.bottom + newSeats.left + newSeats.right;
        const totalChairs = chairsPerTable * obj.loungeConfig.tables;

        const newConfig = { 
            ...obj.loungeConfig, 
            seatsPerSide: newSeats,
            chairs: totalChairs
        };

        // Resize area to fit new chair arrangement if needed
        const { width: neededWidth, height: neededHeight } = calculateLoungeDimensions(newConfig);
        const newWidth = Math.max(obj.width, neededWidth);
        const newHeight = Math.max(obj.height, neededHeight);

        updateObject(id, { loungeConfig: newConfig, width: newWidth, height: newHeight });
    };

    const updateGridConfig = (id: string, field: 'rows' | 'cols' | 'itemSize', value: number) => {
        const obj = objects.find(o => o.id === id);
        if (!obj || !obj.gridConfig) return;
        
        // Update the specific field
        const newConfig = { ...obj.gridConfig, [field]: Math.max(1, value) };
        
        // AUTO-RESIZE LOGIC FOR CHAIRS
        // Calculate new dimensions based on config: (cols * size) + gaps + padding
        const currentItemSize = newConfig.itemSize || DEFAULT_CHAIR_SIZE;
        const newWidth = (newConfig.cols * currentItemSize) + ((newConfig.cols - 1) * CHAIR_GAP) + OBJ_PADDING;
        const newHeight = (newConfig.rows * currentItemSize) + ((newConfig.rows - 1) * CHAIR_GAP) + OBJ_PADDING;

        updateObject(id, { gridConfig: newConfig, width: newWidth, height: newHeight });
    };

    // Calculate new columns based on total and current rows to maintain grid structure
    const handleTotalChairsChange = (newTotal: number) => {
        if (!selectedObjectId) return;
        const obj = objects.find(o => o.id === selectedObjectId);
        if (!obj || !obj.gridConfig) return;
        
        const rows = obj.gridConfig.rows;
        // Calculate needed columns. Ensure at least 1.
        // We grow columns (width) as we add more chairs
        const newCols = Math.max(1, Math.ceil(newTotal / rows));
        
        updateGridConfig(selectedObjectId, 'cols', newCols);
    };

    const deleteObject = () => {
        if (selectedObjectId) {
            setObjects(objects.filter(o => o.id !== selectedObjectId));
            setSelectedObjectId(null);
            setIsDirty(true);
        }
    };

    const handleRoomDimensionChange = (newDims: { width: number, height: number }) => {
        setRoomDimensions(newDims);
        setIsDirty(true);
    };

    // --- MOUSE HANDLERS ---
    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        setSelectedObjectId(id);
        setIsDragging(true);
        const obj = objects.find(o => o.id === id);
        if (obj) {
            setDragOffset({
                x: e.clientX - obj.x * zoom,
                y: e.clientY - obj.y * zoom
            });
        }
    };

    const handleResizeStart = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.preventDefault();
        const obj = objects.find(o => o.id === id);
        if (obj) {
            setResizingState({
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                startW: obj.width,
                startH: obj.height,
                ratio: obj.width / obj.height
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (resizingState && selectedObjectId) {
            const currentObj = objects.find(o => o.id === selectedObjectId);
            if (!currentObj) return;

            // Block dragging resize for chairs because properties control it precisely
            if (currentObj.type === 'chair') return;

            const deltaX = (e.clientX - resizingState.startX) / zoom;
            const deltaY = (e.clientY - resizingState.startY) / zoom;
            
            let newW = resizingState.startW + deltaX;
            let newH = resizingState.startH + deltaY;

            if (currentObj.type === 'table-round') {
                const size = Math.max(newW, newH);
                newW = size;
                newH = size;
            } else if (e.shiftKey) {
                newH = newW / resizingState.ratio;
            }

            if (snapToGrid && !e.shiftKey && currentObj.type !== 'table-round') {
                newW = Math.round(newW / GRID_SIZE) * GRID_SIZE;
                newH = Math.round(newH / GRID_SIZE) * GRID_SIZE;
            } else if (snapToGrid && currentObj.type === 'table-round') {
                 const snapped = Math.round(newW / GRID_SIZE) * GRID_SIZE;
                 newW = snapped;
                 newH = snapped;
            }

            newW = Math.max(GRID_SIZE, newW);
            newH = Math.max(GRID_SIZE, newH);

            updateObject(selectedObjectId, { width: Math.round(newW), height: Math.round(newH) });
            return;
        }

        if (isDragging && selectedObjectId && !resizingState) {
            let newX = (e.clientX - dragOffset.x) / zoom;
            let newY = (e.clientY - dragOffset.y) / zoom;
            
            if (snapToGrid) {
                newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
                newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            }

            updateObject(selectedObjectId, { x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setResizingState(null);
    };

    // --- VISUAL RENDERING ---

    const renderLoungeContents = (obj: LayoutObject) => {
        if (obj.type !== 'lounge-area' || !obj.loungeConfig) return null;
        const { chairs, tables, tableType, seatsPerSide } = obj.loungeConfig;
        if (tables === 0) return null;

        const tableElements = [];
        
        // Calculate automatic chairs only if not using specific rect distribution
        const baseChairsPerTable = Math.floor(chairs / tables);
        const remainder = chairs % tables;

        const cols = Math.ceil(Math.sqrt(tables));
        const rows = Math.ceil(tables / cols);
        
        const cellW = obj.width / cols;
        const cellH = obj.height / rows;

        const minDimension = Math.min(cellW, cellH);
        const baseTableSize = Math.max(20, minDimension * 0.3); // Renamed to baseTableSize
        const chairSize = Math.max(16, minDimension * 0.25); 
        const gap = 2;

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
                    tableChairs.push(<div key={`c-${i}-${c}`} className="absolute rounded-full bg-indigo-300 border border-indigo-500 shadow-sm" style={{ width: chairSize, height: chairSize, left: chairX, top: chairY }} />);
                }
                
                tableElements.push(
                    <React.Fragment key={`tbl-${i}`}>
                        <div className="absolute bg-white border-2 border-slate-400 rounded-full" style={{ width: baseTableSize, height: baseTableSize, left: cx - (baseTableSize/2), top: cy - (baseTableSize/2) }} />
                        {tableChairs}
                    </React.Fragment>
                );

            } else {
                // RECTANGULAR TABLE DYNAMIC SIZING
                let nTop, nBottom, nLeft, nRight;

                // Use explicit configuration if available, otherwise fallback to auto distribution
                if (seatsPerSide) {
                    nTop = seatsPerSide.top;
                    nBottom = seatsPerSide.bottom;
                    nLeft = seatsPerSide.left;
                    nRight = seatsPerSide.right;
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

                // DYNAMIC RESIZING LOGIC
                // Calculate required width based on top/bottom chairs
                const maxHorizontalChairs = Math.max(nTop, nBottom);
                const reqWidthForChairs = maxHorizontalChairs * (chairSize + gap) - gap;
                // Determine actual table dimensions. Minimum is baseTableSize, expand if chairs need more space.
                // We add a tiny bit of extra width/height relative to chairs so they sit nicely.
                const actualTableWidth = Math.max(baseTableSize, reqWidthForChairs);
                
                const maxVerticalChairs = Math.max(nLeft, nRight);
                const reqHeightForChairs = maxVerticalChairs * (chairSize + gap) - gap;
                const actualTableHeight = Math.max(baseTableSize, reqHeightForChairs);

                const pushChair = (k: number, x: number, y: number) => {
                    tableChairs.push(<div key={`c-${i}-${x}-${y}`} className="absolute rounded-sm bg-indigo-300 border border-indigo-500 shadow-sm" style={{ left: x, top: y, width: chairSize, height: chairSize }} />);
                };
                
                // Top Chairs
                for (let k = 0; k < nTop; k++) {
                    const groupWidth = (nTop * chairSize) + ((nTop - 1) * gap);
                    const startX = cx - (groupWidth / 2);
                    const x = startX + (k * (chairSize + gap));
                    // Position relative to the DYNAMIC table height
                    const y = cy - (actualTableHeight / 2) - chairSize - gap;
                    pushChair(k, x, y);
                }
                // Bottom Chairs
                for (let k = 0; k < nBottom; k++) {
                    const groupWidth = (nBottom * chairSize) + ((nBottom - 1) * gap);
                    const startX = cx - (groupWidth / 2);
                    const x = startX + (k * (chairSize + gap));
                    const y = cy + (actualTableHeight / 2) + gap;
                    pushChair(k, x, y);
                }
                // Left Chairs
                for (let k = 0; k < nLeft; k++) {
                    const groupHeight = (nLeft * chairSize) + ((nLeft - 1) * gap);
                    const startY = cy - (groupHeight / 2);
                    const y = startY + (k * (chairSize + gap));
                    // Position relative to the DYNAMIC table width
                    const x = cx - (actualTableWidth / 2) - chairSize - gap;
                    pushChair(k, x, y);
                }
                // Right Chairs
                for (let k = 0; k < nRight; k++) {
                    const groupHeight = (nRight * chairSize) + ((nRight - 1) * gap);
                    const startY = cy - (groupHeight / 2);
                    const y = startY + (k * (chairSize + gap));
                    const x = cx + (actualTableWidth / 2) + gap;
                    pushChair(k, x, y);
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
        return <div className="absolute inset-0 pointer-events-none">{tableElements}</div>;
    };

    const renderObjectVisuals = (obj: LayoutObject, isSelected: boolean) => {
        // --- IMPROVED CHAIR GRID VISUALIZATION ---
        if (obj.type === 'chair' && obj.gridConfig) {
            const { rows, cols, itemSize } = obj.gridConfig;
            const currentItemSize = itemSize || DEFAULT_CHAIR_SIZE;
            const seats = [];
            
            // Loop through grid config to render visual chairs
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const left = (c * (currentItemSize + CHAIR_GAP)) + (OBJ_PADDING / 2);
                    const top = (r * (currentItemSize + CHAIR_GAP)) + (OBJ_PADDING / 2);
                    
                    seats.push(
                        <div 
                            key={`${r}-${c}`}
                            className="absolute bg-white border border-slate-400 rounded-sm shadow-sm"
                            style={{
                                width: currentItemSize,
                                height: currentItemSize,
                                left: left,
                                top: top
                            }}
                        >
                            {/* Decorative Backrest line to make it look like a chair */}
                            <div className="w-full h-1.5 bg-slate-200 border-b border-slate-300 rounded-t-sm absolute top-0"></div>
                        </div>
                    );
                }
            }
            
            return (
                <div 
                    className={`w-full h-full relative overflow-visible ${isSelected ? 'border-2 border-dashed border-indigo-500 bg-indigo-50/10' : 'border border-transparent hover:border-slate-300'}`}
                >
                    {seats}
                    
                    {/* Label Overlay for Chair Grid */}
                    <div className="pointer-events-none flex flex-col items-center justify-center w-full h-full p-1 absolute inset-0 z-20">
                        <span 
                            className="font-bold text-center leading-none"
                            style={{
                                fontSize: `${Math.max(10, 12 / zoom)}px`,
                                textShadow: '0 0 3px rgba(255, 255, 255, 0.9)',
                                color: 'black'
                            }}
                        >
                            {obj.label}
                        </span>
                    </div>
                </div>
            );
        }

        // --- STANDARD RENDERING ---
        return (
            <div className={`w-full h-full border-2 flex items-center justify-center relative text-xs text-center font-semibold overflow-visible
                ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-slate-400 hover:border-indigo-300'}
                ${obj.type === 'table-round' ? 'rounded-full bg-slate-100' : ''}
                ${obj.type === 'table-rect' ? 'rounded-md bg-slate-100' : ''}
                ${obj.type === 'dance-floor' ? 'bg-indigo-50 border-dashed rounded-none' : ''}
                ${obj.type === 'stage' ? 'bg-slate-800 text-white rounded-sm' : ''}
                ${obj.type === 'sofa' ? 'bg-slate-200 rounded-xl' : ''}
                ${obj.type === 'decor' ? 'bg-pink-50 border-pink-200 text-pink-500 rounded-full' : ''}
                ${obj.type === 'photo-booth' ? 'bg-purple-100 border-purple-300 text-purple-700' : ''}
                ${obj.type === 'photo-set' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                ${obj.type === 'led-screen' ? 'bg-black border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : ''}
                ${obj.type === 'lounge-area' ? 'bg-slate-100/50 border-slate-300 border-dashed rounded-lg' : ''}
            `}>
                <div className="pointer-events-none flex flex-col items-center justify-center w-full h-full p-1 absolute inset-0 z-20">
                    {obj.type === 'decor' && <Sparkles size={obj.width/2} />}
                    {obj.type === 'photo-booth' && <Camera size={24} />}
                    {obj.type === 'photo-set' && <ImageIcon size={24} />}
                    {obj.type === 'led-screen' && <Monitor size={20} />}
                    
                    {/* Render label for all standard objects, including lounge-area */}
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

                {isSelected && (
                    <div className="absolute -top-6 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-50 print-hidden">
                        {obj.label} {obj.capacity ? `(${obj.capacity} seats)` : ''} {obj.width}x{obj.height}
                    </div>
                )}
                
                {renderChairs(obj)}
                {renderLoungeContents(obj)}

                {isSelected && (
                    <>
                        <div 
                            className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-slate-300 rounded-full cursor-pointer hover:bg-indigo-50 shadow-md z-50 flex items-center justify-center print-hidden"
                            onMouseDown={(e) => duplicateObject(e, obj.id)}
                            title="Duplicate Object"
                        >
                            <Copy size={12} className="text-slate-600"/>
                        </div>
                        <div 
                            className="absolute -bottom-8 left-1/2 -ml-3 w-6 h-6 bg-white border border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-50 shadow-sm z-50 print-hidden"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                updateObject(obj.id, { rotation: (obj.rotation + 45) % 360 });
                            }}
                        >
                            <RotateCw size={12} className="text-slate-600"/>
                        </div>
                        
                        {/* Only show resize handle for non-chair-grid objects */}
                        {obj.type !== 'chair' && (
                            <div 
                                className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize shadow-md z-50 flex items-center justify-center print-hidden"
                                onMouseDown={(e) => handleResizeStart(e, obj.id)}
                                title="Drag to resize"
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
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
                chairs.push(<div key={i} className="absolute w-5 h-5 bg-slate-300 border border-slate-500 rounded-full" style={{ left: chairX, top: chairY }} />);
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
            for (let i = 0; i < nTop; i++) {
                const leftPos = (obj.width / (nTop + 1)) * (i + 1) - 10;
                chairs.push(<div key={`t-${i}`} className="absolute w-5 h-5 bg-slate-300 border border-slate-500 rounded-sm" style={{ left: leftPos, top: -25 }} />);
            }
            for (let i = 0; i < nBottom; i++) {
                const leftPos = (obj.width / (nBottom + 1)) * (i + 1) - 10;
                chairs.push(<div key={`b-${i}`} className="absolute w-5 h-5 bg-slate-300 border border-slate-500 rounded-sm" style={{ left: leftPos, top: obj.height + 5 }} />);
            }
            for (let i = 0; i < nLeft; i++) {
                const topPos = (obj.height / (nLeft + 1)) * (i + 1) - 10;
                chairs.push(<div key={`l-${i}`} className="absolute w-5 h-5 bg-slate-300 border border-slate-500 rounded-sm" style={{ left: -25, top: topPos }} />);
            }
             for (let i = 0; i < nRight; i++) {
                const topPos = (obj.height / (nRight + 1)) * (i + 1) - 10;
                chairs.push(<div key={`r-${i}`} className="absolute w-5 h-5 bg-slate-300 border border-slate-500 rounded-sm" style={{ left: obj.width + 5, top: topPos }} />);
            }
        }
        return chairs;
    };

    if (loading || !event) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Venue...</div>;

    const activeLocation = event.locations.find(l => l.id === activeLocationId) || event.locations[0];
    const activeObject = objects.find(o => o.id === selectedObjectId);

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
            {/* ... styles omitted for brevity ... */}
            <style>{`@media print { @page { size: landscape; margin: 0; } body * { visibility: hidden; } body, html, #root { width: 100%; height: 100%; overflow: visible !important; } .print-visible, .print-visible * { visibility: visible; } .print-visible { position: absolute !important; left: 0 !important; top: 0 !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; z-index: 99999 !important; overflow: visible !important; background: white !important; display: block !important; } .print-scale-reset { position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) scale(0.65) !important; transform-origin: center center !important; box-shadow: none !important; border: 1px solid #ccc !important; } .print-hidden { display: none !important; } }`}</style>

            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30 print-hidden">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {event.name}
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wide">VENUE</span>
                            {isDirty && <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">Unsaved Changes</span>}
                        </h1>
                        <p className="text-xs text-slate-400">Design Mode</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {event.locations.map(loc => (
                        <button key={loc.id} onClick={() => handleLocationChange(loc.id)} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${activeLocationId === loc.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            <MapPin size={12} /> {loc.name}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-3">
                    {/* ADDED: Total Seats Counter */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
                        <Users size={16} /> Total Seats: <span className="text-lg leading-none">{totalCapacity}</span>
                    </div>
                    
                    <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <Printer size={18} /> Print / PDF
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-70">
                        <Save size={18} /> {saving ? 'Saving...' : 'Save Layout'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ... (rest of sidebar code remains the same) ... */}
                <div className="w-24 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center py-4 gap-2 z-20 overflow-y-auto overflow-x-hidden custom-scrollbar print-hidden">
                    <ToolbarItem icon={<Circle size={24}/>} label="Round Table" onClick={() => addObject('table-round')} />
                    <ToolbarItem icon={<Square size={24}/>} label="Rect Table" onClick={() => addObject('table-rect')} />
                    <ToolbarItem icon={<Armchair size={24}/>} label="Chair" onClick={() => addObject('chair')} />
                    <ToolbarItem icon={<Coffee size={24}/>} label="Area Lounge" onClick={() => addObject('lounge-area')} />
                    <ToolbarItem icon={<LayoutTemplate size={24}/>} label="Sofa" onClick={() => addObject('sofa')} />
                    <div className="h-px w-10 bg-slate-200 dark:bg-slate-700 my-1 shrink-0"></div>
                    <ToolbarItem icon={<Grid size={24}/>} label="Dance Floor" onClick={() => addObject('dance-floor')} />
                    <ToolbarItem icon={<Monitor size={24}/>} label="LED Screen" onClick={() => addObject('led-screen')} />
                    <ToolbarItem icon={<Users size={24}/>} label="Stage" onClick={() => addObject('stage')} />
                    <div className="h-px w-10 bg-slate-200 dark:bg-slate-700 my-1 shrink-0"></div>
                    <ToolbarItem icon={<Sparkles size={24}/>} label="Decor" onClick={() => addObject('decor')} />
                    <ToolbarItem icon={<Camera size={24}/>} label="Photo Booth" onClick={() => addObject('photo-booth')} />
                    <ToolbarItem icon={<ImageIcon size={24}/>} label="Photo Set" onClick={() => addObject('photo-set')} />
                </div>

                <div ref={containerRef} className="flex-1 bg-slate-200 dark:bg-black/20 overflow-hidden relative print-visible" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                    <div className="absolute top-4 right-4 flex bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 z-20 print-hidden items-center p-1">
                        <button onClick={() => setSnapToGrid(!snapToGrid)} className={`p-2 rounded-md transition-colors mr-2 ${snapToGrid ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`} title={snapToGrid ? "Snap to Grid On" : "Snap to Grid Off"}>
                            <Magnet size={16} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mr-2"></div>
                        <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded"><ZoomOut size={16}/></button>
                        <span className="px-2 flex items-center text-xs font-mono text-slate-500 w-10 justify-center">{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded"><ZoomIn size={16}/></button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2"></div>
                        <button onClick={handleFitZoom} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 rounded flex items-center gap-1" title="Fit to Screen"><Scan size={16} /> <span className="text-xs font-semibold">Fit</span></button>
                    </div>

                    <div ref={canvasRef} className="absolute inset-0 overflow-auto flex items-center justify-center p-20 cursor-grab active:cursor-grabbing print-visible">
                         <div className="bg-white relative shadow-2xl transition-transform origin-center print-scale-reset" style={{ width: roomDimensions.width, height: roomDimensions.height, transform: `scale(${zoom})`, backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} onMouseDown={(e) => { e.stopPropagation(); setSelectedObjectId(null); }}>
                            <div className="absolute -top-6 left-0 text-xs text-slate-500 font-mono print-hidden">Width: {roomDimensions.width}</div>
                            <div className="absolute -left-20 top-0 h-full flex items-center text-xs text-slate-500 font-mono print-hidden"><span className="-rotate-90">Height: {roomDimensions.height}</span></div>
                            {objects.map(obj => (
                                <div key={obj.id} onMouseDown={(e) => handleMouseDown(e, obj.id)} className={`absolute group cursor-move select-none ${selectedObjectId === obj.id ? 'z-50' : 'z-10'}`} style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, transform: `rotate(${obj.rotation}deg)` }}>
                                    {renderObjectVisuals(obj, selectedObjectId === obj.id)}
                                </div>
                            ))}
                         </div>
                    </div>
                </div>

                {/* Properties Panel (remains mostly same, just ensuring imports and layout) */}
                <div className="w-64 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto print-hidden">
                    <h3 className="font-bold text-slate-700 dark:text-white text-sm uppercase mb-4">Properties</h3>
                    {!activeObject && (
                        <div className="space-y-4 animate-fade-in mb-6">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-2">Room Dimensions</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Width</label><input type="number" step="100" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs outline-none" value={roomDimensions.width} onChange={(e) => handleRoomDimensionChange({...roomDimensions, width: parseInt(e.target.value) || 1000})} /></div>
                                    <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Height</label><input type="number" step="100" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1.5 text-xs outline-none" value={roomDimensions.height} onChange={(e) => handleRoomDimensionChange({...roomDimensions, height: parseInt(e.target.value) || 1000})} /></div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeObject ? (
                        <div className="space-y-4 animate-fade-in">
                            <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Label</label><input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none" value={activeObject.label} onChange={(e) => updateObject(activeObject.id, { label: e.target.value })} /></div>
                            
                            {(activeObject.type === 'table-round') && (
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Seats (Capacity)</label><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none" value={activeObject.capacity || 0} onChange={(e) => updateObject(activeObject.id, { capacity: parseInt(e.target.value) })} /></div>
                            )}

                            {(activeObject.type === 'chair' && activeObject.gridConfig) && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2"><Grid size={12}/> Chair Seating</h4>
                                    
                                    <div className="mb-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Seats</label>
                                            <span className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded font-mono">
                                                {activeObject.gridConfig.rows}R × {activeObject.gridConfig.cols}C
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => {
                                                    const currentTotal = activeObject.gridConfig!.rows * activeObject.gridConfig!.cols;
                                                    handleTotalChairsChange(currentTotal - 1);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                            >
                                                <Minus size={14}/>
                                            </button>
                                            <div className="flex-1 relative">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    className="w-full text-center font-bold text-xl bg-transparent border-b-2 border-slate-100 dark:border-slate-700 focus:border-indigo-500 py-1 outline-none text-slate-800 dark:text-white transition-colors"
                                                    value={activeObject.gridConfig.rows * activeObject.gridConfig.cols}
                                                    onChange={(e) => handleTotalChairsChange(parseInt(e.target.value) || 1)}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const currentTotal = activeObject.gridConfig!.rows * activeObject.gridConfig!.cols;
                                                    handleTotalChairsChange(currentTotal + 1);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                            >
                                                <Plus size={14}/>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rows</label><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.gridConfig.rows} onChange={(e) => updateGridConfig(activeObject.id, 'rows', parseInt(e.target.value) || 1)} /></div>
                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cols</label><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.gridConfig.cols} onChange={(e) => updateGridConfig(activeObject.id, 'cols', parseInt(e.target.value) || 1)} /></div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1"><Scaling size={10}/> Seat Size (px)</label>
                                        <input type="number" min="10" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.gridConfig.itemSize || DEFAULT_CHAIR_SIZE} onChange={(e) => updateGridConfig(activeObject.id, 'itemSize', parseInt(e.target.value) || DEFAULT_CHAIR_SIZE)} />
                                    </div>

                                    <p className="text-[9px] text-slate-400 mt-2 italic">Area expands automatically.</p>
                                </div>
                            )}

                            {(activeObject.type === 'lounge-area' && activeObject.loungeConfig) && (
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                    <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2"><Coffee size={12}/> Lounge Furniture</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Table Type</label>
                                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.loungeConfig.tableType || 'rect'} onChange={(e) => updateLoungeConfig(activeObject.id, 'tableType', e.target.value)}>
                                                <option value="rect">Square/Rectangular</option>
                                                <option value="round">Round</option>
                                            </select>
                                        </div>
                                        
                                        {activeObject.loungeConfig.tableType === 'rect' ? (
                                            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2 text-center">Chair Distribution (Per Table)</label>
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-1"><input type="number" min="0" className="w-10 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.loungeConfig.seatsPerSide?.top ?? 0} onChange={(e) => updateLoungeSeats(activeObject.id, 'top', parseInt(e.target.value))} /></div>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" min="0" className="w-10 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.loungeConfig.seatsPerSide?.left ?? 0} onChange={(e) => updateLoungeSeats(activeObject.id, 'left', parseInt(e.target.value))} />
                                                        <div className="w-14 h-10 bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded flex items-center justify-center"><span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{(activeObject.loungeConfig.seatsPerSide?.top || 0) + (activeObject.loungeConfig.seatsPerSide?.bottom || 0) + (activeObject.loungeConfig.seatsPerSide?.left || 0) + (activeObject.loungeConfig.seatsPerSide?.right || 0)}</span></div>
                                                        <input type="number" min="0" className="w-10 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.loungeConfig.seatsPerSide?.right ?? 0} onChange={(e) => updateLoungeSeats(activeObject.id, 'right', parseInt(e.target.value))} />
                                                    </div>
                                                    <div className="flex items-center gap-1"><input type="number" min="0" className="w-10 text-center text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.loungeConfig.seatsPerSide?.bottom ?? 0} onChange={(e) => updateLoungeSeats(activeObject.id, 'bottom', parseInt(e.target.value))} /></div>
                                                </div>
                                                <div className="mt-2 text-center text-[10px] text-slate-400">Total Chairs: <span className="font-bold text-indigo-600">{activeObject.loungeConfig.chairs}</span></div>
                                            </div>
                                        ) : (
                                            <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Chairs / Sofas</label><input type="number" min="0" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.loungeConfig.chairs} onChange={(e) => updateLoungeConfig(activeObject.id, 'chairs', parseInt(e.target.value) || 0)} /></div>
                                        )}

                                        <div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Number of Tables</label><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-xs outline-none" value={activeObject.loungeConfig.tables} onChange={(e) => updateLoungeConfig(activeObject.id, 'tables', parseInt(e.target.value) || 1)} /></div>
                                        <p className="text-[9px] text-slate-400 italic">Area auto-resizes to fit furniture.</p>
                                    </div>
                                </div>
                            )}

                            {(activeObject.type === 'table-rect') && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2 text-center">Chair Distribution</label>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-1"><input type="number" min="0" className="w-10 text-center text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.seatsPerSide?.top ?? 0} onChange={(e) => updateRectSeats(activeObject.id, 'top', parseInt(e.target.value))} /></div>
                                        <div className="flex items-center gap-2">
                                            <input type="number" min="0" className="w-10 text-center text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.seatsPerSide?.left ?? 0} onChange={(e) => updateRectSeats(activeObject.id, 'left', parseInt(e.target.value))} />
                                            <div className="w-20 h-14 bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 rounded flex items-center justify-center"><span className="text-xs font-bold text-slate-600 dark:text-slate-300">{activeObject.capacity}</span></div>
                                            <input type="number" min="0" className="w-10 text-center text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.seatsPerSide?.right ?? 0} onChange={(e) => updateRectSeats(activeObject.id, 'right', parseInt(e.target.value))} />
                                        </div>
                                        <div className="flex items-center gap-1"><input type="number" min="0" className="w-10 text-center text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1" value={activeObject.seatsPerSide?.bottom ?? 0} onChange={(e) => updateRectSeats(activeObject.id, 'bottom', parseInt(e.target.value))} /></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Width</label><input type="number" className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none ${activeObject.type === 'chair' ? 'opacity-50 cursor-not-allowed' : ''}`} readOnly={activeObject.type === 'chair'} value={activeObject.width} onChange={(e) => { const val = parseInt(e.target.value); if(activeObject.type === 'table-round') { updateObject(activeObject.id, { width: val, height: val }); } else { updateObject(activeObject.id, { width: val }); } }} /></div>
                                <div><label className="text-xs font-bold text-slate-500 uppercase block mb-1">Height</label><input type="number" className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm outline-none ${activeObject.type === 'chair' ? 'opacity-50 cursor-not-allowed' : ''}`} readOnly={activeObject.type === 'chair'} value={activeObject.height} onChange={(e) => { const val = parseInt(e.target.value); if(activeObject.type === 'table-round') { updateObject(activeObject.id, { height: val, width: val }); } else { updateObject(activeObject.id, { height: val }); } }} /></div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Rotation</label>
                                <div className="flex items-center gap-2"><input type="range" min="0" max="360" step="15" className="flex-1 accent-indigo-600" value={activeObject.rotation} onChange={(e) => updateObject(activeObject.id, { rotation: parseInt(e.target.value) })} /><span className="text-xs font-mono w-8">{activeObject.rotation}°</span></div>
                            </div>

                            <button onClick={(e) => duplicateObject(e, activeObject.id)} className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-200 p-2 rounded hover:bg-indigo-100 transition-colors text-sm font-medium mt-3"><Copy size={16} /> Duplicate Object</button>
                            <hr className="border-slate-100 dark:border-slate-800 my-3"/>
                            <button onClick={deleteObject} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 p-2 rounded hover:bg-red-100 transition-colors text-sm font-medium"><Trash2 size={16} /> Delete Object</button>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-10 text-sm"><Move size={32} className="mx-auto mb-2 opacity-50"/>Select an object on the canvas to edit its properties.</div>
                    )}
                </div>
            </div>

            {showExitDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500"><AlertTriangle size={24} /></div><h3 className="font-bold text-lg text-slate-800 dark:text-white">Cambios sin guardar</h3></div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Tienes cambios pendientes en tu diseño. ¿Deseas salir sin guardar los cambios?</p>
                        <div className="flex gap-3 justify-end"><button onClick={cancelExit} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">No, quedarse</button><button onClick={confirmExit} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition-colors">Sí, salir sin guardar</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ToolbarItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center w-full p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all group">
        <div className="mb-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{icon}</div>
        <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
    </button>
);

export default VenueDesigner;