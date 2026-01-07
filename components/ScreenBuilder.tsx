
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WelcomeScreenDesign, CanvasElement, PartnerAsset, User, ElementType, ElementStateProps } from '../types';
import { getWelcomeDesign, updateWelcomeDesign, getAssets, createAsset } from '../services/mockBackend';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon, Type, Trash2, Plus, X, Layers, Settings, ZoomIn, ZoomOut, Scan, Video, Images, Palette, Check, CloudUpload, Link2, MoveHorizontal, MoveVertical, MoveDiagonal, Eye, EyeOff, ArrowUp, ArrowDown, Lock, Unlock, Play, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Minus, MonitorPlay, UserCheck, RefreshCcw, Square, Clock, Film, Maximize, ArrowRight, Grid, Sparkles, Shuffle, Star, ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';

const FONT_FAMILIES = [
    { name: 'Inter (Default)', value: 'Inter, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Serif', value: 'Georgia, serif' },
    { name: 'Mono', value: 'Courier New, monospace' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Comic', value: '"Comic Sans MS", cursive' },
    { name: 'Lobster', value: '"Lobster", cursive' }, 
    { name: 'Cursive', value: 'cursive' }
];

// Enhanced Animation Styles including Gallery Transitions
const ANIMATION_STYLES = `
  /* ENTRY */
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .anim-entry-fade-in { animation: fadeIn 0.8s ease-out forwards; }

  @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .anim-entry-slide-up { animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes slideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .anim-entry-slide-down { animation: slideDown 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .anim-entry-pop-in { animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

  @keyframes blurIn { from { filter: blur(10px); opacity: 0; transform: scale(1.1); } to { filter: blur(0); opacity: 1; transform: scale(1); } }
  .anim-entry-blur-in { animation: blurIn 1s ease-out forwards; }
  
  @keyframes elasticRight { from { transform: translateX(-100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .anim-entry-elastic-right { animation: elasticRight 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }

  /* EXIT */
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  .anim-exit-fade-out { animation: fadeOut 0.8s ease-in forwards; }

  @keyframes slideDownOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(50px); opacity: 0; } }
  .anim-exit-slide-down-out { animation: slideDownOut 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes slideUpOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-50px); opacity: 0; } }
  .anim-exit-slide-up-out { animation: slideUpOut 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes popOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.5); opacity: 0; } }
  .anim-exit-pop-out { animation: popOut 0.6s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes blurOut { from { filter: blur(0); opacity: 1; transform: scale(1); } to { filter: blur(10px); opacity: 0; transform: scale(1.1); } }
  .anim-exit-blur-out { animation: blurOut 0.8s ease-in forwards; }

  /* GALLERY TRANSITIONS (ENTRY) */
  @keyframes galFade { from { opacity: 0; } to { opacity: 1; } }
  .gal-trans-fade { animation: galFade 1.2s ease-in-out forwards; }

  @keyframes galSlideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .gal-trans-slide-left { animation: galSlideLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  .gal-trans-slide-up { animation: galSlideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galZoom { from { transform: scale(1.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .gal-trans-zoom { animation: galZoom 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galBlur { from { filter: blur(15px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
  .gal-trans-blur { animation: galBlur 1.2s ease-out forwards; }

  @keyframes galFlip { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }
  .gal-trans-flip { animation: galFlip 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; backface-visibility: hidden; }

  /* GALLERY TRANSITIONS (EXIT) - Used for the image being replaced */
  @keyframes galFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .gal-exit-fade { animation: galFadeOut 1.2s ease-in-out forwards; }

  @keyframes galSlideLeftOut { from { transform: translateX(0); } to { transform: translateX(-100%); } }
  .gal-exit-slide-left { animation: galSlideLeftOut 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galSlideUpOut { from { transform: translateY(0); } to { transform: translateY(-100%); } }
  .gal-exit-slide-up { animation: galSlideUpOut 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galZoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.8); opacity: 0; } }
  .gal-exit-zoom { animation: galZoomOut 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

  @keyframes galBlurOut { from { filter: blur(0); opacity: 1; } to { filter: blur(15px); opacity: 0; } }
  .gal-exit-blur { animation: galBlurOut 1.2s ease-out forwards; }

  @keyframes galFlipOut { from { transform: rotateY(0); opacity: 1; } to { transform: rotateY(-90deg); opacity: 0; } }
  .gal-exit-flip { animation: galFlipOut 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; backface-visibility: hidden; }
`;

const ScreenBuilder: React.FC<{ user: User }> = ({ user }) => {
    const { designId } = useParams();
    const navigate = useNavigate();
    const [design, setDesign] = useState<WelcomeScreenDesign | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Layout State
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
    const [rightSidebarWidth, setRightSidebarWidth] = useState(300);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [isResizingRight, setIsResizingRight] = useState(false);

    // Canvas Interaction State
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(0.5);
    const viewportRef = useRef<HTMLDivElement>(null);
    
    // SCREEN STATE: Idle (Loop) vs Info (Welcome Guest)
    const [viewMode, setViewMode] = useState<'idle' | 'info'>('idle');
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    
    // Preview Timer Reference
    const previewTimerRef = useRef<any>(null);
    // Slideshow Interval Reference (for galleries)
    const slideshowIntervalRef = useRef<any>(null);
    const [slideshowIndices, setSlideshowIndices] = useState<Record<string, number>>({});

    // Drag & Resize State
    const [interactionState, setInteractionState] = useState<{
        mode: 'moving' | 'resizing',
        elementId: string,
        startX: number,
        startY: number,
        initialX: number,
        initialY: number,
        initialWidth: number,
        initialHeight: number,
        handle?: 'e' | 's' | 'se'
    } | null>(null);

    // Asset State & Upload
    const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
    const [activeAssetType, setActiveAssetType] = useState<'image' | 'video' | 'gallery' | null>(null);
    const [targetGalleryId, setTargetGalleryId] = useState<string | null>(null); // NEW: Track if adding to a gallery
    const [partnerAssets, setPartnerAssets] = useState<PartnerAsset[]>([]);
    const [newAssetUrl, setNewAssetUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const assetFileInputRef = useRef<HTMLInputElement>(null);
    
    // Colors
    const [bgColors, setBgColors] = useState(['#ffffff', '#000000', '#1f2937', '#fee2e2', '#e0e7ff', '#dcfce7']);

    // Derived active partner ID
    const activePartnerId = user.role === 'SUPER_ADMIN' ? 'p1' : (user.partnerIds?.[0] || 'p1');

    useEffect(() => {
        if (designId) {
            getWelcomeDesign(designId).then(d => {
                if (d) {
                    let safeRes = { ...d.resolution };
                    if (d.orientation === 'landscape' && safeRes.height > safeRes.width) {
                        const temp = safeRes.width; safeRes.width = safeRes.height; safeRes.height = temp;
                    } else if (d.orientation === 'portrait' && safeRes.width > safeRes.height) {
                        const temp = safeRes.width; safeRes.width = safeRes.height; safeRes.height = temp;
                    }

                    const fixedDesign = { ...d, resolution: safeRes, guestDisplayDuration: d.guestDisplayDuration || 10 };
                    setDesign(fixedDesign);
                    setElements(d.elements || []);
                    if (d.background && !bgColors.includes(d.background)) {
                        setBgColors(prev => [...prev, d.background]);
                    }
                    setTimeout(() => handleFitZoom(safeRes), 200);
                }
                setLoading(false);
            });
        }
    }, [designId]);

    // Auto-fit Zoom when layout (sidebar width) changes
    useEffect(() => {
        if (!loading && design) {
            const timer = setTimeout(() => {
                handleFitZoom();
            }, 50); 
            return () => clearTimeout(timer);
        }
    }, [leftSidebarWidth, rightSidebarWidth, design?.resolution, loading]);

    // HELPER: Get current visible properties based on View Mode
    const getRenderProps = (el: CanvasElement) => {
        if (viewMode === 'idle') {
            return { 
                x: el.x, y: el.y, width: el.width, height: el.height, visible: el.visible, styles: el.styles, animationEntry: 'none', animationExit: 'none',
                galleryImages: el.galleryImages, galleryDuration: el.galleryDuration, galleryFit: el.galleryFit, galleryAlignment: el.galleryAlignment, galleryTransitionType: el.galleryTransitionType,
                galleryGuestImageIndex: el.galleryGuestImageIndex, galleryGuestImageHiddenInIdle: el.galleryGuestImageHiddenInIdle
            };
        } else {
            // In Info mode, fall back to base props if no override exists
            return {
                x: el.infoState?.x ?? el.x,
                y: el.infoState?.y ?? el.y,
                width: el.infoState?.width ?? el.width,
                height: el.infoState?.height ?? el.height,
                visible: el.infoState?.visible ?? el.visible,
                styles: el.infoState?.styles ?? el.styles,
                animationEntry: el.infoState?.animationEntry || 'none',
                animationExit: el.infoState?.animationExit || 'none',
                galleryImages: el.infoState?.galleryImages ?? el.galleryImages,
                galleryDuration: el.infoState?.galleryDuration ?? el.galleryDuration,
                galleryFit: el.infoState?.galleryFit ?? el.galleryFit,
                galleryAlignment: el.infoState?.galleryAlignment ?? el.galleryAlignment,
                galleryTransitionType: el.infoState?.galleryTransitionType ?? el.galleryTransitionType,
                galleryGuestImageIndex: el.infoState?.galleryGuestImageIndex ?? el.galleryGuestImageIndex,
                galleryGuestImageHiddenInIdle: el.infoState?.galleryGuestImageHiddenInIdle ?? el.galleryGuestImageHiddenInIdle
            };
        }
    };

    // Global Mouse Events for Dragging/Resizing/Layout
    useEffect(() => {
        if (isPreviewing) return; // Disable interactions during preview

        const handleGlobalMouseMove = (e: MouseEvent) => {
            // 1. Handle Sidebar Resizing
            if (isResizingLeft) {
                const newWidth = e.clientX;
                if (newWidth > 180 && newWidth < 500) setLeftSidebarWidth(newWidth);
                return;
            }
            if (isResizingRight) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 240 && newWidth < 600) setRightSidebarWidth(newWidth);
                return;
            }

            // 2. Handle Canvas Element Interaction
            if (interactionState && design) {
                const deltaX = (e.clientX - interactionState.startX) / zoom;
                const deltaY = (e.clientY - interactionState.startY) / zoom;

                if (interactionState.mode === 'moving') {
                    const newX = interactionState.initialX + deltaX;
                    const newY = interactionState.initialY + deltaY;
                    
                    const snappedX = Math.round(newX / 10) * 10;
                    const snappedY = Math.round(newY / 10) * 10;

                    updateElement(interactionState.elementId, { x: snappedX, y: snappedY });
                } else if (interactionState.mode === 'resizing') {
                    let newW = interactionState.initialWidth;
                    let newH = interactionState.initialHeight;
                    const el = elements.find(el => el.id === interactionState.elementId);
                    const aspectRatio = interactionState.initialWidth / interactionState.initialHeight;

                    if (interactionState.handle === 'e' || interactionState.handle === 'se') {
                        newW = Math.max(20, interactionState.initialWidth + deltaX);
                    }
                    if (interactionState.handle === 's' || interactionState.handle === 'se') {
                        newH = Math.max(20, interactionState.initialHeight + deltaY);
                    }

                    // Respect Aspect Ratio Lock
                    if (el?.lockAspectRatio) {
                         if (interactionState.handle === 'e') {
                             newH = newW / aspectRatio;
                         } else if (interactionState.handle === 's') {
                             newW = newH * aspectRatio;
                         } else if (interactionState.handle === 'se') {
                             if (Math.abs(deltaX) > Math.abs(deltaY)) {
                                 newH = newW / aspectRatio;
                             } else {
                                 newW = newH * aspectRatio;
                             }
                         }
                    }

                    updateElement(interactionState.elementId, { 
                        width: Math.round(newW), 
                        height: Math.round(newH) 
                    });
                }
            }
        };

        const handleGlobalMouseUp = () => {
            setIsResizingLeft(false);
            setIsResizingRight(false);
            setInteractionState(null);
        };

        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isResizingLeft, isResizingRight, interactionState, zoom, elements, design, viewMode, isPreviewing]); 

    // Load assets when picker opens
    useEffect(() => {
        if (isAssetPickerOpen) {
            // If adding to gallery, targetGalleryId is set, fetch images. 
            // If activeAssetType is set, fetch that type.
            const typeToFetch = activeAssetType === 'gallery' ? 'image' : (activeAssetType || 'image');
            getAssets(activePartnerId, typeToFetch as any).then(setPartnerAssets);
        }
    }, [isAssetPickerOpen, activeAssetType, activePartnerId, targetGalleryId]);

    const handleSave = async () => {
        if (!design) return;
        setSaving(true);
        try {
            await updateWelcomeDesign(design.id, {
                elements: elements,
                background: design.background,
                resolution: design.resolution,
                guestDisplayDuration: design.guestDisplayDuration 
            });
            alert("Screen design saved!");
        } catch (err) {
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const handleFitZoom = (res?: {width: number, height: number}) => {
        const resolution = res || design?.resolution;
        if (!resolution || !viewportRef.current) return;
        
        const { clientWidth, clientHeight } = viewportRef.current;
        const PADDING = 100;
        
        const scaleX = (clientWidth - PADDING) / resolution.width;
        const scaleY = (clientHeight - PADDING) / resolution.height;
        const newZoom = Math.min(scaleX, scaleY);
        setZoom(Math.max(0.1, Math.min(newZoom, 1.2))); 
    };

    // --- PREVIEW LOGIC (ENHANCED) ---
    const handlePreview = () => {
        // Cleanup existing timer if any
        if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
            previewTimerRef.current = null;
        }
        if (slideshowIntervalRef.current) {
            clearInterval(slideshowIntervalRef.current);
            slideshowIntervalRef.current = null;
        }

        if (isPreviewing) {
            setIsPreviewing(false);
            setViewMode('idle'); 
            setIsExiting(false);
            return;
        }

        setSelectedElementId(null); 
        setIsPreviewing(true);
        setViewMode('idle'); 
        setIsExiting(false);

        // START SLIDESHOW CYCLE (Global Tick)
        slideshowIntervalRef.current = setInterval(() => {
            // Global tick - placeholder for advanced logic if needed
        }, 1000); 

        // Start per-gallery intervals
        const galleryIntervals: any[] = [];
        elements.forEach(el => {
            if (el.type === 'gallery') {
                const props = getRenderProps(el);
                const duration = (props.galleryDuration || 3) * 1000;
                
                // Effective images logic inside the interval (since props can change on view switch)
                const interval = setInterval(() => {
                    // Check current view mode inside interval via a ref or by updating state carefully
                    // NOTE: This simple interval logic works for preview, but real robust logic would check `viewMode` state
                    // inside the callback. Since `viewMode` is state, we need to access current value.
                    // For simplicity in this mock, we just increment counter blindly, and the Render logic filters images.
                    setSlideshowIndices(prev => ({
                        ...prev,
                        [el.id]: ((prev[el.id] || 0) + 1)
                    }));
                }, duration);
                galleryIntervals.push(interval);
            }
        });
        
        // Store interval cleanups in ref to clear later
        const clearGalleryIntervals = () => galleryIntervals.forEach(clearInterval);


        // SEQUENCE LOGIC
        previewTimerRef.current = setTimeout(() => {
            // STEP 2: Switch to Guest Info
            setViewMode('info');

            const guestDuration = (design?.guestDisplayDuration || 10) * 1000;
            const exitAnimationTime = 1000;

            previewTimerRef.current = setTimeout(() => {
                setIsExiting(true);

                previewTimerRef.current = setTimeout(() => {
                    setViewMode('idle');
                    setIsExiting(false);

                    previewTimerRef.current = setTimeout(() => {
                        setIsPreviewing(false);
                        clearGalleryIntervals(); // Clean up gallery timers
                        if(slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current);
                    }, 5000);

                }, exitAnimationTime);

            }, guestDuration);

        }, 5000);
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
            if (slideshowIntervalRef.current) clearInterval(slideshowIntervalRef.current);
        };
    }, []);

    // --- INTERACTION HANDLERS ---

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        if (isPreviewing) return;
        e.stopPropagation();
        e.preventDefault();
        setSelectedElementId(id);
        
        const el = elements.find(e => e.id === id);
        if (!el) return;

        const props = getRenderProps(el);

        setInteractionState({
            mode: 'moving',
            elementId: id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: props.x,
            initialY: props.y,
            initialWidth: props.width,
            initialHeight: props.height
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent, id: string, handle: 'e' | 's' | 'se') => {
        if (isPreviewing) return;
        e.stopPropagation();
        e.preventDefault();
        const el = elements.find(e => e.id === id);
        if (!el) return;

        const props = getRenderProps(el);

        setInteractionState({
            mode: 'resizing',
            elementId: id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: props.x,
            initialY: props.y,
            initialWidth: props.width,
            initialHeight: props.height,
            handle
        });
    };

    // --- CANVAS ELEMENTS MANAGEMENT ---

    const addElement = (type: ElementType, content: string = '', name: string = '', w?: number, h?: number, x?: number, y?: number) => {
        const newEl: CanvasElement = {
            id: `el-${Date.now()}`,
            type,
            content: content || (type === 'text' ? 'Double Click to Edit' : ''),
            name: name || type.charAt(0).toUpperCase() + type.slice(1),
            x: x !== undefined ? x : 100, 
            y: y !== undefined ? y : 100,
            width: w || (type === 'text' ? 400 : 300),
            height: h || (type === 'text' ? 100 : 200),
            zIndex: elements.length,
            visible: true,
            lockAspectRatio: type === 'image' || type === 'video',
            galleryImages: type === 'gallery' ? [] : undefined,
            galleryDuration: 3,
            galleryFit: 'cover',
            galleryAlignment: { vertical: 'center', horizontal: 'center' },
            galleryTransitionType: 'fade', 
            galleryGuestImageIndex: undefined,
            galleryGuestImageHiddenInIdle: false,
            styles: { 
                color: '#000000', 
                fontSize: 60, 
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                fontWeight: 'normal',
                fontStyle: 'normal',
                textDecoration: 'none',
                strokeWidth: 0,
                strokeColor: '#000000',
                shadowColor: '#000000',
                shadowBlur: 0
            }
        };
        setElements([...elements, newEl]);
        setSelectedElementId(newEl.id);
        setIsAssetPickerOpen(false);
        setTargetGalleryId(null);
    };

    // CORE UPDATE LOGIC
    const updateElement = (id: string, updates: Partial<CanvasElement> | Partial<ElementStateProps>) => {
        setElements(prevElements => prevElements.map(el => {
            if (el.id !== id) return el;

            // Helper to get effective dimensions for ratio locking
            const currentProps = getRenderProps(el);
            
            // Handle Aspect Ratio Lock (Generalized)
            if (el.lockAspectRatio && ((updates as any).width !== undefined || (updates as any).height !== undefined)) {
                const ratio = currentProps.width / currentProps.height;
                if ((updates as any).width !== undefined && (updates as any).height === undefined) {
                    (updates as any).height = Math.round((updates as any).width / ratio);
                } else if ((updates as any).height !== undefined && (updates as any).width === undefined) {
                    (updates as any).width = Math.round((updates as any).height * ratio);
                }
            }

            if (viewMode === 'idle') {
                return { ...el, ...updates };
            } else {
                const newInfoState = { 
                    ...(el.infoState || { // Initialize with current idle props if undefined
                        x: el.x, y: el.y, width: el.width, height: el.height, visible: el.visible, styles: el.styles, animationEntry: 'none', animationExit: 'none',
                        galleryImages: el.galleryImages, galleryDuration: el.galleryDuration, galleryFit: el.galleryFit, galleryAlignment: el.galleryAlignment, galleryTransitionType: el.galleryTransitionType,
                        galleryGuestImageIndex: el.galleryGuestImageIndex, galleryGuestImageHiddenInIdle: el.galleryGuestImageHiddenInIdle
                    }), 
                    ...updates 
                };
                
                return { ...el, infoState: newInfoState };
            }
        }));
    };

    // Separate function to update "shared" props regardless of view mode (like Content)
    const updateSharedProp = (id: string, updates: Partial<CanvasElement>) => {
        setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElement = (id: string) => {
        setElements(elements.filter(el => el.id !== id));
        setSelectedElementId(null);
    };

    const moveLayer = (index: number, direction: 'up' | 'down') => {
        const newElements = [...elements];
        if (direction === 'up' && index < newElements.length - 1) {
            [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
        } else if (direction === 'down' && index > 0) {
            [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]];
        }
        const updatedZ = newElements.map((el, i) => ({ ...el, zIndex: i }));
        setElements(updatedZ);
    };

    const handleAssetSelect = (asset: PartnerAsset) => {
        if (!design) return;
        
        // SPECIAL CASE: Adding images to an existing gallery
        if (targetGalleryId) {
            const el = elements.find(e => e.id === targetGalleryId);
            if (el && el.type === 'gallery') {
                const currentImages = el.galleryImages || [];
                // Update shared prop
                updateSharedProp(targetGalleryId, { galleryImages: [...currentImages, asset.url] });
            }
            setIsAssetPickerOpen(false);
            setTargetGalleryId(null);
            return;
        }

        const canvasW = design.resolution.width;
        const canvasH = design.resolution.height;
        const canvasAspect = canvasW / canvasH;

        const handleMedia = (mediaWidth: number, mediaHeight: number) => {
             const mediaAspect = mediaWidth / mediaHeight;
             if (Math.abs(mediaAspect - canvasAspect) < 0.05 || (mediaWidth === canvasW && mediaHeight === canvasH)) {
                 addElement(asset.type as ElementType, asset.url, asset.name, canvasW, canvasH, 0, 0);
             } else {
                 const maxInitWidth = canvasW * 0.6;
                 let finalWidth = mediaWidth || 300;
                 let finalHeight = mediaHeight || 200;
                 if (finalWidth > maxInitWidth) {
                     const ratio = finalWidth / finalHeight;
                     finalWidth = maxInitWidth;
                     finalHeight = maxInitWidth / ratio;
                 }
                 const x = (canvasW - finalWidth) / 2;
                 const y = (canvasH - finalHeight) / 2;
                 addElement(asset.type as ElementType, asset.url, asset.name, Math.round(finalWidth), Math.round(finalHeight), Math.round(x), Math.round(y));
             }
        }

        if (asset.type === 'image') {
            const img = new Image();
            img.src = asset.url;
            img.onload = () => handleMedia(img.naturalWidth, img.naturalHeight);
            img.onerror = () => addElement(asset.type as ElementType, asset.url, asset.name, 400, 300);
        } else if (asset.type === 'video') {
            const video = document.createElement('video');
            video.src = asset.url;
            video.onloadedmetadata = () => handleMedia(video.videoWidth, video.videoHeight);
            video.onerror = () => addElement(asset.type as ElementType, asset.url, asset.name, 400, 225);
        } else {
            addElement(asset.type as ElementType, asset.url, asset.name);
        }
    };

    // --- GALLERY MANAGEMENT FUNCTIONS ---
    
    // Move Image in Gallery
    const moveGalleryImage = (elementId: string, index: number, direction: 'left' | 'right') => {
        const el = elements.find(e => e.id === elementId);
        if (!el || !el.galleryImages) return;
        
        const images = [...el.galleryImages];
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        
        if (newIndex < 0 || newIndex >= images.length) return;
        
        // Swap
        [images[index], images[newIndex]] = [images[newIndex], images[index]];
        
        // Handle Guest Index Tracking
        let newGuestIndex = el.galleryGuestImageIndex;
        if (el.galleryGuestImageIndex === index) newGuestIndex = newIndex;
        else if (el.galleryGuestImageIndex === newIndex) newGuestIndex = index;

        updateSharedProp(elementId, { galleryImages: images, galleryGuestImageIndex: newGuestIndex });
    };

    // Shuffle Gallery
    const shuffleGalleryImages = (elementId: string) => {
        const el = elements.find(e => e.id === elementId);
        if (!el || !el.galleryImages) return;

        let images = [...el.galleryImages];
        let guestImage = el.galleryGuestImageIndex !== undefined ? images[el.galleryGuestImageIndex] : null;

        // Fisher-Yates Shuffle
        for (let i = images.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [images[i], images[j]] = [images[j], images[i]];
        }

        // Find new index of guest image if set
        let newGuestIndex = undefined;
        if (guestImage) {
            newGuestIndex = images.indexOf(guestImage);
        }

        updateSharedProp(elementId, { galleryImages: images, galleryGuestImageIndex: newGuestIndex });
    };

    // --- ASSET UPLOAD LOGIC ---
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setIsUploading(true); setUploadProgress(0);
        const totalFiles = files.length;
        const uploadedAssets: PartnerAsset[] = [];
        
        // Determine type based on context
        let typeToUpload = activeAssetType;
        if (targetGalleryId) typeToUpload = 'image';
        else if (activeAssetType === 'gallery') typeToUpload = 'image';

        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            if (typeToUpload === 'image' && !file.type.startsWith('image/')) continue;
            if (typeToUpload === 'video' && !file.type.startsWith('video/')) continue;
            try {
                let url = '';
                if (typeToUpload === 'video') url = URL.createObjectURL(file);
                else {
                    url = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });
                }
                const newAsset = await createAsset({ partnerId: activePartnerId, type: typeToUpload as any, name: file.name.split('.')[0], url: url });
                uploadedAssets.push(newAsset);
                setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
            } catch (err) { console.error("Error uploading file:", file.name, err); }
        }
        setPartnerAssets(prev => [...uploadedAssets, ...prev]); setIsUploading(false); setUploadProgress(0); if (assetFileInputRef.current) assetFileInputRef.current.value = '';
    };

    const handleUploadUrl = async () => {
        if (!newAssetUrl || (!activeAssetType && !targetGalleryId)) return;
        setIsUploading(true); setUploadProgress(0); 
        
        let typeToUpload = activeAssetType;
        if (targetGalleryId) typeToUpload = 'image';
        else if (activeAssetType === 'gallery') typeToUpload = 'image';

        const interval = setInterval(() => { setUploadProgress(prev => (prev >= 95 ? 95 : prev + 5)); }, 100);
        try { await new Promise(resolve => setTimeout(resolve, 1000)); const newAsset = await createAsset({ partnerId: activePartnerId, type: typeToUpload as any, name: `External ${typeToUpload}`, url: newAssetUrl }); setUploadProgress(100); clearInterval(interval); setPartnerAssets(prev => [newAsset, ...prev]); setNewAssetUrl(''); } catch (e) { console.error(e); alert("Failed to add URL asset."); } finally { setIsUploading(false); setUploadProgress(0); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading Screen Builder...</div>;
    if (!design) return <div className="flex h-screen items-center justify-center text-red-500">Design not found.</div>;

    const resolution = design.resolution;

    // Helper to add Guest Placeholders
    const addPlaceholder = (placeholder: string) => {
        addElement('text', placeholder, placeholder.replace(/[{}]/g, ''), 600, 100, (resolution.width - 600)/2, (resolution.height - 100)/2);
    };

    // Find props for selected element to display in Properties panel
    const selectedElement = elements.find(e => e.id === selectedElementId);
    const selectedProps = selectedElement ? getRenderProps(selectedElement) : null;

    return (
        <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden select-none">
            {/* INJECT ANIMATION STYLES */}
            <style>{ANIMATION_STYLES}</style>

            {/* Header */}
            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/screens')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {design.name}
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-wide">SCREEN</span>
                        </h1>
                        <p className="text-xs text-slate-400 capitalize">{design.orientation} • {resolution.width} x {resolution.height}px</p>
                    </div>
                </div>
                
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md shadow-indigo-500/20 disabled:opacity-70 font-medium">
                    <Save size={18} /> {saving ? 'Saving...' : 'Save Design'}
                </button>
            </div>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden relative">
                
                {/* LEFT SIDEBAR (Layers & Tools) */}
                <div style={{ width: leftSidebarWidth }} className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 relative transition-colors">
                    {/* View Mode Switcher */}
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode('idle')}
                                disabled={isPreviewing}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-lg transition-all ${viewMode === 'idle' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} ${isPreviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <MonitorPlay size={14}/> Idle Loop
                            </button>
                            <button 
                                onClick={() => setViewMode('info')}
                                disabled={isPreviewing}
                                className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2 rounded-lg transition-all ${viewMode === 'info' ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} ${isPreviewing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <UserCheck size={14}/> Guest Info
                            </button>
                        </div>
                        <div className={`mt-2 text-[10px] text-center px-2 py-1 rounded border ${viewMode === 'idle' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                            {viewMode === 'idle' ? 'Editing default repeating content.' : 'Editing Welcome/Notification overlay.'}
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className={`p-4 grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 ${isPreviewing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button onClick={() => addElement('text')} className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition-all text-slate-500" title="Add Text"><Type size={18}/></button>
                        <button onClick={() => { setActiveAssetType('image'); setIsAssetPickerOpen(true); }} className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-pink-500 hover:text-pink-600 transition-all text-slate-500" title="Add Image"><ImageIcon size={18}/></button>
                        <button onClick={() => { setActiveAssetType('video'); setIsAssetPickerOpen(true); }} className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 transition-all text-slate-500" title="Add Video"><Video size={18}/></button>
                        <button onClick={() => addElement('gallery', 'Gallery')} className="aspect-square flex flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition-all text-slate-500" title="Add Gallery"><Images size={18}/></button>
                    </div>

                    {/* Guest Placeholders */}
                    <div className={`p-4 border-b border-slate-200 dark:border-slate-800 ${isPreviewing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Guest Data</h4>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => addPlaceholder('{GuestName}')} className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs text-slate-600 hover:text-emerald-700 transition-colors text-left truncate">+ Name</button>
                            <button onClick={() => addPlaceholder('{TableName}')} className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs text-slate-600 hover:text-emerald-700 transition-colors text-left truncate">+ Table</button>
                            <button onClick={() => addPlaceholder('{SeatNumber}')} className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs text-slate-600 hover:text-emerald-700 transition-colors text-left truncate">+ Seat</button>
                            <button onClick={() => addPlaceholder('{Location}')} className="px-2 py-1.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-lg text-xs text-slate-600 hover:text-emerald-700 transition-colors text-left truncate">+ Location</button>
                        </div>
                    </div>

                    {/* Layer List */}
                    <div className={`flex-1 overflow-y-auto p-2 ${isPreviewing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 px-2 flex items-center gap-2 mt-2"><Layers size={12}/> Layers</h3>
                        <div className="space-y-1">
                            {[...elements].reverse().map((el, i) => {
                                const realIndex = elements.length - 1 - i;
                                const renderProps = getRenderProps(el);
                                const isHiddenInCurrentView = !renderProps.visible;
                                
                                return (
                                    <div key={el.id} onClick={() => setSelectedElementId(el.id)} className={`p-2 rounded-lg text-xs flex justify-between items-center cursor-pointer border transition-all ${selectedElementId === el.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 shadow-sm' : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300'} ${isHiddenInCurrentView ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center gap-2 truncate">
                                            {el.type === 'text' && <Type size={12} className="text-indigo-500"/>}
                                            {el.type === 'image' && <ImageIcon size={12} className="text-pink-500"/>}
                                            {el.type === 'video' && <Video size={12} className="text-purple-500"/>}
                                            {el.type === 'gallery' && <Images size={12} className="text-emerald-500"/>}
                                            <span className={`truncate max-w-[80px] ${selectedElementId === el.id ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}>{el.name}</span>
                                            {viewMode === 'info' && el.infoState && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" title="Has Guest Info override"></div>}
                                        </div>
                                        <div className="flex gap-1 opacity-50 hover:opacity-100">
                                            <button onClick={(e) => { e.stopPropagation(); moveLayer(realIndex, 'up'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><ArrowUp size={10}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); moveLayer(realIndex, 'down'); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"><ArrowDown size={10}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !renderProps.visible }); }} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">{renderProps.visible ? <Eye size={10}/> : <EyeOff size={10}/>}</button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={10}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resizer Handle */}
                    <div 
                        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 z-50 transition-colors"
                        onMouseDown={() => setIsResizingLeft(true)}
                    />
                </div>

                {/* CENTER CANVAS */}
                <div className={`flex-1 bg-slate-200 dark:bg-black/20 relative overflow-hidden flex flex-col min-w-0 transition-colors ${viewMode === 'info' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                    
                    {/* Toolbar / Zoom */}
                    <div className="h-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0">
                        <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                            {viewMode === 'idle' ? <MonitorPlay size={14}/> : <UserCheck size={14}/>}
                            {viewMode === 'idle' ? 'WORKSPACE: IDLE LOOP' : 'WORKSPACE: GUEST WELCOME'}
                        </div>
                        <div className="flex items-center gap-2">
                            
                            {/* PLAY BUTTON (SIMULATE) */}
                            <button 
                                onClick={handlePreview}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-md border ${isPreviewing ? 'bg-red-100 text-red-600 border-red-200' : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-indigo-500/20'}`}
                            >
                                {isPreviewing ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                                {isPreviewing ? 'Stop Preview' : 'Preview'}
                            </button>

                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>

                            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-0.5 border border-slate-200 dark:border-slate-700">
                                <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><ZoomOut size={14}/></button>
                                <span className="px-2 text-xs font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
                                <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><ZoomIn size={14}/></button>
                                <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                <button onClick={() => handleFitZoom()} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded flex items-center gap-1" title="Fit Screen"><Scan size={14} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Viewport */}
                    <div ref={viewportRef} className="flex-1 overflow-auto flex items-center justify-center p-10 relative" onClick={() => !isPreviewing && setSelectedElementId(null)}>
                        <div 
                            className={`bg-white shadow-2xl transition-transform origin-center relative flex-shrink-0 ${viewMode === 'info' && !isPreviewing ? 'ring-4 ring-emerald-500/20' : ''}`}
                            style={{ 
                                width: resolution.width, 
                                height: resolution.height, 
                                transform: `scale(${zoom})`,
                                backgroundColor: design.background
                            }}
                        >
                            {elements.map((el) => {
                                const props = getRenderProps(el);
                                // IMPORTANT CHANGE: We no longer hide elements via return null.
                                // Instead, we use Opacity to allow CSS transitions between Idle and Info states.
                                
                                const isSelected = selectedElementId === el.id && !isPreviewing;
                                const isInteractingWithThis = interactionState?.elementId === el.id;
                                
                                // Determine Animation Class (Entry or Exit based on state)
                                let animationClass = '';
                                if (viewMode === 'info') {
                                    if (isExiting && props.animationExit && props.animationExit !== 'none') {
                                        animationClass = `anim-exit-${props.animationExit}`;
                                    } else if (!isExiting && props.animationEntry && props.animationEntry !== 'none') {
                                        animationClass = `anim-entry-${props.animationEntry}`;
                                    }
                                }

                                // Calculate Visibility Style (Opacity)
                                // In Preview: if visible=false -> opacity 0
                                // In Editor: if visible=false -> opacity 0.3 (ghosted)
                                const isVisible = props.visible;
                                const opacity = isPreviewing ? (isVisible ? 1 : 0) : (isVisible ? 1 : 0.3);
                                const pointerEvents = isPreviewing && !isVisible ? 'none' : 'auto';

                                return (
                                    <div 
                                        key={el.id}
                                        onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                                        onClick={(e) => e.stopPropagation()} 
                                        style={{ 
                                            position: 'absolute', 
                                            left: props.x, 
                                            top: props.y, 
                                            width: props.width, 
                                            height: props.height,
                                            zIndex: el.zIndex,
                                            opacity: opacity,
                                            pointerEvents: pointerEvents as any,
                                            // CHANGED: Enable transitions in Editor mode (except when dragging this specific element)
                                            transition: isInteractingWithThis ? 'none' : 'all 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
                                        }}
                                        className={`group absolute ${!isPreviewing ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-indigo-500 z-50' : !isPreviewing ? 'hover:ring-1 hover:ring-indigo-300' : ''} ${animationClass}`}
                                    >
                                        {/* Content Render */}
                                        {el.type === 'text' && (
                                            <div 
                                                className="w-full h-full p-2 break-words pointer-events-none flex items-center" 
                                                style={{ 
                                                    color: props.styles?.color as string, 
                                                    fontSize: `${props.styles?.fontSize || 40}px`,
                                                    fontFamily: props.styles?.fontFamily as string,
                                                    fontWeight: props.styles?.fontWeight as any,
                                                    fontStyle: props.styles?.fontStyle as any,
                                                    textDecoration: props.styles?.textDecoration as string,
                                                    textAlign: props.styles?.textAlign as any,
                                                    justifyContent: props.styles?.textAlign === 'center' ? 'center' : props.styles?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                                    WebkitTextStroke: props.styles?.strokeWidth ? `${props.styles.strokeWidth}px ${props.styles.strokeColor}` : 'none',
                                                    paintOrder: 'stroke fill',
                                                    textShadow: props.styles?.shadowBlur ? `2px 2px ${props.styles.shadowBlur}px ${props.styles.shadowColor || 'rgba(0,0,0,0.5)'}` : 'none',
                                                    whiteSpace: 'pre-wrap', 
                                                    lineHeight: '1.2'
                                                }}
                                            >
                                                {el.content}
                                            </div>
                                        )}
                                        {el.type === 'image' && (
                                            <img src={el.content} className="w-full h-full object-cover pointer-events-none" alt="" />
                                        )}
                                        {el.type === 'video' && (
                                            <div className="w-full h-full bg-black relative flex items-center justify-center pointer-events-none overflow-hidden">
                                                <video src={el.content} className="w-full h-full object-cover opacity-80" autoPlay loop muted />
                                            </div>
                                        )}
                                        {el.type === 'gallery' && (
                                            <div 
                                                className="w-full h-full relative overflow-hidden flex pointer-events-none" 
                                                style={{ 
                                                    backgroundColor: props.galleryImages && props.galleryImages.length > 0 ? 'transparent' : '#f1f5f9',
                                                    alignItems: props.galleryAlignment?.vertical === 'top' ? 'flex-start' : props.galleryAlignment?.vertical === 'bottom' ? 'flex-end' : 'center',
                                                    justifyContent: props.galleryAlignment?.horizontal === 'left' ? 'flex-start' : props.galleryAlignment?.horizontal === 'right' ? 'flex-end' : 'center',
                                                }}
                                            >
                                                {(!props.galleryImages || props.galleryImages.length === 0) ? (
                                                    <div className="flex flex-col items-center justify-center w-full h-full text-slate-400 border-2 border-dashed border-slate-300">
                                                        <Images size={32} />
                                                        <span className="text-xs font-bold mt-2">Empty Gallery</span>
                                                    </div>
                                                ) : (
                                                    // Gallery Image Logic with Dual-Image Transitions
                                                    (() => {
                                                        const rawImages = props.galleryImages || [];
                                                        
                                                        // Filter images for Idle mode logic
                                                        let displayImages = rawImages;
                                                        if (viewMode === 'idle' && props.galleryGuestImageHiddenInIdle && props.galleryGuestImageIndex !== undefined) {
                                                            displayImages = rawImages.filter((_, idx) => idx !== props.galleryGuestImageIndex);
                                                        }
                                                        
                                                        if (displayImages.length === 0) return null;

                                                        if (viewMode === 'info' && props.galleryGuestImageIndex !== undefined) {
                                                            // In GUEST mode with specific image: Static render
                                                            const currentSrc = rawImages[props.galleryGuestImageIndex] || rawImages[0];
                                                            return (
                                                                <img 
                                                                    src={currentSrc} 
                                                                    alt="Guest Welcome" 
                                                                    className={`w-full h-full`}
                                                                    style={{ 
                                                                        objectFit: props.galleryFit === 'fill' ? 'fill' : props.galleryFit === 'contain' ? 'contain' : 'cover',
                                                                    }} 
                                                                />
                                                            );
                                                        }

                                                        // SLIDESHOW MODE (Idle loop or Preview)
                                                        const activeIndex = isPreviewing ? (slideshowIndices[el.id] || 0) : 0;
                                                        const safeCurrentIndex = activeIndex % displayImages.length;
                                                        const safePrevIndex = (safeCurrentIndex - 1 + displayImages.length) % displayImages.length;
                                                        
                                                        const currentSrc = displayImages[safeCurrentIndex];
                                                        const prevSrc = displayImages[safePrevIndex];
                                                        
                                                        const transitionType = props.galleryTransitionType || 'fade';
                                                        const entryClass = isPreviewing && transitionType !== 'none' ? `gal-trans-${transitionType}` : '';
                                                        const exitClass = isPreviewing && transitionType !== 'none' ? `gal-exit-${transitionType}` : '';

                                                        // If only 1 image, just render it static
                                                        if (displayImages.length === 1) {
                                                            return (
                                                                <img 
                                                                    src={currentSrc} 
                                                                    className="w-full h-full"
                                                                    style={{ objectFit: props.galleryFit === 'fill' ? 'fill' : props.galleryFit === 'contain' ? 'contain' : 'cover' }}
                                                                />
                                                            );
                                                        }

                                                        // RENDER TWO IMAGES FOR SMOOTH TRANSITION
                                                        return (
                                                            <div className="relative w-full h-full overflow-hidden">
                                                                {/* Previous Image (Exiting) - Render underneath */}
                                                                {isPreviewing && (
                                                                    <img 
                                                                        key={`prev-${el.id}-${safePrevIndex}`}
                                                                        src={prevSrc}
                                                                        alt=""
                                                                        className={`absolute inset-0 w-full h-full ${exitClass}`}
                                                                        style={{ 
                                                                            objectFit: props.galleryFit === 'fill' ? 'fill' : props.galleryFit === 'contain' ? 'contain' : 'cover',
                                                                            zIndex: 1
                                                                        }} 
                                                                    />
                                                                )}

                                                                {/* Current Image (Entering) - Render on top */}
                                                                <img 
                                                                    key={`curr-${el.id}-${safeCurrentIndex}`}
                                                                    src={currentSrc}
                                                                    alt=""
                                                                    className={`absolute inset-0 w-full h-full ${entryClass}`}
                                                                    style={{ 
                                                                        objectFit: props.galleryFit === 'fill' ? 'fill' : props.galleryFit === 'contain' ? 'contain' : 'cover',
                                                                        zIndex: 2
                                                                    }} 
                                                                />
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        )}

                                        {/* Selection Handles */}
                                        {isSelected && (
                                            <>
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'e')} className="absolute top-1/2 -right-1.5 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-ew-resize -mt-1.5 z-50" />
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 's')} className="absolute -bottom-1.5 left-1/2 w-3 h-3 bg-white border border-indigo-500 rounded-full cursor-ns-resize -ml-1.5 z-50" />
                                                <div onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-indigo-500 border border-white rounded-full cursor-nwse-resize z-50" />
                                            </>
                                        )}
                                        {viewMode === 'info' && el.infoState && !isPreviewing && (
                                            <div className="absolute top-0 right-0 bg-emerald-500 w-2 h-2 rounded-bl-sm pointer-events-none" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR (Properties) */}
                <div style={{ width: rightSidebarWidth }} className={`bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 relative transition-colors ${isPreviewing ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Resizer Handle */}
                    <div 
                        className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 z-50 transition-colors"
                        onMouseDown={() => setIsResizingRight(true)}
                    />

                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><Settings size={14}/> Properties</h3>
                        {viewMode === 'info' && selectedElementId && elements.find(e => e.id === selectedElementId)?.infoState && (
                            <button 
                                onClick={() => {
                                    if(window.confirm("Reset this element's specific Guest Welcome properties to match Idle Loop?")) {
                                        const newElements = elements.map(el => el.id === selectedElementId ? { ...el, infoState: undefined } : el);
                                        setElements(newElements);
                                    }
                                }}
                                className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                <RefreshCcw size={10} /> Reset Override
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {selectedElementId && selectedProps ? (
                            <div className="space-y-4 animate-fade-in">
                                {viewMode === 'info' && (
                                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2 rounded text-xs mb-2">
                                        Editing properties for <strong>Guest Welcome Mode</strong>. These changes will only appear when a guest scans in.
                                    </div>
                                )}

                                {/* GALLERY SPECIFIC PROPERTIES */}
                                {elements.find(e => e.id === selectedElementId)?.type === 'gallery' && (
                                    <>
                                        <button 
                                            onClick={() => updateElement(selectedElementId, { x: 0, y: 0, width: design.resolution.width, height: design.resolution.height })}
                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition shadow-sm text-xs font-bold"
                                        >
                                            <Maximize size={14} /> Fit to Screen
                                        </button>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Images</label>
                                                <div className="flex gap-1">
                                                    <button onClick={() => shuffleGalleryImages(selectedElementId)} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-1 transition-colors" title="Shuffle Images"><Shuffle size={10}/></button>
                                                    <button 
                                                        onClick={() => { setTargetGalleryId(selectedElementId); setIsAssetPickerOpen(true); setActiveAssetType('image'); }}
                                                        className="text-[10px] bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 flex items-center gap-1 shadow-sm shadow-indigo-500/20 transition-all font-bold"
                                                    >
                                                        <Plus size={10}/> Add
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                {selectedProps.galleryImages?.map((img, idx) => (
                                                    <div key={idx} className={`relative aspect-square rounded overflow-hidden group border ${selectedProps.galleryGuestImageIndex === idx ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-slate-200 dark:border-slate-700'}`}>
                                                        <img src={img} className="w-full h-full object-cover" />
                                                        
                                                        {/* Reorder Controls */}
                                                        <div className="absolute top-0 inset-x-0 flex justify-between p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                                            <button onClick={() => moveGalleryImage(selectedElementId, idx, 'left')} className="p-0.5 bg-black/50 text-white rounded hover:bg-black/70 disabled:opacity-30" disabled={idx === 0}><ChevronLeft size={10}/></button>
                                                            <button onClick={() => moveGalleryImage(selectedElementId, idx, 'right')} className="p-0.5 bg-black/50 text-white rounded hover:bg-black/70 disabled:opacity-30" disabled={idx === (selectedProps.galleryImages?.length || 0) - 1}><ChevronRight size={10}/></button>
                                                        </div>

                                                        {/* Delete Overlay */}
                                                        <button 
                                                            onClick={() => {
                                                                const newImages = selectedProps.galleryImages?.filter((_, i) => i !== idx);
                                                                // Adjust guest image index if needed
                                                                let newGuestIndex = selectedProps.galleryGuestImageIndex;
                                                                if (newGuestIndex === idx) newGuestIndex = undefined;
                                                                else if (newGuestIndex !== undefined && newGuestIndex > idx) newGuestIndex--;
                                                                
                                                                updateSharedProp(selectedElementId, { galleryImages: newImages, galleryGuestImageIndex: newGuestIndex });
                                                            }}
                                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                                        >
                                                            <X size={12}/>
                                                        </button>

                                                        {/* Bottom Controls: Guest Star & Idle Visibility */}
                                                        <div className="absolute bottom-0 inset-x-0 flex justify-center gap-1 p-0.5 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => updateSharedProp(selectedElementId, { galleryGuestImageIndex: selectedProps.galleryGuestImageIndex === idx ? undefined : idx })}
                                                                className={`p-1 rounded ${selectedProps.galleryGuestImageIndex === idx ? 'text-amber-400 bg-white/20' : 'text-slate-300 hover:text-white'}`}
                                                                title={selectedProps.galleryGuestImageIndex === idx ? "Unset Guest Image" : "Set as Guest Welcome Image"}
                                                            >
                                                                <Star size={10} fill={selectedProps.galleryGuestImageIndex === idx ? "currentColor" : "none"}/>
                                                            </button>
                                                            {selectedProps.galleryGuestImageIndex === idx && (
                                                                <button 
                                                                    onClick={() => updateSharedProp(selectedElementId, { galleryGuestImageHiddenInIdle: !selectedProps.galleryGuestImageHiddenInIdle })}
                                                                    className={`p-1 rounded ${selectedProps.galleryGuestImageHiddenInIdle ? 'text-red-300 bg-white/20' : 'text-emerald-300 hover:text-white'}`}
                                                                    title={selectedProps.galleryGuestImageHiddenInIdle ? "Hidden in Idle Loop" : "Visible in Idle Loop"}
                                                                >
                                                                    {selectedProps.galleryGuestImageHiddenInIdle ? <EyeOff size={10}/> : <Eye size={10}/>}
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Status Indicators (Always visible if active) */}
                                                        {selectedProps.galleryGuestImageIndex === idx && (
                                                            <div className="absolute bottom-1 right-1 pointer-events-none">
                                                                <Star size={8} className="text-amber-400 drop-shadow-md" fill="currentColor"/>
                                                            </div>
                                                        )}
                                                        {selectedProps.galleryGuestImageIndex === idx && selectedProps.galleryGuestImageHiddenInIdle && (
                                                            <div className="absolute bottom-1 left-1 pointer-events-none">
                                                                <EyeOff size={8} className="text-red-400 drop-shadow-md"/>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!selectedProps.galleryImages || selectedProps.galleryImages.length === 0) && (
                                                    <div className="col-span-3 text-[10px] text-slate-400 text-center py-2 italic">No images added.</div>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-slate-400 italic">
                                                Click <Star size={8} className="inline text-amber-400"/> to set image for "Guest Info" mode. 
                                                <br/>
                                                Use <EyeOff size={8} className="inline text-red-400"/> to hide it from standard loop.
                                            </p>
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-3">
                                            <label className="text-xs font-bold text-slate-500 block uppercase">Display Settings</label>
                                            
                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">Image Fit Mode</label>
                                                <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                                    <button onClick={() => updateElement(selectedElementId, { galleryFit: 'cover' })} className={`flex-1 text-[10px] py-1 rounded ${selectedProps.galleryFit === 'cover' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500'}`}>Cover</button>
                                                    <button onClick={() => updateElement(selectedElementId, { galleryFit: 'contain' })} className={`flex-1 text-[10px] py-1 rounded ${selectedProps.galleryFit === 'contain' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500'}`}>Contain</button>
                                                    <button onClick={() => updateElement(selectedElementId, { galleryFit: 'fill' })} className={`flex-1 text-[10px] py-1 rounded ${selectedProps.galleryFit === 'fill' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-500'}`}>Fill</button>
                                                </div>
                                            </div>

                                            {selectedProps.galleryFit !== 'cover' && selectedProps.galleryFit !== 'fill' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 block mb-1">Vertical Align</label>
                                                        <select 
                                                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                            value={selectedProps.galleryAlignment?.vertical || 'center'}
                                                            onChange={(e) => updateElement(selectedElementId, { galleryAlignment: { ...selectedProps.galleryAlignment!, vertical: e.target.value as any } })}
                                                        >
                                                            <option value="top">Top</option>
                                                            <option value="center">Center</option>
                                                            <option value="bottom">Bottom</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 block mb-1">Horizontal Align</label>
                                                        <select 
                                                            className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                            value={selectedProps.galleryAlignment?.horizontal || 'center'}
                                                            onChange={(e) => updateElement(selectedElementId, { galleryAlignment: { ...selectedProps.galleryAlignment!, horizontal: e.target.value as any } })}
                                                        >
                                                            <option value="left">Left</option>
                                                            <option value="center">Center</option>
                                                            <option value="right">Right</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">Transition Effect</label>
                                                <select 
                                                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={selectedProps.galleryTransitionType || 'fade'}
                                                    onChange={(e) => updateElement(selectedElementId, { galleryTransitionType: e.target.value as any })}
                                                >
                                                    <option value="none">None (Instant)</option>
                                                    <option value="fade">Cross Fade</option>
                                                    <option value="slide-left">Slide Left</option>
                                                    <option value="slide-up">Slide Up</option>
                                                    <option value="zoom">Zoom In</option>
                                                    <option value="blur">Blur</option>
                                                    <option value="flip">Flip</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[10px] text-slate-400 block mb-1">Duration per Slide (Sec)</label>
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    max="60" 
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={selectedProps.galleryDuration || 3} 
                                                    onChange={(e) => updateElement(selectedElementId, { galleryDuration: parseInt(e.target.value) })} 
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ELEMENT SPECIFIC PROPERTIES (Existing code for Text, Dimensions, etc.) */}
                                {elements.find(e => e.id === selectedElementId)?.type === 'text' && (
                                    <>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <label className="text-xs font-bold text-slate-500 mb-2 block">Content (Shared)</label>
                                            <textarea className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" rows={3} value={elements.find(e => e.id === selectedElementId)?.content} onChange={(e) => updateSharedProp(selectedElementId, { content: e.target.value })} />
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-3">
                                            <label className="text-xs font-bold text-slate-500 block uppercase">Typography</label>
                                            
                                            {/* Font Family */}
                                            <select className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={selectedProps.styles?.fontFamily as string} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, fontFamily: e.target.value } })}>
                                                {FONT_FAMILIES.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                                            </select>

                                            {/* Style Toggles */}
                                            <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, fontWeight: selectedProps.styles?.fontWeight === 'bold' ? 'normal' : 'bold' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.fontWeight === 'bold' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><Bold size={14}/></button>
                                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, fontStyle: selectedProps.styles?.fontStyle === 'italic' ? 'normal' : 'italic' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.fontStyle === 'italic' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><Italic size={14}/></button>
                                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, textDecoration: selectedProps.styles?.textDecoration === 'underline' ? 'none' : 'underline' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.textDecoration === 'underline' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><Underline size={14}/></button>
                                            </div>

                                            {/* Alignment */}
                                            <div className="flex bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, textAlign: 'left' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.textAlign === 'left' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><AlignLeft size={14}/></button>
                                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, textAlign: 'center' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.textAlign === 'center' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><AlignCenter size={14}/></button>
                                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                <button onClick={() => updateElement(selectedElementId, { styles: { ...selectedProps.styles, textAlign: 'right' } })} className={`flex-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-center ${selectedProps.styles?.textAlign === 'right' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-500'}`}><AlignRight size={14}/></button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Size</label>
                                                    <input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={selectedProps.styles?.fontSize || 40} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, fontSize: parseInt(e.target.value) } })} />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Color</label>
                                                    <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white dark:bg-slate-900">
                                                        <input type="color" className="w-6 h-6 p-0 border-0 rounded cursor-pointer" value={selectedProps.styles?.color as string || '#000000'} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, color: e.target.value } })} />
                                                        <span className="text-[10px] text-slate-500">{selectedProps.styles?.color as string}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 space-y-3">
                                            <label className="text-xs font-bold text-slate-500 block uppercase">Effects</label>
                                            
                                            {/* Text Stroke */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-bold text-slate-400">Outline / Stroke</label>
                                                    <input type="color" className="w-4 h-4 p-0 border-0 rounded cursor-pointer" value={selectedProps.styles?.strokeColor as string || '#000000'} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, strokeColor: e.target.value } })} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="range" min="0" max="10" step="0.5" className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={selectedProps.styles?.strokeWidth || 0} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, strokeWidth: parseFloat(e.target.value) } })} />
                                                    <span className="text-[10px] w-6 text-right font-mono">{selectedProps.styles?.strokeWidth || 0}</span>
                                                </div>
                                            </div>

                                            {/* Text Shadow */}
                                            <div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[10px] font-bold text-slate-400">Shadow</label>
                                                    <input type="color" className="w-4 h-4 p-0 border-0 rounded cursor-pointer" value={selectedProps.styles?.shadowColor as string || '#000000'} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, shadowColor: e.target.value } })} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="range" min="0" max="20" className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" value={selectedProps.styles?.shadowBlur || 0} onChange={(e) => updateElement(selectedElementId, { styles: { ...selectedProps.styles, shadowBlur: parseInt(e.target.value) } })} />
                                                    <span className="text-[10px] w-6 text-right font-mono">{selectedProps.styles?.shadowBlur || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dimensions & Position</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div><label className="text-[10px] text-slate-500 block">X</label><input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={Math.round(selectedProps.x || 0)} onChange={e => updateElement(selectedElementId, { x: parseInt(e.target.value) })} /></div>
                                        <div><label className="text-[10px] text-slate-500 block">Y</label><input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={Math.round(selectedProps.y || 0)} onChange={e => updateElement(selectedElementId, { y: parseInt(e.target.value) })} /></div>
                                        <div><label className="text-[10px] text-slate-500 block">Width</label><input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={Math.round(selectedProps.width || 0)} onChange={e => updateElement(selectedElementId, { width: parseInt(e.target.value) })} /></div>
                                        <div><label className="text-[10px] text-slate-500 block">Height</label><input type="number" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500" value={Math.round(selectedProps.height || 0)} onChange={e => updateElement(selectedElementId, { height: parseInt(e.target.value) })} /></div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <button onClick={() => { const el = elements.find(e => e.id === selectedElementId); if(el) updateSharedProp(selectedElementId, { lockAspectRatio: !el.lockAspectRatio }); }} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs w-full justify-center border transition-colors ${elements.find(e => e.id === selectedElementId)?.lockAspectRatio ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                            {elements.find(e => e.id === selectedElementId)?.lockAspectRatio ? <Lock size={12}/> : <Unlock size={12}/>} Aspect Ratio
                                        </button>
                                        <button onClick={() => updateElement(selectedElementId, { visible: !selectedProps.visible })} className={`p-1.5 rounded-lg flex items-center gap-2 text-xs w-full justify-center border transition-colors ${selectedProps.visible ? 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                            {selectedProps.visible ? <Eye size={12}/> : <EyeOff size={12}/>} Visibility
                                        </button>
                                    </div>
                                </div>

                                {/* NEW: GUEST INFO ANIMATION SETTINGS */}
                                {viewMode === 'info' && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900 rounded-lg animate-fade-in space-y-3">
                                        <div>
                                            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-2"><Film size={12}/> Entry Animation (Show)</h4>
                                            <select 
                                                className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                                                value={selectedProps.animationEntry || 'none'}
                                                onChange={(e) => updateElement(selectedElementId, { animationEntry: e.target.value as any })}
                                            >
                                                <option value="none">No Animation</option>
                                                <option value="fade-in">Fade In</option>
                                                <option value="slide-up">Slide Up</option>
                                                <option value="slide-down">Slide Down</option>
                                                <option value="pop-in">Pop In</option>
                                                <option value="blur-in">Blur In</option>
                                                <option value="elastic-right">Elastic Slide</option>
                                            </select>
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase mb-2 flex items-center gap-2"><Film size={12}/> Exit Animation (Hide)</h4>
                                            <select 
                                                className="w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-red-500"
                                                value={selectedProps.animationExit || 'none'}
                                                onChange={(e) => updateElement(selectedElementId, { animationExit: e.target.value as any })}
                                            >
                                                <option value="none">No Animation</option>
                                                <option value="fade-out">Fade Out</option>
                                                <option value="slide-down-out">Slide Down Out</option>
                                                <option value="slide-up-out">Slide Up Out</option>
                                                <option value="pop-out">Pop Out</option>
                                                <option value="blur-out">Blur Out</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 mb-2 block flex items-center gap-2"><Palette size={14}/> Background Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {bgColors.map(c => (
                                            <div key={c} onClick={() => { setDesign({ ...design, background: c }); if(!bgColors.includes(c)) setBgColors([...bgColors, c]); }} className={`w-8 h-8 rounded-full cursor-pointer border shadow-sm transition-transform hover:scale-110 ${design.background === c ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`} style={{ backgroundColor: c }} />
                                        ))}
                                        <label className="w-8 h-8 rounded-full cursor-pointer border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 relative overflow-hidden">
                                            <input type="color" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 border-0" onChange={(e) => { setDesign({ ...design, background: e.target.value }); if(!bgColors.includes(e.target.value)) setBgColors([...bgColors, e.target.value]); }} />
                                            <Plus size={14} />
                                        </label>
                                    </div>
                                </div>
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                                    <p className="font-bold mb-1">Canvas Info</p>
                                    <p>Resolution: {resolution.width} x {resolution.height}</p>
                                    <p className="capitalize">Orientation: {design.orientation}</p>
                                </div>

                                {/* NEW: GUEST INFO GLOBAL SETTINGS */}
                                {viewMode === 'info' && (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900 rounded-lg">
                                        <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-2"><Clock size={12}/> Guest Display Duration</h4>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                min="3" 
                                                max="30" 
                                                step="1"
                                                className="flex-1 accent-emerald-600"
                                                value={design.guestDisplayDuration || 10}
                                                onChange={(e) => setDesign({...design, guestDisplayDuration: parseInt(e.target.value)})}
                                            />
                                            <span className="text-sm font-bold text-emerald-700 w-8 text-right">{design.guestDisplayDuration || 10}s</span>
                                        </div>
                                        <p className="text-[10px] text-emerald-600 mt-1">Time before returning to Idle loop.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ASSET PICKER (Enhanced) */}
            {isAssetPickerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-[600px] h-[500px] rounded-xl flex flex-col shadow-2xl animate-fade-in border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                                <CloudUpload size={20} className="text-indigo-500" /> Select {activeAssetType}
                            </h3>
                            <button onClick={() => setIsAssetPickerOpen(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full p-1 text-slate-500"><X size={20}/></button>
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex flex-col gap-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        ref={assetFileInputRef} 
                                        className="hidden" 
                                        multiple 
                                        accept={activeAssetType === 'video' ? 'video/*' : 'image/*'} 
                                        onChange={handleFileSelect} 
                                    />
                                    <input 
                                        placeholder="Paste external URL (Optional)" 
                                        className="flex-1 text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500" 
                                        value={newAssetUrl} 
                                        onChange={(e) => setNewAssetUrl(e.target.value)} 
                                    />
                                    <button 
                                        onClick={handleUploadUrl} 
                                        disabled={isUploading || !newAssetUrl} 
                                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-all ${isUploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    > 
                                        {isUploading ? 'Adding...' : <><Link2 size={16} /> Add URL</>} 
                                    </button>
                                </div>
                                {isUploading && ( 
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1 overflow-hidden"> 
                                        <div className="bg-indigo-600 h-2 rounded-full transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }}></div> 
                                    </div> 
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 bg-slate-100/50 dark:bg-slate-950/20 custom-scrollbar">
                            <div 
                                onClick={() => assetFileInputRef.current?.click()} 
                                className="aspect-square bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition-all group"
                            >
                                <Plus size={24} className="text-slate-400 group-hover:text-indigo-600 mb-2"/>
                                <span className="text-xs text-slate-500 group-hover:text-indigo-600 font-medium">Upload Files</span>
                            </div>
                            {partnerAssets.map(asset => (
                                <div key={asset.id} onClick={() => handleAssetSelect(asset)} className="cursor-pointer aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative group border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:ring-2 hover:ring-indigo-500/20 transition-all shadow-sm">
                                    {asset.type === 'video' ? (
                                        <div className="w-full h-full relative bg-black">
                                            <video src={asset.url} className="w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play className="text-white/50" size={24}/>
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={asset.url} className="w-full h-full object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-[10px] text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        {asset.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScreenBuilder;
