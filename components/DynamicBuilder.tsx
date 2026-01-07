import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Invitation, Scene, CanvasElement, ElementType, User, PartnerAsset } from '../types';
import { Plus, Image as ImageIcon, Type, Video, Music, Trash2, ArrowRight, Play, Pause, LayoutTemplate, Wand2, Layers, Eye, EyeOff, ArrowUp, ArrowDown, X, Upload, Check, Settings, GripVertical, Palette, Clock, ChevronDown, ChevronUp, RefreshCw, ZoomIn, ZoomOut, Maximize, GripHorizontal, FileUp, MousePointer2, CloudUpload, Link2, Unlink, MoveHorizontal, MoveVertical, MoveDiagonal, Monitor, Scan, Repeat, Sparkles, LogIn, LogOut, Activity, Paintbrush, Film, Pencil, ArrowLeft, Save } from 'lucide-react';
import { generateCreativeText } from '../services/geminiService';
import { getAssets, createAsset, getInvitation, updateInvitation } from '../services/mockBackend';
import { useParams, useNavigate } from 'react-router-dom';

const INITIAL_SCENE: Scene = {
  id: 'scene-1',
  order: 0,
  duration: 5,
  elements: [],
  background: '#ffffff'
};

// --- CSS STYLES FOR ANIMATIONS (Jitter-style Easing) ---
const ANIMATION_STYLES = `
  /* --- ENTRY ANIMATIONS (Approx 0.8s) --- */
  
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


  /* --- EMPHASIS ANIMATIONS (Looping) --- */
  
  @keyframes pulseSlow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .anim-emph-pulse { animation: pulseSlow 3s ease-in-out infinite; }

  @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  .anim-emph-float { animation: float 4s ease-in-out infinite; }

  @keyframes shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
  .anim-emph-shake { animation: shake 4s ease-in-out infinite; }

  @keyframes heartbeat { 0% { transform: scale(1); } 14% { transform: scale(1.1); } 28% { transform: scale(1); } 42% { transform: scale(1.1); } 70% { transform: scale(1); } }
  .anim-emph-heartbeat { animation: heartbeat 2s ease-in-out infinite; }


  /* --- EXIT ANIMATIONS (Approx 0.8s) --- */
  
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
  .anim-exit-fade-out { animation: fadeOut 0.8s ease-in forwards; }

  @keyframes slideOutDown { from { transform: translateY(0); opacity: 1; } to { transform: translateY(50px); opacity: 0; } }
  .anim-exit-slide-out-down { animation: slideOutDown 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes slideOutUp { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-50px); opacity: 0; } }
  .anim-exit-slide-out-up { animation: slideOutUp 0.8s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes popOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.5); opacity: 0; } }
  .anim-exit-pop-out { animation: popOut 0.6s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards; }

  @keyframes blurOut { from { filter: blur(0); opacity: 1; } to { filter: blur(10px); opacity: 0; } }
  .anim-exit-blur-out { animation: blurOut 0.8s ease-in forwards; }
`;

