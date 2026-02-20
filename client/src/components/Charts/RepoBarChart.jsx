import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const RepoBarChart = ({ repos }) => {
    const data = {
        labels: repos.map(r => r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name),
        datasets: [
            {
                label: 'Stars',
                data: repos.map(r => r.stars),
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: '#6366f1',
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    const options = {
        indexAxis: 'y',
        elements: {
            bar: {
                borderWidth: 2,
            },
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#94a3b8',
                },
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: '#f8fafc',
                    font: {
                        weight: 'bold',
                    },
                },
            },
        },
    };

    return (
        <div style={{ height: '300px' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default RepoBarChart;
