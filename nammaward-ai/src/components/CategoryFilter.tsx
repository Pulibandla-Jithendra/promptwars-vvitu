import { ComplaintCategory } from '../types';

const categories: { value: ComplaintCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All Issues', icon: '📋' },
  { value: 'garbage', label: 'Garbage', icon: '🗑️' },
  { value: 'pothole', label: 'Potholes', icon: '🕳️' },
  { value: 'drainage', label: 'Drainage', icon: '🌊' },
  { value: 'streetlight', label: 'Street Lights', icon: '💡' },
  { value: 'water-supply', label: 'Water Supply', icon: '💧' },
  { value: 'other', label: 'Other', icon: '📌' },
];

interface CategoryFilterProps {
  selected: ComplaintCategory | 'all';
  onChange: (cat: ComplaintCategory | 'all') => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="category-filter">
      {categories.map((cat) => (
        <button
          key={cat.value}
          className={`filter-btn ${selected === cat.value ? 'active' : ''}`}
          onClick={() => onChange(cat.value)}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
