import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Complaint, ComplaintStatus, StaffNote, StaffProgressStatus } from '../types';
import { sampleComplaints } from '../data/sampleComplaints';

const STORAGE_KEY = 'nammaward_complaints';
const PHOTO_STORAGE_KEY = 'nammaward_photos';

function loadComplaints(): Complaint[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Complaint[];
      // Reattach photo data from separate storage
      const photos = loadPhotos();
      const hydrated = parsed.map(c => ({
        ...c,
        photoDataUrl: photos[`${c.id}:report`] || photos[c.id] || c.photoDataUrl,
        staffNotes: c.staffNotes?.map((note, index) => ({
          ...note,
          photoDataUrl: photos[`${c.id}:note:${index}`] || note.photoDataUrl,
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
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

function saveComplaints(complaints: Complaint[]) {
  // Store photos separately so complaint history stays readable and images can be replaced independently.
  const withoutPhotos = complaints.map(({ photoDataUrl, staffNotes, ...rest }) => ({
    ...rest,
    staffNotes: staffNotes?.map(({ photoDataUrl: _photoDataUrl, ...note }) => note),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhotos));

  const photos: Record<string, string> = {};
  complaints.forEach(c => {
    if (c.photoDataUrl) photos[`${c.id}:report`] = c.photoDataUrl;
    c.staffNotes?.forEach((note, index) => {
      if (note.photoDataUrl) photos[`${c.id}:note:${index}`] = note.photoDataUrl;
    });
  });
  try {
    localStorage.setItem(PHOTO_STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.warn('Photo storage failed (likely quota exceeded):', e);
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

  const persist = (updated: Complaint[]) => {
    setComplaints(updated);
    saveComplaints(updated);
  };

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
