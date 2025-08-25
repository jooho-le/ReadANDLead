import { useNavigate, useParams } from 'react-router-dom';


export default function StopChip({ stopId, label }: { stopId: string; label: string }) {
    const { id } = useParams();
    const nav = useNavigate();
    return (
        <button
            onClick={() => nav(`/diary/trip/${id}/itinerary#stop-${stopId}`)}
            style={{
            padding: '2px 8px', borderRadius: 9999, fontSize: 12,
            background: '#eef2ff', color: '#4338ca', border: '1px solid #e5e7eb'
        }}
        >{label}</button>
    );
}