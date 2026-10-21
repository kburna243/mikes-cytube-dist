import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Search,
  Filter,
  User,
  MapPin,
  Sparkles,
  Layers,
  HelpCircle,
  X,
  Volume2,
  Check,
  Plus,
  Trash2,
  Star,
  Eye,
  List,
  Target,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { Entity, Relation, PlotThread, TimelineEvent, AccessibilitySettings } from '../../types/domain.js';
import { speechService } from '../../services/speech.js';
import { api } from '../../services/api.js';

export type GraphNodeType = 'character' | 'location' | 'event' | 'fact' | 'cluster';

export interface GraphNode {
  id: string;
  name: string;
  type: GraphNodeType;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  color?: string;
  role?: string;
  description?: string;
  cluster?: string;
  isImportant?: boolean;
  metadata?: Record<string, any>;
  hidden?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: 'positive' | 'neutral' | 'negative';
  isImportant?: boolean;
  notes?: string;
}

export interface GraphViewProps {
  entities: Entity[];
  relations: Relation[];
  threads?: PlotThread[];
  timeline?: TimelineEvent[];
  accessibility: AccessibilitySettings;
  onAskCopilot?: (prompt: string, context?: { entityId?: string; threadId?: string; relationId?: string }) => void;
  onSwitchToList?: () => void;
}

// Default Krimi-Beispieldatensatz gemäß Spezifikation
const DEFAULT_CRIME_NODES: GraphNode[] = [
  {
    id: 'char-miller',
    name: 'Detektiv Miller',
    type: 'character',
    x: 350,
    y: 280,
    color: '#fbbf24', // Warmes Gelb
    role: 'Hauptfigur / Ermittler',
    description: 'Scharfsinniger Privatdetektiv mit Gespür für Ungereimtheiten. Untersucht den Tod von Arthur.',
    cluster: 'Ermittler',
    isImportant: true,
  },
  {
    id: 'char-sarah',
    name: 'Verdächtige Sarah',
    type: 'character',
    x: 620,
    y: 200,
    color: '#f43f5e', // Karminrot
    role: 'Hauptverdächtige',
    description: 'Nichte des Opfers und Haupterbin. Hatte am Vorabend einen heftigen Streit mit Arthur.',
    cluster: 'Verdächtige',
    isImportant: true,
  },
  {
    id: 'char-bob',
    name: 'Zeuge Bob',
    type: 'character',
    x: 200,
    y: 450,
    color: '#38bdf8', // Himmelblau
    role: 'Zeuge / Gärtner',
    description: 'Langjähriger Gärtner des Anwesens. Beobachtete verdächtige Gestalten im Park.',
    cluster: 'Zeugen',
    isImportant: false,
  },
  {
    id: 'char-arthur',
    name: 'Opfer Arthur',
    type: 'character',
    x: 580,
    y: 440,
    color: '#94a3b8', // Schiefergrau
    role: 'Opfer / Patriarch',
    description: 'Wohlhabender Kunsthändler, tot in seinem Arbeitszimmer aufgefunden.',
    cluster: 'Opfer',
    isImportant: true,
  },
  // 2 Plot-Events
  {
    id: 'event-mord',
    name: 'Mord an Arthur',
    type: 'event',
    x: 480,
    y: 350,
    color: '#e11d48',
    role: 'Schlüsselereignis',
    description: 'Todesfall in der Nacht zum Dienstag durch ein unbekanntes Pflanzengift.',
    cluster: 'Plot',
    isImportant: true,
  },
  {
    id: 'event-testament',
    name: 'Entdeckung des Testaments',
    type: 'event',
    x: 740,
    y: 320,
    color: '#f59e0b',
    role: 'Wendepunkt',
    description: 'Ein geändertes Testament schließt Sarah kurz vor Arthurs Tod aus.',
    cluster: 'Plot',
    isImportant: true,
  },
  // Ort
  {
    id: 'loc-herrenhaus',
    name: 'Kaminzimmer Herrenhaus',
    type: 'location',
    x: 400,
    y: 120,
    color: '#10b981', // Smaragdgrün
    role: 'Tatort',
    description: 'Schwer zugänglicher Raum mit verriegelten Fenstern.',
    cluster: 'Schauplätze',
    isImportant: false,
  },
  // Gegenstand / Fakt
  {
    id: 'fact-gift',
    name: 'Giftfläschchen im Park',
    type: 'fact',
    x: 220,
    y: 260,
    color: '#a855f7',
    role: 'Beweismittel',
    description: 'Halb vergrabenes Glasfläschchen mit Bittermandelgeruch.',
    cluster: 'Beweise',
    isImportant: false,
  },
];

