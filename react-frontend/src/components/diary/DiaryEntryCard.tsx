// 타임라인 카드

import styled from 'styled-components';
import type { DiaryEntry } from '../../api/diary';
import { Card } from '../ui';

const Meta = styled.div`
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
`;
const Text = styled.div<{system?: boolean}>`
  font-size: 14px;
  color: ${({system}) => system ? '#475569' : '#111827'};
`;

export function DiaryEntryCard({ e }: { e: DiaryEntry }) {
  const when = new Date(e.created_at).toLocaleString();
  const isSystem = e.entry_type === 'system';
  return (
    <Card>
      <Meta>{when}</Meta>
      <Text system={isSystem}>{isSystem ? `🔔 ${e.text}` : e.text}</Text>
    </Card>
  );
}
