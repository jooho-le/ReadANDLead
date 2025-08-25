// 타임라인 카드

import styled from 'styled-components';
import type { DiaryEntry } from '../../api/diary';
import StopChip from './StopChip';

export function DiaryEntryCard({ e, placeName }: { e: DiaryEntry; placeName?: string }) {
  return (
    <div className="rounded-2xl border p-3 space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(e.happened_at || e.created_at).toLocaleString()}</span>
        {e.stop_id && placeName && <StopChip stopId={e.stop_id} label={placeName} />}
      </div>
      <div className="text-sm">
        {e.entry_type === 'system'
          ? <span className="text-gray-600">🔔 {e.text}</span>
          : <span>{e.text}</span>}
      </div>
    </div>
  );
}