const DEFAULT_CRIME_EDGES: GraphEdge[] = [
  {
    id: 'edge-1',
    source: 'char-miller',
    target: 'char-sarah',
    label: 'verhört / verdächtigt',
    type: 'negative',
    isImportant: true,
    notes: 'Miller stellt Sarah gezielt Fragen zu ihrem Alibi.',
  },
  {
    id: 'edge-2',
    source: 'char-miller',
    target: 'char-bob',
    label: 'befragt Zeuge',
    type: 'neutral',
    isImportant: false,
    notes: 'Bob berichtet von Lichtern am Tatabend.',
  },
  {
    id: 'edge-3',
    source: 'char-sarah',
    target: 'char-arthur',
    label: 'erbt von / stritt mit',
    type: 'negative',
    isImportant: true,
    notes: 'Starker Erbstreit um das Familienvermögen.',
  },
  {
    id: 'edge-4',
    source: 'char-bob',
    target: 'char-arthur',
    label: 'war befreundet mit',
    type: 'positive',
    isImportant: false,
    notes: 'Bob schätzte Arthur seit dreißig Jahren.',
  },
  {
    id: 'edge-5',
    source: 'char-bob',
    target: 'char-sarah',
    label: 'beobachtete heimlich',
    type: 'neutral',
    isImportant: true,
    notes: 'Bob sah Sarah um Mitternacht im Park.',
  },
  {
    id: 'edge-6',
    source: 'char-arthur',
    target: 'event-mord',
    label: 'betroffen durch',
    type: 'negative',
    isImportant: true,
  },
  {
    id: 'edge-7',
    source: 'char-sarah',
    target: 'event-testament',
    label: 'belastet durch',
    type: 'negative',
    isImportant: true,
  },
];

