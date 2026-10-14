import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Complaint, ComplaintStatus, StaffNote } from '../types';
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
      return parsed.map(c => ({
        ...c,
        photoDataUrl: photos[c.id] || c.photoDataUrl,
      }));
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
  // Store complaints without photoDataUrl to save space
  const withoutPhotos = complaints.map(({ photoDataUrl, ...rest }) => rest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutPhotos));

  // Store photos separately using complaint IDs as keys
  const photos: Record<string, string> = {};
  complaints.forEach(c => {
    if (c.photoDataUrl) photos[c.id] = c.photoDataUrl;
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
  updateStatus: (id: string, status: ComplaintStatus, note?: StaffNote) => void;
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

  const updateStatus = useCallback((id: string, status: ComplaintStatus, note?: StaffNote) => {
    setComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id !== id) return c;
        return {
          ...c,
          status,
          staffNotes: note ? [...(c.staffNotes || []), note] : c.staffNotes,
        };
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
    <ComplaintContext.Provider value={{ complaints, addComplaint, updateStatus, toggleUrgent, getComplaintById, getComplaintsByUser }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const ctx = useContext(ComplaintContext);
  if (!ctx) throw new Error('useComplaints must be used within ComplaintProvider');
  return ctx;
}