const DynamicBuilder: React.FC<{ user: User }> = ({ user }) => {
  // --- ROUTING & SAVING STATE ---
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- BUILDER STATE ---
  const [scenes, setScenes] = useState<Scene[]>([INITIAL_SCENE]);
  const [activeSceneId, setActiveSceneId] = useState<string>('scene-1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Properties Tab State
  const [activePropTab, setActivePropTab] = useState<'design' | 'animate'>('design');

  // Canvas Dimensions State (Default 720x1280)
  const [canvasSize, setCanvasSize] = useState({ width: 720, height: 1280 });

  // Timeline & Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Layout & Resizing State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256); // Default 16rem (w-64)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320); // Default 20rem (w-80)
  const [timelineHeight, setTimelineHeight] = useState(220);
  
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);

  const [zoom, setZoom] = useState(0.45); 
  const viewportRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null); // Ref for timeline container
  
  const assetFileInputRef = useRef<HTMLInputElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSceneSettingsId, setExpandedSceneSettingsId] = useState<string | null>(null);
  const [showCanvasSettings, setShowCanvasSettings] = useState(true);

  // Asset Management State
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [currentAssetType, setCurrentAssetType] = useState<'image' | 'video' | 'audio' | null>(null);
  const [partnerAssets, setPartnerAssets] = useState<PartnerAsset[]>([]);
  const [newAssetUrl, setNewAssetUrl] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  
  // Upload Simulation State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Layer Renaming State
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [tempLayerName, setTempLayerName] = useState('');

  // --- DRAG & DROP CUSTOM PREVIEW STATE ---
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ id: string, x: number, y: number } | null>(null);
  const dragOffsetRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });

  // --- ELEMENT RESIZING STATE (CANVAS) ---
  const [resizingElement, setResizingElement] = useState<{ 
      id: string, 
      direction: 'e' | 's' | 'se', 
      startX: number, 
      startY: number, 
      startWidth: number, 
      startHeight: number,
      aspectRatio: number
  } | null>(null);

  // --- TIMELINE ELEMENT RESIZING STATE ---
  const [resizingTimelineElement, setResizingTimelineElement] = useState<{
      id: string,
      direction: 'left' | 'right',
      startX: number,
      initialStartTime: number,
      initialDuration: number
  } | null>(null);

  // Derive active partner ID
  const activePartnerId = user.role === 'SUPER_ADMIN' ? 'p1' : (user.partnerIds?.[0] || 'p1');
  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  // --- LOAD INVITATION ---
  useEffect(() => {
    if (invitationId) {
        getInvitation(invitationId).then(inv => {
            if (inv) {
                setInvitation(inv);
                if (inv.content && inv.content.scenes && inv.content.scenes.length > 0) {
                    setScenes(inv.content.scenes);
                    setActiveSceneId(inv.content.scenes[0].id);
                }
                if (inv.content?.canvasSettings) {
                    setCanvasSize(inv.content.canvasSettings);
                }
            }
            setIsLoadingInvitation(false);
        });
    } else {
        setIsLoadingInvitation(false);
    }
  }, [invitationId]);

  // --- SAVE INVITATION ---
  const handleSave = async () => {
    if (!invitationId || !invitation) return;
    setIsSaving(true);
    try {
        const updatedContent = {
            scenes: scenes,
            canvasSettings: canvasSize
        };
        await updateInvitation(invitationId, { content: updatedContent });
        await new Promise(resolve => setTimeout(resolve, 500)); // Sim delay
        alert("Invitation saved successfully!");
    } catch (err) {
        console.error(err);
        alert("Failed to save invitation.");
    } finally {
        setIsSaving(false);
    }
  };

  useEffect(() => {
      if (isAssetPickerOpen && currentAssetType) {
          getAssets(activePartnerId, currentAssetType).then(setPartnerAssets);
      }
  }, [isAssetPickerOpen, currentAssetType, activePartnerId]);

  // Initial Fit Zoom
  useEffect(() => {
    const timer = setTimeout(() => {
        handleZoomFit();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // --- PLAYBACK LOGIC ---
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeScene.duration) {
            setIsPlaying(false);
            return 0; 
          }
          return parseFloat((prev + 0.1).toFixed(1)); 
        });
      }, 100);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, activeScene.duration]);

  // --- VIDEO SYNC LOGIC ---
  useEffect(() => {
    activeScene.elements.forEach(el => {
        if (el.type === 'video') {
            const videoEl = document.getElementById(`video-${el.id}`) as HTMLVideoElement;
            if (videoEl && !isNaN(videoEl.duration)) {
                if (el.loop) {
                    if (isPlaying) videoEl.play().catch(() => {});
                    else videoEl.pause();
                    return; 
                }
                const relTime = currentTime - (el.startTime || 0);
                const elementDuration = el.duration || activeScene.duration;
                if (relTime >= 0 && relTime <= elementDuration) {
                    const syncTime = Math.min(relTime, videoEl.duration);
                    if (Math.abs(videoEl.currentTime - syncTime) > 0.2) videoEl.currentTime = syncTime;
                    if (isPlaying) {
                        if (relTime >= videoEl.duration) videoEl.pause();
                        else videoEl.play().catch(() => {});
                    } else videoEl.pause();
                } else {
                    videoEl.pause();
                    videoEl.currentTime = 0;
                }
            }
        }
    });
  }, [currentTime, isPlaying, activeScene.elements]);


  // --- ELEMENT RESIZING LOGIC (CANVAS) ---
  useEffect(() => {
      const handleGlobalMouseMove = (e: MouseEvent) => {
          if (!resizingElement) return;
          const deltaX = (e.clientX - resizingElement.startX) / zoom;
          const deltaY = (e.clientY - resizingElement.startY) / zoom;
          let newWidth = resizingElement.startWidth;
          let newHeight = resizingElement.startHeight;
          const element = activeScene.elements.find(el => el.id === resizingElement.id);
          const isLocked = element?.lockAspectRatio;
          if (resizingElement.direction === 'e') {
              newWidth = Math.max(20, resizingElement.startWidth + deltaX);
              if (isLocked) newHeight = newWidth / resizingElement.aspectRatio;
          } else if (resizingElement.direction === 's') {
              newHeight = Math.max(20, resizingElement.startHeight + deltaY);
              if (isLocked) newWidth = newHeight * resizingElement.aspectRatio;
          } else if (resizingElement.direction === 'se') {
              newWidth = Math.max(20, resizingElement.startWidth + deltaX);
              if (isLocked) newHeight = newWidth / resizingElement.aspectRatio;
              else newHeight = Math.max(20, resizingElement.startHeight + deltaY);
          }
          updateElement(resizingElement.id, { width: Math.round(newWidth), height: Math.round(newHeight) });
      };
      const handleGlobalMouseUp = () => { if (resizingElement) setResizingElement(null); };
      if (resizingElement) {
          window.addEventListener('mousemove', handleGlobalMouseMove);
          window.addEventListener('mouseup', handleGlobalMouseUp);
          document.body.style.cursor = resizingElement.direction === 'e' ? 'ew-resize' : resizingElement.direction === 's' ? 'ns-resize' : 'nwse-resize';
      }
      return () => {
          window.removeEventListener('mousemove', handleGlobalMouseMove);
          window.removeEventListener('mouseup', handleGlobalMouseUp);
          document.body.style.cursor = 'default';
      };
  }, [resizingElement, activeScene.elements, zoom]);

  // --- TIMELINE RESIZING LOGIC ---
  useEffect(() => {
    const handleTimelineMouseMove = (e: MouseEvent) => {
      if (!resizingTimelineElement || !timelineRef.current) return;
      const timelineWidth = timelineRef.current.getBoundingClientRect().width;
      const pixelsPerSecond = timelineWidth / activeScene.duration;
      const deltaPixels = e.clientX - resizingTimelineElement.startX;
      const deltaSeconds = deltaPixels / pixelsPerSecond;
      let newStartTime = resizingTimelineElement.initialStartTime;
      let newDuration = resizingTimelineElement.initialDuration;
      if (resizingTimelineElement.direction === 'left') {
        newStartTime = Math.max(0, resizingTimelineElement.initialStartTime + deltaSeconds);
        newDuration = Math.max(0.1, resizingTimelineElement.initialDuration - deltaSeconds);
        if (newStartTime >= resizingTimelineElement.initialStartTime + resizingTimelineElement.initialDuration) {
             newStartTime = resizingTimelineElement.initialStartTime + resizingTimelineElement.initialDuration - 0.1;
             newDuration = 0.1;
        }
      } else {
        newDuration = Math.max(0.1, resizingTimelineElement.initialDuration + deltaSeconds);
        if (newStartTime + newDuration > activeScene.duration) newDuration = activeScene.duration - newStartTime;
      }
      newStartTime = Math.round(newStartTime * 10) / 10;
      newDuration = Math.round(newDuration * 10) / 10;
      updateElement(resizingTimelineElement.id, { startTime: newStartTime, duration: newDuration });
    };
    const handleTimelineMouseUp = () => { setResizingTimelineElement(null); };
    if (resizingTimelineElement) {
        window.addEventListener('mousemove', handleTimelineMouseMove);
        window.addEventListener('mouseup', handleTimelineMouseUp);
        document.body.style.cursor = 'ew-resize';
    }
    return () => {
        window.removeEventListener('mousemove', handleTimelineMouseMove);
        window.removeEventListener('mouseup', handleTimelineMouseUp);
        document.body.style.cursor = 'default';
    };
  }, [resizingTimelineElement, activeScene.duration]);

  const startElementResize = (e: React.MouseEvent, id: string, direction: 'e' | 's' | 'se') => {
      e.stopPropagation(); e.preventDefault();
      const el = activeScene.elements.find(e => e.id === id);
      if (!el) return;
      setResizingElement({ id, direction, startX: e.clientX, startY: e.clientY, startWidth: el.width, startHeight: el.height, aspectRatio: el.width / el.height });
  };

  const startTimelineResize = (e: React.MouseEvent, id: string, direction: 'left' | 'right') => {
      e.stopPropagation(); e.preventDefault();
      const el = activeScene.elements.find(e => e.id === id);
      if (!el) return;
      setResizingTimelineElement({ id, direction, startX: e.clientX, initialStartTime: el.startTime || 0, initialDuration: el.duration || activeScene.duration });
  };

  const togglePlayback = () => {
    if (currentTime >= activeScene.duration) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
      if (resizingTimelineElement) return; 
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = parseFloat((percentage * activeScene.duration).toFixed(1));
      setCurrentTime(newTime);
  };

  const startRenaming = (id: string, currentName: string) => { setRenamingLayerId(id); setTempLayerName(currentName); };
  const saveLayerName = () => { if (renamingLayerId && tempLayerName.trim() !== '') updateElement(renamingLayerId, { name: tempLayerName.trim() }); setRenamingLayerId(null); };

  // --- LAYOUT RESIZING HANDLERS ---
  const startResizingLeft = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingLeft(true); }, []);
  const startResizingRight = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingRight(true); }, []);
  const startResizingTimeline = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizingTimeline(true); }, []);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isResizingLeft) { const newWidth = e.clientX - 64; if (newWidth > 180 && newWidth < 500) setLeftSidebarWidth(newWidth); }
          if (isResizingRight) { const newWidth = window.innerWidth - e.clientX; if (newWidth > 240 && newWidth < 600) setRightSidebarWidth(newWidth); }
          if (isResizingTimeline) { const newHeight = window.innerHeight - e.clientY; if (newHeight > 100 && newHeight < window.innerHeight * 0.6) setTimelineHeight(newHeight); }
      };
      const handleMouseUp = () => { setIsResizingLeft(false); setIsResizingRight(false); setIsResizingTimeline(false); };
      if (isResizingLeft || isResizingRight || isResizingTimeline) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = (isResizingLeft || isResizingRight) ? 'col-resize' : 'row-resize';
      } else { document.body.style.cursor = 'default'; }
      return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); document.body.style.cursor = 'default'; };
  }, [isResizingLeft, isResizingRight, isResizingTimeline]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.05, 2.0)); 
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.05, 0.1));
  const handleZoomFit = () => {
      if (viewportRef.current) {
          const { clientWidth, clientHeight } = viewportRef.current;
          const PADDING = 60; 
          const scaleX = (clientWidth - PADDING) / canvasSize.width;
          const scaleY = (clientHeight - PADDING) / canvasSize.height;
          const newZoom = Math.min(scaleX, scaleY);
          setZoom(Math.max(0.1, Math.min(newZoom, 1.0))); 
      } else { setZoom(0.45); }
  };

  // --- ASSET UPLOAD LOGIC ---
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      setUploadProgress(0);

      // We'll upload sequentially to simulate a queue and show progress
      const totalFiles = files.length;
      const uploadedAssets: PartnerAsset[] = [];

      for (let i = 0; i < totalFiles; i++) {
          const file = files[i];
          
          if (currentAssetType === 'image' && !file.type.startsWith('image/')) continue;
          if (currentAssetType === 'video' && !file.type.startsWith('video/')) continue;
          if (currentAssetType === 'audio' && !file.type.startsWith('audio/')) continue;

          try {
              let url = '';
              if (currentAssetType === 'video' || currentAssetType === 'audio') {
                  url = URL.createObjectURL(file); 
              } else {
                  url = await new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                  });
              }

              const newAsset = await createAsset({
                  partnerId: activePartnerId,
                  type: currentAssetType!,
                  name: file.name.split('.')[0],
                  url: url
              });
              
              uploadedAssets.push(newAsset);
              setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));

          } catch (err) {
              console.error("Error uploading file:", file.name, err);
          }
      }

      setPartnerAssets(prev => [...uploadedAssets, ...prev]); 
      setIsUploading(false);
      setUploadProgress(0);
      if (assetFileInputRef.current) assetFileInputRef.current.value = '';
  };

  const handleUploadUrl = async () => {
      if (!newAssetUrl || !currentAssetType) return;
      setIsUploading(true);
      setUploadProgress(0);
      const interval = setInterval(() => { setUploadProgress(prev => (prev >= 95 ? 95 : prev + 5)); }, 100);
      try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const newAsset = await createAsset({ partnerId: activePartnerId, type: currentAssetType, name: newAssetName || `External ${currentAssetType}`, url: newAssetUrl });
          setUploadProgress(100); clearInterval(interval); await new Promise(resolve => setTimeout(resolve, 500));
          setPartnerAssets([newAsset, ...partnerAssets]); setNewAssetUrl(''); setNewAssetName('');
      } catch (e) { console.error(e); alert("Failed to add URL asset."); } finally { setIsUploading(false); setUploadProgress(0); }
  };

  // --- SCENE & ELEMENT LOGIC ---
  const addElementToCanvas = (type: ElementType, content: string, name?: string, w?: number, h?: number, x?: number, y?: number) => {
    const defaultW = type === 'text' ? 200 : type === 'audio' ? 60 : 150;
    const defaultH = type === 'text' ? 50 : type === 'audio' ? 60 : 150;
    const start = currentTime;
    const initialDuration = 5;
    const duration = initialDuration;
    const finalName = name || `${type.charAt(0).toUpperCase() + type.slice(1)} ${activeScene.elements.filter(e => e.type === type).length + 1}`;
    const newElement: CanvasElement = { id: `el-${Date.now()}`, type, content, name: finalName, x: x !== undefined ? x : 50, y: y !== undefined ? y : 100, width: w || defaultW, height: h || defaultH, zIndex: activeScene.elements.length, visible: true, startTime: start, duration: duration, animationEntry: 'fade-in', animationEmphasis: 'none', animationExit: 'none', lockAspectRatio: true, loop: false };
    updateActiveSceneElements([...activeScene.elements, newElement]);
    setSelectedElementId(newElement.id);
    setIsAssetPickerOpen(false); 
  };
  
  const addScene = () => { const newScene: Scene = { id: `scene-${Date.now()}`, order: scenes.length, duration: 5, elements: [], background: '#f3f4f6' }; setScenes([...scenes, newScene]); setActiveSceneId(newScene.id); setSelectedElementId(null); setCurrentTime(0); setIsPlaying(false); };
  const deleteScene = (sceneId: string) => { if (scenes.length <= 1) { alert("You must have at least one scene."); return; } const newScenes = scenes.filter(s => s.id !== sceneId); setScenes(newScenes); if (activeSceneId === sceneId) setActiveSceneId(newScenes[0].id); };
  const moveScene = (index: number, direction: 'up' | 'down') => { const newScenes = [...scenes]; if (direction === 'up') { if (index > 0) [newScenes[index], newScenes[index - 1]] = [newScenes[index - 1], newScenes[index]]; } else { if (index < newScenes.length - 1) [newScenes[index], newScenes[index + 1]] = [newScenes[index + 1], newScenes[index]]; } newScenes.forEach((s, i) => s.order = i); setScenes(newScenes); };
  const toggleSceneSettings = (sceneId: string) => { setExpandedSceneSettingsId(expandedSceneSettingsId === sceneId ? null : sceneId); if(expandedSceneSettingsId !== sceneId) setActiveSceneId(sceneId); };
  const handleAddElementClick = (type: ElementType) => { if (type === 'text' || type === 'button') { addElementToCanvas(type, type === 'text' ? 'Double click to edit' : 'Button Label'); } else { setCurrentAssetType(type as 'image' | 'video' | 'audio'); setIsAssetPickerOpen(true); } };
  const handleAssetSelect = (asset: PartnerAsset) => {
      const canvasAspect = canvasSize.width / canvasSize.height;
      if (asset.type === 'image') {
          const img = new Image(); img.src = asset.url;
          img.onload = () => {
              const imgAspect = img.naturalWidth / img.naturalHeight;
              if (Math.abs(imgAspect - canvasAspect) < 0.05 || (img.naturalWidth === canvasSize.width && img.naturalHeight === canvasSize.height)) { addElementToCanvas(asset.type, asset.url, asset.name, canvasSize.width, canvasSize.height, 0, 0); } else { const maxInitWidth = canvasSize.width * 0.6; let finalWidth = img.naturalWidth || 300; let finalHeight = img.naturalHeight || 200; if (finalWidth > maxInitWidth) { const ratio = finalWidth / finalHeight; finalWidth = maxInitWidth; finalHeight = maxInitWidth / ratio; } addElementToCanvas(asset.type, asset.url, asset.name, finalWidth, finalHeight); }
          }; img.onerror = () => addElementToCanvas(asset.type, asset.url, asset.name, 300, 200);
      } else if (asset.type === 'video') {
          const video = document.createElement('video'); video.src = asset.url;
          video.onloadedmetadata = () => {
              const vidAspect = video.videoWidth / video.videoHeight;
              if (Math.abs(vidAspect - canvasAspect) < 0.05 || (video.videoWidth === canvasSize.width && video.videoHeight === canvasSize.height)) { addElementToCanvas(asset.type, asset.url, asset.name, canvasSize.width, canvasSize.height, 0, 0); } else { const maxInitWidth = canvasSize.width * 0.8; let finalWidth = video.videoWidth || 300; let finalHeight = video.videoHeight || 200; if (finalWidth > maxInitWidth) { const ratio = finalWidth / finalHeight; finalWidth = maxInitWidth; finalHeight = maxInitWidth / ratio; } addElementToCanvas(asset.type, asset.url, asset.name, Math.round(finalWidth), Math.round(finalHeight)); }
          }; video.onerror = () => { addElementToCanvas(asset.type, asset.url, asset.name, 300, 200); };
      } else { addElementToCanvas(asset.type, asset.url, asset.name); }
  };
  const updateActiveSceneElements = (elements: CanvasElement[]) => { const organizedElements = elements.map((el, index) => ({ ...el, zIndex: index })); const updatedScenes = scenes.map(s => s.id === activeSceneId ? { ...s, elements: organizedElements } : s); setScenes(updatedScenes); };
  const updateElement = (id: string, updates: Partial<CanvasElement>) => { const element = activeScene.elements.find(e => e.id === id); if (!element) return; if (element.lockAspectRatio && (updates.width || updates.height)) { const ratio = element.width / element.height; if (updates.width && !updates.height) { updates.height = Math.round(updates.width / ratio); } else if (updates.height && !updates.width) { updates.width = Math.round(updates.height * ratio); } } const elements = activeScene.elements.map(e => e.id === id ? { ...e, ...updates } : e); updateActiveSceneElements(elements); };
  const toggleVideoLoop = (id: string) => { const el = activeScene.elements.find(e => e.id === id); if (!el || el.type !== 'video') return; const newLoopState = !el.loop; let newElements = [...activeScene.elements]; if (newLoopState) { newElements = newElements.filter(e => e.id !== id); newElements.unshift({ ...el, loop: true }); } else { newElements = newElements.map(e => e.id === id ? { ...e, loop: false } : e); } updateActiveSceneElements(newElements); };
  const deleteElement = (id: string) => { const elements = activeScene.elements.filter(e => e.id !== id); updateActiveSceneElements(elements); if (selectedElementId === id) setSelectedElementId(null); };
  const toggleElementVisibility = (id: string) => { const el = activeScene.elements.find(e => e.id === id); if (el) updateElement(id, { visible: !el.visible }); };
  const moveLayer = (index: number, direction: 'up' | 'down') => { const newElements = [...activeScene.elements]; if (direction === 'up') { if (index < newElements.length - 1) [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]]; } else { if (index > 0) [newElements[index], newElements[index - 1]] = [newElements[index - 1], newElements[index]]; } updateActiveSceneElements(newElements); };
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
      const emptyImg = new Image(); emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; e.dataTransfer.setDragImage(emptyImg, 0, 0); e.dataTransfer.effectAllowed = 'move';
      const rect = e.currentTarget.getBoundingClientRect(); const offsetX = e.clientX - rect.left; const offsetY = e.clientY - rect.top; dragOffsetRef.current = { x: offsetX, y: offsetY };
      setIsDragging(true); setDragPreview({ id, x: e.clientX, y: e.clientY }); setSelectedElementId(id);
      const dragData = JSON.stringify({ id, offsetX, offsetY }); e.dataTransfer.setData('application/json', dragData);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (isDragging) { setDragPreview(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); } };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); setDragPreview(null); const dragDataString = e.dataTransfer.getData('application/json'); if (!dragDataString) return; try { const { id, offsetX, offsetY } = JSON.parse(dragDataString); const containerRect = e.currentTarget.getBoundingClientRect(); const mouseRelX = e.clientX - containerRect.left; const mouseRelY = e.clientY - containerRect.top; const elementScreenX = mouseRelX - offsetX; const elementScreenY = mouseRelY - offsetY; const finalX = elementScreenX / zoom; const finalY = elementScreenY / zoom; updateElement(id, { x: finalX, y: finalY }); } catch (err) { console.error("Failed to parse drag data", err); } };
  
  const handleMagicText = async () => { if (!selectedElementId) return; const el = activeScene.elements.find(e => e.id === selectedElementId); if (!el || el.type !== 'text') return; setIsGenerating(true); const newText = await generateCreativeText("Wedding invitation header", "title"); updateElement(selectedElementId, { content: newText }); setIsGenerating(false); };
  
  const renderDragPreview = () => {
      if (!isDragging || !dragPreview) return null; const el = activeScene.elements.find(e => e.id === dragPreview.id); if (!el) return null; const left = dragPreview.x - dragOffsetRef.current.x; const top = dragPreview.y - dragOffsetRef.current.y;
      return ( <div className="fixed pointer-events-none z-[9999] opacity-90 shadow-2xl ring-2 ring-indigo-500 rounded-md" style={{ left: left, top: top, width: el.width * zoom, height: el.height * zoom, transformOrigin: 'top left', }}> {el.type === 'image' && <img src={el.content} className="w-full h-full object-cover rounded-md" alt="" />} {el.type === 'text' && ( <div className="w-full h-full p-2 bg-transparent text-gray-800 break-words overflow-hidden" style={{ fontSize: `${16 * zoom}px` }}> {el.content} </div> )} {el.type === 'video' && <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white"><Play size={24 * zoom}/></div>} {el.type === 'button' && <button className="w-full h-full bg-black text-white rounded-full flex items-center justify-center font-medium" style={{ fontSize: `${14 * zoom}px` }}>Link</button>} </div> );
  };
  
  const getAnimationClass = (el: CanvasElement, cTime: number) => { const start = el.startTime || 0; const dur = el.duration || activeScene.duration; const end = start + dur; if (cTime < start || cTime > end) return ''; const timeAlive = cTime - start; const timeRemaining = end - cTime; if (timeAlive < 0.8 && el.animationEntry && el.animationEntry !== 'none') { return `anim-entry-${el.animationEntry}`; } if (timeRemaining < 0.8 && el.animationExit && el.animationExit !== 'none') { return `anim-exit-${el.animationExit}`; } if (el.animationEmphasis && el.animationEmphasis !== 'none') { return `anim-emph-${el.animationEmphasis}`; } return ''; };

  if (isLoadingInvitation) {
      return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">Loading Builder...</div>;
  }

  if (invitationId && !invitation) {
      return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-red-500">Invitation not found.</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden font-sans">
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; } .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; } ${ANIMATION_STYLES} `}</style>

      {renderDragPreview()}

      {/* --- ASSET PICKER MODAL --- */}
      {isAssetPickerOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-xl">
              <div className="bg-white dark:bg-slate-900 w-[600px] h-[500px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white capitalize flex items-center gap-2"> <CloudUpload size={20} className="text-indigo-500" /> Select {currentAssetType} </h3>
                      <button onClick={() => setIsAssetPickerOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500"> <X size={20} /> </button>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-3">
                          <div className="flex gap-2">
                             <input type="file" ref={assetFileInputRef} className="hidden" multiple accept={currentAssetType === 'image' ? 'image/*' : currentAssetType === 'video' ? 'video/*' : 'audio/*'} onChange={handleFileSelect} />
                             <input placeholder="Paste external URL (Optional)" className="flex-1 text-sm p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none" value={newAssetUrl} onChange={(e) => setNewAssetUrl(e.target.value)} />
                             <button onClick={handleUploadUrl} disabled={isUploading || !newAssetUrl} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-all ${isUploading ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}> {isUploading ? 'Adding...' : <><Link2 size={16} /> Add URL</>} </button>
                          </div>
                          {isUploading && ( <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-1 overflow-hidden"> <div className="bg-indigo-600 h-2 rounded-full transition-all duration-200 ease-out" style={{ width: `${uploadProgress}%` }}></div> </div> )}
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-100/50 dark:bg-slate-950/20 custom-scrollbar">
                      <div className="grid grid-cols-3 gap-4">
                          <div onClick={() => assetFileInputRef.current?.click()} className="aspect-square bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                             <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-2"> <Plus size={24} /> </div> <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Upload Files</span>
                          </div>
                          {partnerAssets.map(asset => (
                              <div key={asset.id} onClick={() => handleAssetSelect(asset)} className="aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:ring-2 hover:ring-indigo-500 hover:shadow-md transition-all relative group border border-slate-200 dark:border-slate-700">
                                  {asset.type === 'image' && <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />}
                                  {asset.type === 'video' && ( <div className="w-full h-full bg-slate-900 relative"> <video src={asset.url} className="w-full h-full object-cover" muted loop onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }} /> <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity"> <Play size={32} className="text-white fill-white/50" /> </div> </div> )}
                                  {asset.type === 'audio' && <div className="w-full h-full flex items-center justify-center bg-indigo-900 text-white"><Music size={32} /></div>}
                                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6 text-xs text-white truncate text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{asset.name}</div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- HEADER (Updated: Zoom controls moved to workspace area) --- */}
      <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
          <div className="flex items-center gap-4">
              <button onClick={() => navigate('/invitations')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors"> <ArrowLeft size={20} /> </button>
              <div> <h1 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"> {invitation?.name || 'Untitled Invitation'} <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wide">DYNAMIC</span> </h1> <p className="text-xs text-slate-400">Mobile Invitation Builder</p> </div>
          </div>
          <div className="flex items-center gap-3">
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-70"> <Save size={18} /> {isSaving ? 'Saving...' : 'Save Design'} </button>
          </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
          {/* --- COLUMN 1: LEFT SIDEBAR --- */}
          <div style={{ width: leftSidebarWidth }} className="flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0">
             <div className="bg-white dark:bg-slate-900 p-4 transition-colors shrink-0 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm uppercase tracking-wide">Toolbar</h3>
                <div className="grid grid-cols-5 gap-2">
                    <button onClick={() => handleAddElementClick('text')} className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"><Type className="text-indigo-600 dark:text-indigo-400" size={18} /></button>
                    <button onClick={() => handleAddElementClick('image')} className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"><ImageIcon className="text-pink-600 dark:text-pink-400" size={18} /></button>
                    <button onClick={() => handleAddElementClick('video')} className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"><Video className="text-purple-600 dark:text-purple-400" size={18} /></button>
                    <button onClick={() => handleAddElementClick('audio')} className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"><Music className="text-orange-600 dark:text-orange-400" size={18} /></button>
                    <button onClick={() => handleAddElementClick('button')} className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg border border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all"><LayoutTemplate className="text-green-600 dark:text-green-400" size={18} /></button>
                </div>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-900 p-4 flex flex-col min-h-0 transition-colors overflow-hidden">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm uppercase tracking-wide flex items-center gap-2 shrink-0"><Layers size={14} /> Layers</h3>
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                    {activeScene.elements.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">No elements in this scene.</p>}
                    {[...activeScene.elements].reverse().map((el, revIndex) => {
                        const originalIndex = activeScene.elements.length - 1 - revIndex;
                        const isRenaming = renamingLayerId === el.id;
                        return (
                            <div key={el.id} onClick={() => { if(!isRenaming) setSelectedElementId(el.id); }} className={`flex items-center justify-between p-2 rounded-lg border text-sm transition-all group ${selectedElementId === el.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800'}`}>
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {el.type === 'text' && <Type size={14} className="text-indigo-500 flex-shrink-0" />} {el.type === 'image' && <ImageIcon size={14} className="text-pink-500 flex-shrink-0" />} {el.type === 'video' && <Video size={14} className="text-purple-500 flex-shrink-0" />} {el.type === 'audio' && <Music size={14} className="text-orange-500 flex-shrink-0" />} {el.type === 'button' && <LayoutTemplate size={14} className="text-green-500 flex-shrink-0" />}
                                    {isRenaming ? ( <input autoFocus type="text" className="w-full bg-white dark:bg-slate-700 border border-indigo-500 rounded px-1 py-0.5 text-xs outline-none" value={tempLayerName} onChange={(e) => setTempLayerName(e.target.value)} onBlur={saveLayerName} onKeyDown={(e) => e.key === 'Enter' && saveLayerName()} onClick={(e) => e.stopPropagation()} /> ) : ( <span className="truncate text-gray-700 dark:text-gray-300 font-medium cursor-text select-none" onDoubleClick={(e) => { e.stopPropagation(); startRenaming(el.id, el.name); }} title="Double click to rename" > {el.name} </span> )}
                                    {!isRenaming && ( <Pencil size={10} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-indigo-500" onClick={(e) => { e.stopPropagation(); startRenaming(el.id, el.name); }} /> )}
                                </div>
                                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-2"> <button onClick={(e) => { e.stopPropagation(); moveLayer(originalIndex, 'up'); }} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"><ArrowUp size={12} /></button> <button onClick={(e) => { e.stopPropagation(); moveLayer(originalIndex, 'down'); }} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"><ArrowDown size={12} /></button> <button onClick={(e) => { e.stopPropagation(); toggleElementVisibility(el.id); }} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded">{el.visible === false ? <EyeOff size={12} /> : <Eye size={12} />}</button> <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"><Trash2 size={12} /></button> </div>
                            </div>
                        );
                    })}
                </div>
            </div>
          </div>

          <div className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 cursor-col-resize flex-none z-30 transition-colors" onMouseDown={startResizingLeft}></div>

          {/* --- COLUMN 2: CENTER --- */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-black/20 relative overflow-hidden transition-colors min-w-0">
             {/* Sub-Header for Scene Selection & Zoom Controls (Updated) */}
             <div className="h-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-20 shrink-0">
                <div className="flex items-center gap-3"> <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm">Scene {scenes.findIndex(s => s.id === activeSceneId) + 1}</h3> </div>
                
                {/* MOVED ZOOM CONTROLS HERE */}
                <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                    <button onClick={handleZoomOut} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-colors" title="Zoom Out"><ZoomOut size={14} /></button>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 w-10 text-center select-none font-mono">{Math.round(zoom * 100)}%</span>
                    <button onClick={handleZoomIn} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-colors" title="Zoom In"><ZoomIn size={14} /></button>
                    <div className="w-px h-3 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                    <button onClick={handleZoomFit} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 transition-colors flex items-center gap-1" title="Fit to Screen"><Scan size={14} /></button>
                </div>
             </div>

             <div ref={viewportRef} className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 relative custom-scrollbar" onClick={() => setSelectedElementId(null)}>
                 <div className="flex items-center justify-center min-w-full min-h-full origin-center p-10" style={{ width: Math.max(viewportRef.current?.clientWidth || 0, canvasSize.width * zoom + 100), height: Math.max(viewportRef.current?.clientHeight || 0, canvasSize.height * zoom + 100) }}>
                    <div className="relative flex-shrink-0 transition-transform duration-200 ease-out select-none shadow-2xl" style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, minWidth: `${canvasSize.width}px`, minHeight: `${canvasSize.height}px`, transform: `scale(${zoom})`, transformOrigin: 'center center' }} onClick={(e) => e.stopPropagation()} >
                         <div className="absolute inset-0 pointer-events-none z-[60]" style={{ boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)' }}></div>
                        <div className="absolute inset-0 bg-white ring-1 ring-black/5 dark:ring-white/10 overflow-visible" style={{ backgroundColor: activeScene.background, outline: '2px dashed rgba(128,128,128,0.3)', outlineOffset: '2px' }} onDragOver={handleDragOver} onDrop={handleDrop}>
                            <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-50"> <span className="bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium text-white shadow-sm flex items-center gap-1 border border-white/10"><Clock size={10}/> {currentTime.toFixed(1)}s</span> </div>
                            {activeScene.elements.map((el, index) => {
                                const elStart = el.startTime || 0; const elDuration = el.duration || activeScene.duration; const isVisibleInTimeline = el.loop || (currentTime >= elStart && currentTime <= (elStart + elDuration));
                                if (el.visible === false || !isVisibleInTimeline) return null;
                                const isSelected = selectedElementId === el.id; const animationClass = getAnimationClass(el, currentTime);
                                return (
                                    <div key={el.id} draggable onDragStart={(e) => handleDragStart(e, el.id)} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }} style={{ position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height, zIndex: index, opacity: isDragging && dragPreview?.id === el.id ? 0.3 : 1 }} className={`cursor-move group hover:ring-2 hover:ring-indigo-300 ${isSelected ? 'ring-2 ring-indigo-600 shadow-lg' : ''} ${animationClass}`} >
                                        {el.type === 'image' && <img src={el.content} alt="" className="w-full h-full object-cover rounded-md pointer-events-none select-none" />}
                                        {el.type === 'text' && <p className="w-full h-full p-2 break-words text-gray-800 select-none">{el.content}</p>}
                                        {el.type === 'button' && <button className="w-full h-full bg-black text-white rounded-full text-sm font-medium pointer-events-none">Link Button</button>}
                                        {el.type === 'video' && ( <video id={`video-${el.id}`} src={el.content} className="w-full h-full object-cover rounded-md pointer-events-none select-none bg-black" muted playsInline loop={el.loop} /> )}
                                        {el.type === 'audio' && <div className="w-full h-full bg-orange-100 border border-orange-300 rounded-full flex items-center justify-center text-orange-600 shadow-md"><Music size={24} /></div>}
                                        {isSelected && (el.type === 'image' || el.type === 'video') && ( <> <div onMouseDown={(e) => startElementResize(e, el.id, 'e')} className="absolute top-1/2 -right-3 -mt-3 w-6 h-6 bg-white border border-indigo-200 rounded-full shadow-md flex items-center justify-center cursor-ew-resize hover:bg-indigo-50 z-[70] transform hover:scale-110 transition-transform"><MoveHorizontal size={12} className="text-indigo-600"/></div> <div onMouseDown={(e) => startElementResize(e, el.id, 's')} className="absolute -bottom-3 left-1/2 -ml-3 w-6 h-6 bg-white border border-indigo-200 rounded-full shadow-md flex items-center justify-center cursor-ns-resize hover:bg-indigo-50 z-[70] transform hover:scale-110 transition-transform"><MoveVertical size={12} className="text-indigo-600"/></div> <div onMouseDown={(e) => startElementResize(e, el.id, 'se')} className="absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-600 border border-white rounded-full shadow-md flex items-center justify-center cursor-nwse-resize hover:bg-indigo-700 z-[70] transform hover:scale-110 transition-transform"><MoveDiagonal size={12} className="text-white"/></div> </> )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                 </div>
             </div>

             <div onMouseDown={startResizingTimeline} className="w-full h-1 cursor-row-resize bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 transition-colors z-20"></div>

             <div style={{ height: timelineHeight }} className="flex-none bg-white dark:bg-slate-900 flex flex-col overflow-hidden transition-colors w-full border-t border-slate-200 dark:border-slate-800">
                 <div className="h-10 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 justify-between bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                        <button onClick={togglePlayback} className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors">{isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5"/>}</button>
                        <button onClick={() => { setCurrentTime(0); setIsPlaying(false); }} className="p-2 text-slate-500 hover:text-indigo-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><RefreshCw size={14} /></button>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 ml-2">{currentTime.toFixed(1)}s</span>
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">Timeline</div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex">
                    <div className="w-48 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 sticky left-0">
                        <div className="h-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-20"></div>
                        {activeScene.elements.map(el => (
                            <div key={el.id} onClick={() => setSelectedElementId(el.id)} className={`h-8 border-b border-slate-100 dark:border-slate-800 flex items-center px-3 text-xs truncate cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 ${selectedElementId === el.id ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                                {el.type === 'text' && <Type size={12} className="mr-2 opacity-70 flex-shrink-0" />} {el.type === 'image' && <ImageIcon size={12} className="mr-2 opacity-70 flex-shrink-0" />} {el.type === 'video' && <Video size={12} className="mr-2 opacity-70 flex-shrink-0" />} {el.type === 'audio' && <Music size={12} className="mr-2 opacity-70 flex-shrink-0" />}
                                <span className="truncate">{el.name}</span>
                                {el.loop && <Repeat size={10} className="ml-auto text-indigo-500" />}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 relative bg-slate-50/50 dark:bg-slate-950/50 min-w-[300px]" ref={timelineRef} onClick={handleTimelineScrub}>
                        <div className="h-6 border-b border-slate-200 dark:border-slate-800 flex items-end select-none bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">{Array.from({ length: Math.ceil(activeScene.duration) + 1 }).map((_, i) => (<div key={i} className="absolute text-[9px] text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-1 h-3" style={{ left: `${(i / activeScene.duration) * 100}%` }}>{i}s</div>))}</div>
                        <div className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none" style={{ left: `${(currentTime / activeScene.duration) * 100}%` }}><div className="w-3 h-3 -ml-1.5 bg-red-500 rounded-full absolute top-0 shadow-sm"></div></div>
                        <div className="relative">
                            {activeScene.elements.map(el => {
                                if (el.loop) { return ( <div key={el.id} className="h-8 border-b border-slate-100 dark:border-slate-800 relative group bg-indigo-50/50 dark:bg-indigo-900/10"> <div className="absolute top-1.5 bottom-1.5 left-0 right-0 mx-2 rounded-md flex items-center justify-center px-2 cursor-pointer border border-dashed border-indigo-300 dark:border-indigo-700 text-indigo-400 text-[9px] uppercase tracking-wider" onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}> <Repeat size={10} className="mr-1"/> {el.name} </div> </div> ) }
                                const startPercent = ((el.startTime || 0) / activeScene.duration) * 100; const durationVal = el.duration || activeScene.duration; const widthPercent = (durationVal / activeScene.duration) * 100; const finalWidth = Math.min(widthPercent, 100 - startPercent); const isSelected = selectedElementId === el.id;
                                return ( <div key={el.id} className="h-8 border-b border-slate-100 dark:border-slate-800 relative group"> <div className={`absolute top-1.5 bottom-1.5 rounded-md text-[9px] flex items-center px-2 overflow-visible cursor-pointer shadow-sm transition-all ${isSelected ? 'bg-indigo-500 text-white z-10' : 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-300 dark:hover:bg-indigo-800'}`} style={{ left: `${startPercent}%`, width: `${finalWidth}%` }} onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}> <span className="truncate opacity-80 select-none pointer-events-none">{el.name.substring(0, 15)}</span> {isSelected && ( <> <div onMouseDown={(e) => startTimelineResize(e, el.id, 'left')} className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize hover:bg-white/20 flex items-center justify-center group/handle" title="Drag to Resize Start" > <GripVertical size={8} className="text-white/50 group-hover/handle:text-white" /> </div> <div onMouseDown={(e) => startTimelineResize(e, el.id, 'right')} className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 flex items-center justify-center group/handle" title="Drag to Resize Duration" > <GripVertical size={8} className="text-white/50 group-hover/handle:text-white" /> </div> </> )} </div> </div> );
                            })}
                        </div>
                    </div>
                </div>
             </div>
          </div>

          <div className="w-1 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-500 cursor-col-resize flex-none z-30 transition-colors" onMouseDown={startResizingRight}></div>

          {/* --- COLUMN 3: RIGHT SIDEBAR --- */}
          <div style={{ width: rightSidebarWidth }} className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col transition-colors overflow-hidden shrink-0">
              <div className="flex-1 border-b border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                <div className="p-4 pb-0 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2 text-sm uppercase tracking-wide"><Settings size={14} /> Properties</h3>
                        {selectedElementId && ( <div className="flex gap-2"> <button onClick={() => deleteElement(selectedElementId)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded" title="Delete Element"><Trash2 size={14} /></button> <button onClick={() => setSelectedElementId(null)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded" title="Close Properties"><X size={14} /></button> </div> )}
                    </div>
                    {selectedElementId && ( <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4"> <button onClick={() => setActivePropTab('design')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-md transition-all ${activePropTab === 'design' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} > <Paintbrush size={12} /> Design </button> <button onClick={() => setActivePropTab('animate')} className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-1.5 rounded-md transition-all ${activePropTab === 'animate' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`} > <Film size={12} /> Animate </button> </div> )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {selectedElementId ? (
                        <div className="animate-fade-in space-y-4">
                            {activePropTab === 'design' && (
                                <>
                                    <div className="space-y-2"> <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Layer Name</label> <input className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={activeScene.elements.find(e => e.id === selectedElementId)?.name} onChange={(e) => updateElement(selectedElementId, { name: e.target.value })} /> </div>
                                    {activeScene.elements.find(e => e.id === selectedElementId)?.type === 'text' && ( <div className="space-y-2"> <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Content</label> <textarea className="w-full text-sm border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" rows={2} value={activeScene.elements.find(e => e.id === selectedElementId)?.content} onChange={(e) => updateElement(selectedElementId, { content: e.target.value })} /> <button onClick={handleMagicText} disabled={isGenerating} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-1.5 rounded-md text-xs font-bold shadow-sm transition-all"><Wand2 size={12} /> {isGenerating ? '...' : 'Magic Rewrite'}</button> </div> )}
                                    <div> <div className="flex justify-between items-center mb-1"> <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Dimensions</span> <button onClick={() => { const el = activeScene.elements.find(e => e.id === selectedElementId); if (el) updateElement(selectedElementId, { lockAspectRatio: !el.lockAspectRatio }); }} className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${activeScene.elements.find(e => e.id === selectedElementId)?.lockAspectRatio ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400'}`} title="Lock Aspect Ratio" > {activeScene.elements.find(e => e.id === selectedElementId)?.lockAspectRatio ? <Link2 size={14}/> : <Unlink size={14}/>} </button> </div> <div className="grid grid-cols-2 gap-3"> <div><label className="text-[10px] text-gray-400">Width</label><input type="number" className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-sm outline-none" value={activeScene.elements.find(e => e.id === selectedElementId)?.width} onChange={(e) => updateElement(selectedElementId, { width: parseInt(e.target.value) || 0 })} /></div> <div><label className="text-[10px] text-gray-400">Height</label><input type="number" className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-sm outline-none" value={activeScene.elements.find(e => e.id === selectedElementId)?.height} onChange={(e) => updateElement(selectedElementId, { height: parseInt(e.target.value) || 0 })} /></div> </div> </div>
                                    {activeScene.elements.find(e => e.id === selectedElementId)?.type === 'video' && ( <div className="flex items-center justify-between mt-2 mb-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"> <div className="flex flex-col"> <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2"> <Repeat size={14} /> Loop Background </span> <span className="text-[9px] text-gray-400">Set as background & ignore timeline</span> </div> <button onClick={() => selectedElementId && toggleVideoLoop(selectedElementId)} className={`w-8 h-4 rounded-full transition-colors relative ${activeScene.elements.find(e => e.id === selectedElementId)?.loop ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`} > <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${activeScene.elements.find(e => e.id === selectedElementId)?.loop ? 'left-4.5' : 'left-0.5'}`} style={{ left: activeScene.elements.find(e => e.id === selectedElementId)?.loop ? 'calc(100% - 14px)' : '2px' }}></div> </button> </div> )}
                                </>
                            )}
                            {activePropTab === 'animate' && (
                                <>
                                    {activeScene.elements.find(e => e.id === selectedElementId)?.loop ? ( <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs text-center"> Animations are disabled for looping backgrounds. </div> ) : (
                                        <>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700"> <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Clock size={10}/> Timeline (Seconds)</h4> <div className="grid grid-cols-2 gap-2"> <div> <label className="text-[10px] text-gray-500 dark:text-gray-400">Start Time</label> <input type="number" step="0.5" min="0" max={activeScene.duration} className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1 text-xs outline-none" value={activeScene.elements.find(e => e.id === selectedElementId)?.startTime || 0} onChange={(e) => updateElement(selectedElementId, { startTime: parseFloat(e.target.value) })} /> </div> <div> <label className="text-[10px] text-gray-500 dark:text-gray-400">Duration</label> <input type="number" step="0.5" min="0.5" className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1 text-xs outline-none" value={activeScene.elements.find(e => e.id === selectedElementId)?.duration || activeScene.duration} onChange={(e) => updateElement(selectedElementId, { duration: parseFloat(e.target.value) })} /> </div> </div> </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"> <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2"> <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">In</span> </div> <div className="p-3 bg-white dark:bg-slate-900/50"> <select className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-500" value={activeScene.elements.find(e => e.id === selectedElementId)?.animationEntry || 'none'} onChange={(e) => updateElement(selectedElementId, { animationEntry: e.target.value as any })} > <option value="none">None</option> <option value="fade-in">Fade In</option> <option value="slide-up">Slide Up (Smooth)</option> <option value="slide-down">Slide Down (Smooth)</option> <option value="pop-in">Pop In (Elastic)</option> <option value="blur-in">Blur In</option> <option value="elastic-right">Elastic Slide Right</option> </select> </div> </div>
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"> <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2"> <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Custom</span> </div> <div className="p-3 bg-white dark:bg-slate-900/50"> <select className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500" value={activeScene.elements.find(e => e.id === selectedElementId)?.animationEmphasis || 'none'} onChange={(e) => updateElement(selectedElementId, { animationEmphasis: e.target.value as any })} > <option value="none">None</option> <option value="pulse">Pulse (Breathing)</option> <option value="float">Float (Levitate)</option> <option value="shake">Shake (Attention)</option> <option value="heartbeat">Heartbeat</option> </select> </div> </div>
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"> <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2"> <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">Out</span> </div> <div className="p-3 bg-white dark:bg-slate-900/50"> <select className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-red-500" value={activeScene.elements.find(e => e.id === selectedElementId)?.animationExit || 'none'} onChange={(e) => updateElement(selectedElementId, { animationExit: e.target.value as any })} > <option value="none">None</option> <option value="fade-out">Fade Out</option> <option value="slide-out-down">Slide Out Down</option> <option value="slide-out-up">Slide Out Up</option> <option value="pop-out">Pop Out</option> <option value="blur-out">Blur Out</option> </select> </div> </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-slate-400 text-xs italic bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">No element selected</div>
                    )}
                </div>
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <div onClick={() => setShowCanvasSettings(!showCanvasSettings)} className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"> <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Monitor size={14} /> Canvas Settings</h3> {showCanvasSettings ? <ChevronDown size={14} /> : <ChevronUp size={14} />} </div>
                {showCanvasSettings && ( <div className="p-4 pt-0 grid grid-cols-2 gap-3"> <div> <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Width (px)</label> <input type="number" value={canvasSize.width} onChange={(e) => setCanvasSize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-xs outline-none" /> </div> <div> <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block">Height (px)</label> <input type="number" value={canvasSize.height} onChange={(e) => setCanvasSize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded p-1.5 text-xs outline-none" /> </div> </div> )}
              </div>

              <div className="h-56 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 border-t">
                  <div className="p-4 pb-2 flex items-center justify-between shrink-0"> <h3 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><GripVertical size={14} /> Scenes</h3> <button onClick={addScene} className="text-xs flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-100 transition-colors"><Plus size={12} /> Add</button> </div>
                  <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 custom-scrollbar">
                    {scenes.map((scene, idx) => (
                        <div key={scene.id} className={`rounded-lg border transition-all ${activeSceneId === scene.id ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 ring-1 ring-indigo-100 dark:ring-indigo-900 shadow-sm' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'}`}>
                            <div onClick={() => { setActiveSceneId(scene.id); setCurrentTime(0); }} className="p-3 flex items-center justify-between cursor-pointer">
                                <div><h4 className={`text-sm font-medium ${activeSceneId === scene.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>Scene {idx + 1}</h4><p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock size={10} /> {scene.duration}s</p></div>
                                <div className="flex items-center gap-1"> <button onClick={(e) => { e.stopPropagation(); moveScene(idx, 'up'); }} disabled={idx === 0} className="text-slate-400 hover:text-indigo-500 disabled:opacity-20 p-1"><ArrowUp size={12} /></button> <button onClick={(e) => { e.stopPropagation(); moveScene(idx, 'down'); }} disabled={idx === scenes.length - 1} className="text-slate-400 hover:text-indigo-500 disabled:opacity-20 p-1"><ArrowDown size={12} /></button> <button onClick={(e) => { e.stopPropagation(); toggleSceneSettings(scene.id); }} className={`p-1 rounded transition-colors ${expandedSceneSettingsId === scene.id ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50' : 'text-slate-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}><Settings size={12} /></button> <button onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); }} className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded ml-1"><Trash2 size={12} /></button> </div>
                            </div>
                            {expandedSceneSettingsId === scene.id && ( <div className="px-3 pb-3 pt-0 animate-fade-in border-t border-gray-100 dark:border-slate-700/50 mt-1"> <div className="pt-3 space-y-3"> <div><div className="flex justify-between text-[10px] mb-1"><span className="text-slate-500">Duration</span><span className="text-indigo-600 font-bold">{scene.duration}s</span></div><input type="range" min="1" max="15" value={scene.duration} onChange={(e) => { const updatedScenes = scenes.map(s => s.id === scene.id ? { ...s, duration: parseInt(e.target.value) } : s); setScenes(updatedScenes); }} className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" /></div> <div><span className="text-[10px] text-slate-500 block mb-1">Background</span><div className="flex gap-1.5 flex-wrap">{['#ffffff', '#000000', '#f3f4f6', '#1f2937', '#fee2e2', '#e0e7ff', '#dcfce7', '#ffedd5'].map(c => (<div key={c} onClick={() => { const updatedScenes = scenes.map(s => s.id === scene.id ? { ...s, background: c } : s); setScenes(updatedScenes); }} className={`w-5 h-5 rounded-full cursor-pointer border border-gray-200 dark:border-slate-600 shadow-sm ${scene.background === c ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`} style={{ backgroundColor: c }} />))}</div></div> </div> </div> )}
                        </div>
                    ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default DynamicBuilder;