export const GraphView: React.FC<GraphViewProps> = ({
  entities,
  relations,
  threads = [],
  timeline = [],
  accessibility,
  onAskCopilot,
  onSwitchToList,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Modus: Projekt-Daten oder Krimi-Demo
  const [useCrimeDemo, setUseCrimeDemo] = useState<boolean>(true);

  // Graph Daten States
  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_CRIME_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(DEFAULT_CRIME_EDGES);

  // Zoom & Pan
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 30 });

  // Filter
  const [showCharacters, setShowCharacters] = useState<boolean>(true);
  const [showLocations, setShowLocations] = useState<boolean>(true);
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [onlyImportant, setOnlyImportant] = useState<boolean>(false);
  const [enableClustering, setEnableClustering] = useState<boolean>(false);

  // Fokus-Modus
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Interaktions-States
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Kontextmenü State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    node: GraphNode | null;
  }>({ visible: false, x: 0, y: 0, node: null });

  // Dragging
  const isDraggingCanvas = useRef<boolean>(false);
  const isDraggingNode = useRef<string | null>(null);
  const dragStartPoint = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDist = useRef<number | null>(null);
  const initialTouchScale = useRef<number>(1.0);
  const longPressTimer = useRef<any>(null);

  // Save Debouncing
  const saveTimeoutRef = useRef<any>(null);

  // Reduced Motion Erkennung
  const prefersReducedMotion =
    accessibility.reducedMotion ||
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Initialisierung / Umschalten Projekt-Daten vs Demo
  useEffect(() => {
    if (useCrimeDemo) {
      setNodes(DEFAULT_CRIME_NODES);
      setEdges(DEFAULT_CRIME_EDGES);
      return;
    }

    // Wandle Entities & Relations in Graph Nodes/Edges um
    const projectNodes: GraphNode[] = entities.map((ent, i) => {
      let nodeType: GraphNodeType = 'character';
      if (ent.type === 'location') nodeType = 'location';
      else if (ent.type === 'item') nodeType = 'fact';

      // Gespeicherte Position oder Kreis-Layout
      const savedPos = (ent as any).position;
      const angle = (i / (entities.length || 1)) * 2 * Math.PI;
      const defaultX = 400 + Math.cos(angle) * 220;
      const defaultY = 300 + Math.sin(angle) * 180;

      return {
        id: ent.id,
        name: ent.name,
        type: nodeType,
        x: savedPos?.x ?? defaultX,
        y: savedPos?.y ?? defaultY,
        color: (ent as any).color || (nodeType === 'character' ? '#fbbf24' : '#10b981'),
        role: ent.type,
        description: ent.markdown_body,
        cluster: ent.threads[0] || 'Hauptgruppe',
        isImportant: (ent as any).isImportant ?? false,
      };
    });

    // Timeline Events hinzufügen
    timeline.forEach((tl, i) => {
      projectNodes.push({
        id: `tl-${tl.id}`,
        name: tl.title,
        type: 'event',
        x: 400 + (i % 2 === 0 ? 1 : -1) * 180,
        y: 200 + i * 90,
        color: '#f59e0b',
        role: 'Zeitleisten-Event',
        description: tl.description,
        cluster: 'Plot',
        isImportant: true,
      });
    });

    const projectEdges: GraphEdge[] = relations.map((rel) => {
      let nature: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (rel.type === 'liebt' || rel.type === 'verbuendet_mit' || rel.type === 'ist_geschwister_von') {
        nature = 'positive';
      } else if (rel.type === 'hasst' || rel.type === 'sucht') {
        nature = 'negative';
      }

      return {
        id: rel.id,
        source: rel.source_id,
        target: rel.target_id,
        label: rel.label,
        type: nature,
        isImportant: (rel as any).isImportant ?? false,
        notes: rel.notes,
      };
    });

    setNodes(projectNodes);
    setEdges(projectEdges);
  }, [useCrimeDemo, entities, relations, timeline]);

  // Debounced Position Save
  const debouncedSavePositions = useCallback((updatedNodes: GraphNode[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      const posMap: Record<string, { x: number; y: number }> = {};
      updatedNodes.forEach((n) => {
        posMap[n.id] = { x: Math.round(n.x), y: Math.round(n.y) };
      });
      // In localStorage zwischenspeichern
      try {
        localStorage.setItem('federfuehrer_graph_positions', JSON.stringify(posMap));
      } catch (e) {
        // ignore
      }
      // An Server senden
      api.saveNodePositions(posMap).catch((err) => {
        console.warn('Graph-Positionen konnten nicht gespeichert werden:', err);
      });
    }, 400);
  }, []);

  // Filterte Knoten & Kanten
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!showCharacters && n.type === 'character') return false;
      if (!showLocations && n.type === 'location') return false;
      if (!showEvents && n.type === 'event') return false;
      return true;
    });
  }, [nodes, showCharacters, showLocations, showEvents]);

  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => {
      if (!visibleNodeIds.has(e.source) || !visibleNodeIds.has(e.target)) return false;
      if (onlyImportant && !e.isImportant) return false;
      return true;
    });
  }, [edges, filteredNodes, onlyImportant]);

  // Fokus-Set (verbundene Nachbarn des fokussierten Knotens)
  const connectedNodeIds = useMemo(() => {
    if (!focusedNodeId) return null;
    const set = new Set<string>();
    set.add(focusedNodeId);
    filteredEdges.forEach((e) => {
      if (e.source === focusedNodeId) set.add(e.target);
      if (e.target === focusedNodeId) set.add(e.source);
    });
    return set;
  }, [focusedNodeId, filteredEdges]);

  // Clustering Berechnung (wenn aktiviert oder > 20 Knoten)
  const clusters = useMemo(() => {
    if (!enableClustering && filteredNodes.length <= 20) return null;
    const groupMap: Record<string, GraphNode[]> = {};
    filteredNodes.forEach((n) => {
      const g = n.cluster || 'Sonstige';
      if (!groupMap[g]) groupMap[g] = [];
      groupMap[g].push(n);
    });
    return groupMap;
  }, [enableClustering, filteredNodes]);

  // Canvas Neuzeichnen (60fps performance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina / DPI Skalierung
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Hintergrund-Gitter (Subtil)
    ctx.fillStyle = '#0f172a'; // sehr dunkles slate canvas
    ctx.fillRect(0, 0, width, height);

    // Gitterpunkte zur Orientierung
    ctx.fillStyle = '#1e293b';
    const gridSize = 40 * scale;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Transformation: Pan & Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);

    const nodePosMap = new Map<string, GraphNode>();
    filteredNodes.forEach((n) => nodePosMap.set(n.id, n));

    // 1. KANTEN ZEICHNEN
    filteredEdges.forEach((edge) => {
      const source = nodePosMap.get(edge.source);
      const target = nodePosMap.get(edge.target);
      if (!source || !target) return;

      const isFocused =
        !connectedNodeIds || (connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));
      const isHovered = hoveredEdgeId === edge.id;

      ctx.save();
      ctx.beginPath();

      // Linienstil nach Anforderung:
      // - Durchgezogen: Positiv
      // - Gestrichelt: Neutral
      // - Gepunktet: Negativ
      // - Dick/Fett: Wichtig
      if (edge.type === 'positive') {
        ctx.setLineDash([]);
        ctx.strokeStyle = isHovered ? '#34d399' : '#10b981'; // Smaragdgrün
      } else if (edge.type === 'neutral') {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = isHovered ? '#94a3b8' : '#64748b'; // Slate
      } else {
        // negative
        ctx.setLineDash([2, 5]);
        ctx.strokeStyle = isHovered ? '#fb7185' : '#e11d48'; // Karminrot
      }

      ctx.lineWidth = edge.isImportant ? 4 : 2;
      ctx.globalAlpha = isFocused ? (isHovered ? 1.0 : 0.85) : 0.15;

      // Linie zeichnen
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();

      // Pfeilspitze berechnen
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const angle = Math.atan2(dy, dx);
      const targetRadius = target.type === 'character' ? 28 : target.type === 'location' ? 32 : 24;
      const arrowX = target.x - Math.cos(angle) * (targetRadius + 6);
      const arrowY = target.y - Math.sin(angle) * (targetRadius + 6);

      ctx.setLineDash([]);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Kanten-Beschriftung (mittig)
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;

      ctx.font = 'bold 11px system-ui, sans-serif';
      const textWidth = ctx.measureText(edge.label).width;

      // Badge-Hintergrund
      ctx.fillStyle = '#020617';
      ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);
      ctx.strokeStyle = ctx.strokeStyle;
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);

      ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(edge.label, midX, midY);

      ctx.restore();
    });

    // 2. KNOTEN ZEICHNEN
    filteredNodes.forEach((node) => {
      const isFocused = !connectedNodeIds || connectedNodeIds.has(node.id);
      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNodeId === node.id;
      const isPrimaryFocus = focusedNodeId === node.id;

      ctx.save();
      ctx.globalAlpha = isFocused ? 1.0 : 0.15;

      const baseColor = node.color || '#fbbf24';

      // Leuchteffekt bei Auswahl / Fokus
      if (isSelected || isPrimaryFocus) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
      } else if (isHovered) {
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 12;
      }

      // KNOTEN-FORMEN NACH ANFORDERUNG:
      // Figuren = Kreis
      // Orte = Rechteck/Quadrat
      // Plot-Events = Raute/Diamant
      // Gegenstände/Fakten = Kleiner Kreis (gedimmt)
      if (node.type === 'character') {
        const radius = 26;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.stroke();

        // Icon oder Initialen
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.name.slice(0, 2).toUpperCase(), node.x, node.y);
      } else if (node.type === 'location') {
        const size = 44;
        const half = size / 2;
        ctx.beginPath();
        // Abgerundetes Rechteck
        ctx.roundRect(node.x - half, node.y - half, size, size, 8);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ORT', node.x, node.y);
      } else if (node.type === 'event') {
        // Raute / Diamant (45° gedreht)
        const size = 30;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y - size);
        ctx.lineTo(node.x + size, node.y);
        ctx.lineTo(node.x, node.y + size);
        ctx.lineTo(node.x - size, node.y);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeStyle = isSelected ? '#ffffff' : '#0f172a';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLOT', node.x, node.y);
      } else {
        // fact / item: kleiner Kreis, gedimmt, bei Hover sichtbar
        const radius = isHovered ? 16 : 10;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = isHovered ? 1.0 : isFocused ? 0.45 : 0.1;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Knoten-Label darunter
      ctx.shadowBlur = 0;
      ctx.globalAlpha = isFocused ? 1.0 : 0.15;
      ctx.font = isSelected || isPrimaryFocus ? 'bold 13px system-ui, sans-serif' : 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelY = node.type === 'event' ? node.y + 34 : node.y + 32;

      // Textschatten für maximale Lesbarkeit
      ctx.fillStyle = '#020617';
      const labelText = node.name;
      const tw = ctx.measureText(labelText).width;
      ctx.fillRect(node.x - tw / 2 - 3, labelY - 2, tw + 6, 17);

      ctx.fillStyle = isSelected || isPrimaryFocus ? '#fbbf24' : '#f8fafc';
      ctx.fillText(labelText, node.x, labelY);

      if (node.role && isFocused) {
        ctx.font = 'normal 10px system-ui, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(node.role, node.x, labelY + 16);
      }

      ctx.restore();
    });

    ctx.restore();
  }, [
    filteredNodes,
    filteredEdges,
    scale,
    pan,
    hoveredNodeId,
    hoveredEdgeId,
    selectedNode,
    focusedNodeId,
    connectedNodeIds,
  ]);

  // Canvas Koordinaten Umrechnung
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, screenX: 0, screenY: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    return {
      x: (screenX - pan.x) / scale,
      y: (screenY - pan.y) / scale,
      screenX,
      screenY,
    };
  };

  // Finde Knoten an Koordinaten
  const findNodeAt = (x: number, y: number): GraphNode | null => {
    for (let i = filteredNodes.length - 1; i >= 0; i--) {
      const n = filteredNodes[i];
      const dist = Math.hypot(n.x - x, n.y - y);
      const hitRadius = n.type === 'character' ? 30 : n.type === 'location' ? 32 : 28;
      if (dist <= hitRadius) return n;
    }
    return null;
  };

  // Zoom-Aktionen
  const handleZoom = (factor: number) => {
    setScale((prev) => {
      const next = Math.max(0.1, Math.min(2.0, prev * factor));
      return Number(next.toFixed(2));
    });
  };

  const handleResetZoom = () => {
    setScale(1.0);
    setPan({ x: 50, y: 30 });
    setFocusedNodeId(null);
  };

  // Fokus auf bestimmten Knoten
  const focusOnNode = (node: GraphNode) => {
    setFocusedNodeId(node.id);
    setSelectedNode(node);
    // Zentriere den Knoten auf die Bildschirmmitte
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const targetScale = 1.5;
      const targetPanX = rect.width / 2 - node.x * targetScale;
      const targetPanY = rect.height / 2 - node.y * targetScale;
      setScale(targetScale);
      setPan({ x: targetPanX, y: targetPanY });
    }
  };

  // Maus- & Touch-Events für Pan, Zoom, Pinch & Drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 2) return; // Rechtsklick wird separat behandelt
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    if (hitNode) {
      isDraggingNode.current = hitNode.id;
      dragStartPoint.current = { x: hitNode.x - x, y: hitNode.y - y };
    } else {
      isDraggingCanvas.current = true;
      dragStartPoint.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // Dragging Knoten
    if (isDraggingNode.current) {
      const nodeId = isDraggingNode.current;
      setNodes((prev) => {
        const next = prev.map((n) =>
          n.id === nodeId ? { ...n, x: x + dragStartPoint.current.x, y: y + dragStartPoint.current.y } : n
        );
        debouncedSavePositions(next);
        return next;
      });
      return;
    }

    // Dragging Canvas Pan
    if (isDraggingCanvas.current) {
      setPan({
        x: e.clientX - dragStartPoint.current.x,
        y: e.clientY - dragStartPoint.current.y,
      });
      return;
    }

    // Hover Erkennung
    const hitNode = findNodeAt(x, y);
    setHoveredNodeId(hitNode?.id || null);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingNode.current) {
      isDraggingNode.current = null;
    }
    if (isDraggingCanvas.current) {
      isDraggingCanvas.current = false;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);

    if (hitNode) {
      setSelectedNode(hitNode);
      setContextMenu((prev) => ({ ...prev, visible: false }));
    } else {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);
    if (hitNode) {
      focusOnNode(hitNode);
    } else {
      handleResetZoom();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    handleZoom(zoomFactor);
  };

  // Rechtsklick-Kontextmenü
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y, screenX, screenY } = getCanvasCoords(e.clientX, e.clientY);
    const hitNode = findNodeAt(x, y);
    setContextMenu({
      visible: true,
      x: screenX,
      y: screenY,
      node: hitNode,
    });
  };

  // Touch-Handling mit Pinch-to-Zoom und Long-Press
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Pinch to Zoom
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      initialTouchScale.current = scale;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y, screenX, screenY } = getCanvasCoords(touch.clientX, touch.clientY);
      const hitNode = findNodeAt(x, y);

      if (hitNode) {
        isDraggingNode.current = hitNode.id;
        dragStartPoint.current = { x: hitNode.x - x, y: hitNode.y - y };

        // Long Press für Kontextmenü auf Tablets
        longPressTimer.current = setTimeout(() => {
          setContextMenu({
            visible: true,
            x: screenX,
            y: screenY,
            node: hitNode,
          });
        }, 550);
      } else {
        isDraggingCanvas.current = true;
        dragStartPoint.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      const nextScale = Math.max(0.1, Math.min(2.0, initialTouchScale.current * factor));
      setScale(Number(nextScale.toFixed(2)));
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);

      if (isDraggingNode.current) {
        const nodeId = isDraggingNode.current;
        setNodes((prev) => {
          const next = prev.map((n) =>
            n.id === nodeId ? { ...n, x: x + dragStartPoint.current.x, y: y + dragStartPoint.current.y } : n
          );
          debouncedSavePositions(next);
          return next;
        });
        return;
      }

      if (isDraggingCanvas.current) {
        setPan({
          x: touch.clientX - dragStartPoint.current.x,
          y: touch.clientY - dragStartPoint.current.y,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    touchStartDist.current = null;
    isDraggingNode.current = null;
    isDraggingCanvas.current = false;
  };

  // Tastatur-Navigation (TAB, Pfeile, ENTER, ESC)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      setFocusedNodeId(null);
      setSelectedNode(null);
      setContextMenu((prev) => ({ ...prev, visible: false }));
      return;
    }

    if (e.key === 'Tab') {
      // Wechsle zum nächsten Knoten
      e.preventDefault();
      const currentIndex = filteredNodes.findIndex((n) => n.id === (selectedNode?.id || focusedNodeId));
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + filteredNodes.length) % filteredNodes.length
        : (currentIndex + 1) % filteredNodes.length;
      const nextNode = filteredNodes[nextIndex];
      setSelectedNode(nextNode);
      speechService.speak(`Knoten: ${nextNode.name}, Typ: ${nextNode.role || nextNode.type}`);
      return;
    }

    if (e.key === 'Enter' && selectedNode) {
      focusOnNode(selectedNode);
      return;
    }

    // Pfeiltasten: Navigiere zu verbundenem Nachbarn
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedNode) {
      e.preventDefault();
      const connectedEdges = filteredEdges.filter(
        (ed) => ed.source === selectedNode.id || ed.target === selectedNode.id
      );
      if (connectedEdges.length > 0) {
        const targetId =
          connectedEdges[0].source === selectedNode.id
            ? connectedEdges[0].target
            : connectedEdges[0].source;
        const neighbor = filteredNodes.find((n) => n.id === targetId);
        if (neighbor) {
          setSelectedNode(neighbor);
          speechService.speak(`Sprung zu verbundenem Knoten: ${neighbor.name}`);
        }
      }
    }
  };

  // Suche ausführen
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredNodes.filter((n) =>
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, filteredNodes]);

  // Kontextmenü-Aktionen
  const handleAddRelationFromContext = () => {
    if (!contextMenu.node) return;
    const sourceNode = contextMenu.node;
    // Öffne Dialog oder füge Beziehung mit nächstem Knoten hinzu
    const other = filteredNodes.find((n) => n.id !== sourceNode.id);
    if (other) {
      const newEdge: GraphEdge = {
        id: `rel-${Date.now()}`,
        source: sourceNode.id,
        target: other.id,
        label: 'neu verknüpft',
        type: 'neutral',
        isImportant: true,
      };
      setEdges((prev) => [...prev, newEdge]);
      speechService.speak(`Neue Beziehung zwischen ${sourceNode.name} und ${other.name} angelegt.`);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteNodeFromContext = () => {
    if (!contextMenu.node) return;
    const targetId = contextMenu.node.id;
    setNodes((prev) => prev.filter((n) => n.id !== targetId));
    setEdges((prev) => prev.filter((e) => e.source !== targetId && e.target !== targetId));
    if (selectedNode?.id === targetId) setSelectedNode(null);
    if (focusedNodeId === targetId) setFocusedNodeId(null);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleToggleImportantFromContext = () => {
    if (!contextMenu.node) return;
    const targetId = contextMenu.node.id;
    setNodes((prev) =>
      prev.map((n) => (n.id === targetId ? { ...n, isImportant: !n.isImportant } : n))
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Interaktiver Beziehungs- und Plot-Graph"
      className="relative w-full rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-canvas)] overflow-hidden shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent)]"
    >
      {/* 1. OBERE STEUERUNGSLEISTE: FILTER, SUCHE & A11Y TOGGLE */}
      <div className="p-3 bg-[var(--bg-surface)] border-b-2 border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3 z-20 relative">
        {/* Ansichts-Wechsler (Listenansicht vs Graph) */}
        <div className="flex items-center gap-2">
          {onSwitchToList && (
            <button
              onClick={onSwitchToList}
              className="touch-target px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent)] text-xs font-bold flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              aria-label="Zurück zur barrierefreien Listenansicht wechseln"
            >
              <List className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
              <span>Listenansicht</span>
            </button>
          )}

          {/* Dataset Switcher (Krimi-Demo vs Eigenes Manuskript) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)]">
            <button
              onClick={() => {
                setUseCrimeDemo(true);
                setFocusedNodeId(null);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                useCrimeDemo
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Krimi-Demo
            </button>
            <button
              onClick={() => {
                setUseCrimeDemo(false);
                setFocusedNodeId(null);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                !useCrimeDemo
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Manuskript-Daten
            </button>
          </div>
        </div>

        {/* Filter-Buttons (min. 48px touch target auf Tablet) */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Graphen-Filter">
          <button
            onClick={() => setShowCharacters(!showCharacters)}
            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
              showCharacters
                ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
            aria-pressed={showCharacters}
            aria-label="Figuren-Knoten anzeigen oder ausblenden"
          >
            <User className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Figuren</span>
          </button>

          <button
            onClick={() => setShowLocations(!showLocations)}
            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
              showLocations
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
            aria-pressed={showLocations}
            aria-label="Orte-Knoten anzeigen oder ausblenden"
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Orte</span>
          </button>

          <button
            onClick={() => setShowEvents(!showEvents)}
            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
              showEvents
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
            aria-pressed={showEvents}
            aria-label="Plot-Events anzeigen oder ausblenden"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Plot-Events</span>
          </button>

          <button
            onClick={() => setOnlyImportant(!onlyImportant)}
            className={`touch-target px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
              onlyImportant
                ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                : 'bg-[var(--bg-canvas)] text-[var(--text-muted)] border-[var(--border-color)]'
            }`}
            aria-pressed={onlyImportant}
            aria-label="Nur wichtige Plot-relevante Beziehungen anzeigen"
          >
            <Star className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nur wichtige Kanten</span>
          </button>
        </div>

        {/* Suchfeld mit Autocomplete */}
        <div className="relative w-full sm:w-64">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder="Knoten suchen..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              aria-label="Knoten nach Name oder Rolle durchsuchen"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label="Suche leeren"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    focusOnNode(res);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-[var(--bg-canvas)] flex items-center justify-between transition-colors"
                >
                  <span className="font-bold text-[var(--text-primary)]">{res.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{res.role || res.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. DEMO-HINWEIS & FOKUS-DEMO BANNER (wenn Krimi-Demo aktiv ist) */}
      {useCrimeDemo && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span>
              <strong>Krimi-Beispieldatensatz aktiv:</strong> 4 Figuren, 5 Beziehungen, 2 Plot-Events.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const miller = nodes.find((n) => n.id === 'char-miller');
                if (miller) focusOnNode(miller);
              }}
              className="touch-target px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] font-bold text-xs hover:opacity-90 flex items-center gap-1.5 shadow-sm"
              aria-label="Fokus auf Detektiv Miller aktivieren"
            >
              <Target className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Demo: Fokus auf Detektiv Miller</span>
            </button>
            {focusedNodeId && (
              <button
                onClick={() => setFocusedNodeId(null)}
                className="touch-target px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold text-xs hover:border-[var(--accent)]"
                aria-label="Fokus-Modus aufheben"
              >
                Fokus aufheben
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. AKTIVER FOKUS-HINWEIS */}
      {focusedNodeId && !useCrimeDemo && (
        <div className="bg-[var(--accent)]/15 border-b border-[var(--accent)]/30 px-4 py-2 flex items-center justify-between text-xs text-[var(--accent)]">
          <span>
            Fokus-Modus aktiv: Zeigt nur direkte Verbindungen von{' '}
            <strong>{nodes.find((n) => n.id === focusedNodeId)?.name}</strong>.
          </span>
          <button
            onClick={() => setFocusedNodeId(null)}
            className="font-bold underline hover:opacity-80"
          >
            Fokus aufheben
          </button>
        </div>
      )}

      {/* 4. CANVAS BEREICH */}
      <div className="relative w-full h-[540px] sm:h-[620px] overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-grab active:cursor-grabbing block"
          style={{ touchAction: 'none' }}
          aria-label="Grafische Leinwand. Doppelklick zum Zentrieren, Ziehen zum Verschieben."
        />

        {/* Versteckte Screenreader Kanten & Knoten (WCAG AAA Anforderung) */}
        <div className="sr-only" aria-live="polite">
          <h4>Kantenbeschreibungen für Screenreader:</h4>
          <ul>
            {filteredEdges.map((e) => {
              const s = nodes.find((n) => n.id === e.source)?.name || e.source;
              const t = nodes.find((n) => n.id === e.target)?.name || e.target;
              return (
                <li key={e.id}>
                  <span>{`${s} ist ${e.label} von ${t}`}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Zoom & Canvas-Tools Floating Bar (unten links) */}
        <div className="absolute bottom-4 left-4 p-1.5 rounded-2xl bg-[var(--bg-surface)]/90 backdrop-blur-md border-2 border-[var(--border-color)] shadow-2xl flex items-center gap-1 z-30">
          <button
            onClick={() => handleZoom(1.15)}
            className="touch-target p-2.5 rounded-xl hover:bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            title="Vergrößern (+)"
            aria-label="Ansicht vergrößern"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.85)}
            className="touch-target p-2.5 rounded-xl hover:bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            title="Verkleinern (-)"
            aria-label="Ansicht verkleinern"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="px-2 text-xs font-mono font-bold text-[var(--text-secondary)] min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={handleResetZoom}
            className="touch-target p-2.5 rounded-xl hover:bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
            title="Zoom und Position zurücksetzen (ESC)"
            aria-label="Zoom zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Legende (unten rechts) */}
        <div className="hidden md:flex absolute bottom-4 right-4 p-3 rounded-2xl bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] space-y-1 z-30 shadow-lg pointer-events-none">
          <div className="font-bold text-[var(--text-primary)] mb-1">Legende & Stricharten</div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-400" /> Positiv (durchgezogen)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t border-dashed border-slate-400" /> Neutral (gestrichelt)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 border-t border-dotted border-rose-400" /> Negativ (gepunktet)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-[var(--accent)]" /> Wichtig / Plot-relevant
          </div>
        </div>

        {/* KONTEXTMENÜ (Rechtsklick / Long Press) */}
        {contextMenu.visible && (
          <div
            style={{ left: Math.min(contextMenu.x, 320), top: Math.min(contextMenu.y, 400) }}
            className="absolute rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-color)] shadow-2xl p-2 z-50 min-w-[200px] animate-in fade-in"
          >
            <div className="px-3 py-1.5 border-b border-[var(--border-color)] mb-1 text-xs font-bold text-[var(--text-primary)]">
              {contextMenu.node ? contextMenu.node.name : 'Canvas Optionen'}
            </div>

            {contextMenu.node && (
              <>
                <button
                  onClick={() => {
                    focusOnNode(contextMenu.node!);
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[var(--accent)] hover:bg-[var(--bg-canvas)] flex items-center gap-2"
                >
                  <Target className="w-3.5 h-3.5" /> Fokus auf diesen Knoten
                </button>
                <button
                  onClick={handleAddRelationFromContext}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" /> Beziehung hinzufügen
                </button>
                <button
                  onClick={handleToggleImportantFromContext}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Als wichtig markieren
                </button>
                <button
                  onClick={handleDeleteNodeFromContext}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-[var(--bg-canvas)] flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Knoten löschen
                </button>
              </>
            )}
            <button
              onClick={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-canvas)] mt-1"
            >
              Schließen
            </button>
          </div>
        )}

        {/* SIDE-PANEL DETAILS (Wenn Knoten geklickt wurde) */}
        {selectedNode && (
          <aside
            aria-label={`Details zu ${selectedNode.name}`}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-80 md:w-96 bg-[var(--bg-surface)] border-l-2 border-[var(--border-color)] shadow-2xl p-6 z-40 overflow-y-auto flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: selectedNode.color || '#fbbf24' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {selectedNode.type}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="touch-target p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)]"
                  aria-label="Panel schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <h3 className="text-xl font-black text-[var(--text-primary)]">{selectedNode.name}</h3>
                {selectedNode.role && (
                  <p className="text-sm font-bold text-[var(--accent)] mt-0.5">{selectedNode.role}</p>
                )}
              </div>

              {selectedNode.description && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed">
                  {selectedNode.description}
                </div>
              )}

              {/* Verknüpfungen dieses Knotens */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Verbindungen im Netzwerk
                </h4>
                <ul className="space-y-2" role="list">
                  {filteredEdges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((edge) => {
                      const isOutgoing = edge.source === selectedNode.id;
                      const otherId = isOutgoing ? edge.target : edge.source;
                      const otherNode = nodes.find((n) => n.id === otherId);
                      return (
                        <li
                          key={edge.id}
                          className="p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)]" />
                            <span className="font-bold text-[var(--text-primary)]">
                              {otherNode?.name || otherId}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] text-[11px] font-semibold text-[var(--text-secondary)]">
                            {edge.label}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </div>

            {/* Aktionen am unteren Rand des Panels */}
            <div className="pt-6 border-t border-[var(--border-color)] space-y-2.5">
              <button
                onClick={() => focusOnNode(selectedNode)}
                className="touch-target w-full py-2.5 px-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent)] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Target className="w-4 h-4 text-[var(--accent)]" />
                <span>Auf diesen Knoten fokussieren</span>
              </button>

              {onAskCopilot && (
                <button
                  onClick={() => {
                    const prompt = `Welche Beziehungen und Motive hat "${selectedNode.name}" im aktuellen Beziehungsgeflecht und wie beeinflusst dies den Handlungsverlauf?`;
                    onAskCopilot(prompt, { entityId: selectedNode.id });
                  }}
                  className="touch-target w-full py-3 px-4 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-black text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-95 transition-all"
                  aria-label={`Im Co-Pilot nach ${selectedNode.name} fragen`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Im Co-Pilot nachfragen</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
