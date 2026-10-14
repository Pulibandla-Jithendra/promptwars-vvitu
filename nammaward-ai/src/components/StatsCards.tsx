import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    { label: 'Total Complaints', value: stats.total, icon: '📋', color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#22c55e', bg: '#f0fdf4' },
    { label: 'In Progress', value: stats.inProgress, icon: '🔄', color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Critical', value: stats.critical, icon: '🚨', color: '#ef4444', bg: '#fef2f2' },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
          <div className="stat-icon" style={{ background: card.bg }}>{card.icon}</div>
          <div className="stat-info">
            <span className="stat-value">{card.value}</span>
            <span className="stat-label">{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
