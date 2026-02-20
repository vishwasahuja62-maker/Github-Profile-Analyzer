import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const LanguagePieChart = ({ languages }) => {
    const data = {
        labels: languages.map(l => l.name),
        datasets: [
            {
                data: languages.map(l => l.count),
                backgroundColor: [
                    '#6366f1',
                    '#22d3ee',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                ],
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    font: {
                        size: 12,
                    },
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                padding: 12,
                cornerRadius: 8,
            },
        },
        responsive: true,
        maintainAspectRatio: false,
    };

    return (
        <div style={{ height: '300px' }}>
            <Pie data={data} options={options} />
        </div>
    );
};

export default LanguagePieChart;
