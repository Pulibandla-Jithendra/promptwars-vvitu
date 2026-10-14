import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Complaint, ComplaintStatus, StaffNote, StaffProgressStatus } from '../types';
import { sampleComplaints } from '../data/sampleComplaints';

const STORAGE_KEY = 'nammaward_complaints';
const PHOTO_STORAGE_KEY = 'nammaward_photos';
const PHOTO_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

function isComplaint(value: unknown): value is Complaint {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Complaint>;
  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.description === 'string'
    && typeof item.locality === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.submittedBy === 'string'
    && ['garbage', 'pothole', 'drainage', 'streetlight', 'water-supply', 'other'].includes(item.category || '')
    && ['submitted', 'under-review', 'in-progress', 'awaiting-confirmation', 'disputed', 'resolved', 'escalated'].includes(item.status || '')
    && ['low', 'medium', 'high', 'critical'].includes(item.priority || '')
    && Array.isArray(item.staffNotes ?? [])
    && (item.staffNotes ?? []).every(isStaffNote);
}

function safePhoto(value: unknown): string | undefined {
  return typeof value === 'string' && value.length <= 8_000_000 && PHOTO_DATA_URL.test(value) ? value : undefined;
}

function isStaffNote(value: unknown): value is StaffNote {
  if (!value || typeof value !== 'object') return false;
  const note = value as Partial<StaffNote>;
  const statuses = ['submitted', 'under-review', 'in-progress', 'awaiting-confirmation', 'disputed', 'resolved', 'escalated'];
  const kinds = ['staff-update', 'resolution-proposal', 'citizen-confirmation', 'citizen-dispute'];
  return typeof note.note === 'string'
    && typeof note.by === 'string'
    && typeof note.at === 'string'
    && (!note.statusChange || statuses.includes(note.statusChange))
    && (!note.kind || kinds.includes(note.kind));
}

function loadComplaints(): Complaint[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return sampleComplaints;
      const valid = parsed.filter(isComplaint);
      // Reattach photo data from separate storage
      const photos = loadPhotos();
      const hydrated = valid.map(c => ({
        ...c,
        photoDataUrl: safePhoto(photos[`${c.id}:report`] || photos[c.id] || c.photoDataUrl),
        staffNotes: c.staffNotes?.map((note, index) => ({
          ...note,
          photoDataUrl: safePhoto(photos[`${c.id}:note:${index}`] || note.photoDataUrl),
        })),
      }));
      return hydrated.map(c => {
        const legacyProposal = c.status === 'resolved'
          ? [...(c.staffNotes || [])].reverse().find(note => note.statusChange === 'resolved' && !note.kind)
          : undefined;
        if (!legacyProposal) return c;
        return {
          ...c,
          status: 'awaiting-confirmation' as ComplaintStatus,
          staffNotes: c.staffNotes?.map(note => note === legacyProposal
            ? { ...note, statusChange: 'awaiting-confirmation', kind: 'resolution-proposal' as const }
            : { ...note, kind: note.kind || 'staff-update' as const }),
        };
      });
    }
  } catch { /* ignore */ }
  return sampleComplaints;
}

function loadPhotos(): Record<string, string> {
  try {
    const saved = localStorage.getItem(PHOTO_STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, string> : {};
  } catch { return {}; }
}

function saveComplaints(complaints: Complaint[]) {
  // Store photos separately so complaint history stays readable and images can be replaced independently.
  const withoutPhotos = complaints.map(({ photoDataUrl, staffNotes, ...rest }) => ({
    ...rest,
    staffNotes: staffNotes?.map(({ photoDataUrl: _photoDataUrl, ...note }) => note),
  }));
  const photos: Record<string, string> = {};
  complaints.forEach(c => {
    if (c.photoDataUrl) photos[`${c.id}:report`] = c.photoDataUrl;
    c.staffNotes?.forEach((note, index) => {
      if (note.photoDataUrl) photos[`${c.id}:note:${index}`] = note.photoDataUrl;
    });
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhotos));
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
  } catch {
    // Keep the in-memory complaint usable when storage is blocked or full.
  }
}

interface ComplaintContextType {
  complaints: Complaint[];
  addComplaint: (complaint: Complaint) => void;
  updateStatus: (id: string, status: StaffProgressStatus, note?: StaffNote) => void;
  proposeResolution: (id: string, note: string, photoDataUrl: string | undefined, by: string) => void;
  reviewResolution: (id: string, confirmed: boolean, note: string | undefined, by: string) => void;
  toggleUrgent: (id: string) => void;
  getComplaintById: (id: string) => Complaint | undefined;
  getComplaintsByUser: (userId: string) => Complaint[];
}

const ComplaintContext = createContext<ComplaintContextType | null>(null);

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>(loadComplaints);

  const addComplaint = useCallback((complaint: Complaint) => {
    setComplaints(prev => {
      const updated = [complaint, ...prev];
      saveComplaints(updated);
      return updated;
    });
  }, []);

  const updateStatus = useCallback((id: string, status: StaffProgressStatus, note?: StaffNote) => {
    setComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          status,
          staffNotes: note ? [...(c.staffNotes || []), { ...note, kind: note.kind || 'staff-update' }] : c.staffNotes,
        };
      });
      saveComplaints(updated);
      return updated;
    });
  }, []);

  const proposeResolution = useCallback((id: string, note: string, photoDataUrl: string | undefined, by: string) => {
    const trimmedNote = note.trim();
    if (!trimmedNote) return;
    setComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id !== id || !['in-progress', 'disputed', 'under-review'].includes(c.status)) return c;
        const history: StaffNote = {
          note: trimmedNote,
          by,
          at: new Date().toISOString(),
          statusChange: 'awaiting-confirmation',
          kind: 'resolution-proposal',
          photoDataUrl,
        };
        return { ...c, status: 'awaiting-confirmation' as ComplaintStatus, staffNotes: [...(c.staffNotes || []), history] };
      });
      saveComplaints(updated);
      return updated;
    });
  }, []);

  const reviewResolution = useCallback((id: string, confirmed: boolean, note: string | undefined, by: string) => {
    setComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id !== id || c.status !== 'awaiting-confirmation') return c;
        const status: ComplaintStatus = confirmed ? 'resolved' : 'disputed';
        const history: StaffNote = {
          note: note?.trim() || (confirmed ? 'The citizen confirmed that the issue appears fixed.' : 'The citizen reported that the issue still exists.'),
          by,
          at: new Date().toISOString(),
          statusChange: status,
          kind: confirmed ? 'citizen-confirmation' : 'citizen-dispute',
        };
        return { ...c, status, staffNotes: [...(c.staffNotes || []), history] };
      });
      saveComplaints(updated);
      return updated;
    });
  }, []);

  const toggleUrgent = useCallback((id: string) => {
    setComplaints(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, flaggedUrgent: !c.flaggedUrgent } : c
      );
      saveComplaints(updated);
      return updated;
    });
  }, []);

  const getComplaintById = useCallback((id: string) => {
    return complaints.find(c => c.id === id);
  }, [complaints]);

  const getComplaintsByUser = useCallback((userId: string) => {
    return complaints.filter(c => c.submittedBy === userId);
  }, [complaints]);

  return (
    <ComplaintContext.Provider value={{ complaints, addComplaint, updateStatus, proposeResolution, reviewResolution, toggleUrgent, getComplaintById, getComplaintsByUser }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const ctx = useContext(ComplaintContext);
  if (!ctx) throw new Error('useComplaints must be used within ComplaintProvider');
  return ctx;
}
