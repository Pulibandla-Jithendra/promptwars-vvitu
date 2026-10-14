import { useState } from 'react';
import { Complaint, ComplaintCategory, Priority } from '../types';
import { useAuth } from '../context/AuthContext';
import CameraCapture from './CameraCapture';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface ComplaintFormProps {
  onSubmit: (complaint: Complaint) => void;
  onClose: () => void;
}

const categoryOptions: { value: ComplaintCategory; label: string }[] = [
  { value: 'garbage', label: '🗑️ Garbage / Waste' },
  { value: 'pothole', label: '🕳️ Pothole / Road Damage' },
  { value: 'drainage', label: '🌊 Drainage / Flooding' },
  { value: 'streetlight', label: '💡 Street Light' },
  { value: 'water-supply', label: '💧 Water Supply' },
  { value: 'other', label: '📌 Other' },
];

export default function ComplaintForm({ onSubmit, onClose }: ComplaintFormProps) {
  const { user } = useAuth();
  const dialogRef = useDialogAccessibility<HTMLDivElement>(true, onClose);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('garbage');
  const [locality, setLocality] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Please enter a title';
    if (title.trim().length > 0 && title.trim().length < 10) newErrors.title = 'Title must be at least 10 characters';
    if (title.trim().length > 120) newErrors.title = 'Title must be 120 characters or fewer';
    if (!description.trim()) newErrors.description = 'Please describe the issue';
    if (description.trim().length > 0 && description.trim().length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (description.trim().length > 2000) newErrors.description = 'Description must be 2,000 characters or fewer';
    if (!locality.trim()) newErrors.locality = 'Please enter the locality';
    if (locality.trim().length > 100) newErrors.locality = 'Locality must be 100 characters or fewer';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateAIAnalysis = (title: string, desc: string, cat: ComplaintCategory): Pick<Complaint, 'aiSummary' | 'aiCategory' | 'aiPriority' | 'aiSuggestion'> => {
    const categoryMap: Record<ComplaintCategory, string> = {
      garbage: 'Solid Waste Management',
      pothole: 'Road Infrastructure',
      drainage: 'Storm Water Drainage',
      streetlight: 'Street Lighting & Public Safety',
      'water-supply': 'Water Supply & Distribution',
      other: 'General Municipal Services',
    };

    const keywords = (title + ' ' + desc).toLowerCase();
    let priority: Priority = 'medium';
    if (keywords.includes('accident') || keywords.includes('dangerous') || keywords.includes('flood') || keywords.includes('collapse') || keywords.includes('urgent') || keywords.includes('emergency')) {
      priority = 'critical';
    } else if (keywords.includes('health') || keywords.includes('unsafe') || keywords.includes('broken') || keywords.includes('overflow') || keywords.includes('blocked')) {
      priority = 'high';
    } else if (keywords.includes('minor') || keywords.includes('small') || keywords.includes('cosmetic')) {
      priority = 'low';
    }

    return {
      aiSummary: `Reported issue regarding ${categoryMap[cat].toLowerCase()} in the specified locality. ${desc.substring(0, 80)}...`,
      aiCategory: categoryMap[cat],
      aiPriority: priority,
      aiSuggestion: `Route to ${categoryMap[cat]} department. Assign field inspection team within ${priority === 'critical' ? '4 hours' : priority === 'high' ? '24 hours' : '48 hours'}. Notify ward councillor for tracking.`,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const id = `NW-2026-${String(Date.now()).slice(-3)}`;
      const aiAnalysis = generateAIAnalysis(title, description, category);

      const newComplaint: Complaint = {
        id,
        title: title.trim(),
        description: description.trim(),
        category,
        locality: locality.trim(),
        status: 'submitted',
        priority: aiAnalysis.aiPriority || 'medium',
        createdAt: new Date().toISOString(),
        upvotes: 1,
        submittedBy: user?.id || 'anonymous',
        photoDataUrl,
        ...aiAnalysis,
      };

      onSubmit(newComplaint);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="modal-content form-modal" role="dialog" aria-modal="true" aria-label="Report a Civic Issue" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close report form" onClick={onClose}>✕</button>
        <h2 className="form-title">📝 Report a Civic Issue</h2>
        <p className="form-subtitle">Help improve your ward by reporting issues in your locality</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Issue Title *</label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Garbage overflow near Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={errors.title ? 'input-error' : ''}
              required
              maxLength={120}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && <span className="error-text" id="title-error" role="alert">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              required
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="locality">Locality / Ward *</label>
            <input
              id="locality"
              type="text"
              placeholder="e.g., Ward 5 - Gandhi Nagar"
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              className={errors.locality ? 'input-error' : ''}
              required
              maxLength={100}
              aria-invalid={Boolean(errors.locality)}
              aria-describedby={errors.locality ? 'locality-error' : undefined}
            />
            {errors.locality && <span className="error-text" id="locality-error" role="alert">{errors.locality}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              placeholder="Describe the issue in detail - location, severity, how long it's been happening, who is affected..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={errors.description ? 'input-error' : ''}
              required
              maxLength={2000}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : undefined}
            />
            {errors.description && <span className="error-text" id="description-error" role="alert">{errors.description}</span>}
          </div>

          {/* Camera Capture */}
          <CameraCapture
            onCapture={setPhotoDataUrl}
            onRemove={() => setPhotoDataUrl(undefined)}
            currentPhoto={photoDataUrl}
          />

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spinner"></span> Preparing your report...</>
            ) : (
              '🚀 Submit Report'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
