import React from 'react';

const StatsCard = ({ icon: Icon, label, value, color }) => {
    return (
        <div className="card stat-card animate-fade-in">
            <div className="stat-icon" style={{ backgroundColor: color ? `${color}1a` : 'rgba(99, 102, 241, 0.1)', color: color || '#6366f1' }}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <div className="value">{value}</div>
                <div className="label">{label}</div>
            </div>
        </div>
    );
};

export default StatsCard;
