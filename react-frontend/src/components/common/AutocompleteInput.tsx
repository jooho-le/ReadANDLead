import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

export type Suggestion = {
  label: string;
  subtitle?: string;
  value?: any; // 좌표 등 부가 데이터
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  fetchSuggestions: (q: string) => Promise<Suggestion[]>;
  onSelect?: (s: Suggestion) => void;
  disabled?: boolean;
};

const Wrap = styled.div`
  position: relative;
  flex: 1;
  /* flex 컨테이너에서 자식이 내용폭 때문에 넘치지 않도록 */
  min-width: 0;
`;

const Input = styled.input`
  width: 80%;
  border: 1px solid #ddd;
  border-radius: 14px; /* 캡슐이 버튼을 덮지 않도록 완만한 라운드 */
  padding: 12px 16px;
  font-size: 16px;
  position: relative;
  z-index: 0;
`;

const List = styled.div`
  position: absolute;
  left: 0; right: 0; top: calc(100% + 6px);
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(0,0,0,.08);
  max-height: 280px;
  overflow: auto;
  z-index: 40;
`;

const Item = styled.button<{active?: boolean}>`
  display: block;
  width: 100%;
  text-align: left;
  background: ${p=>p.active ? '#f3f5ff' : '#fff'};
  border: 0;
  border-bottom: 1px solid #f6f6f6;
  padding: 10px 12px;
  cursor: pointer;
  &:last-child { border-bottom: 0; }
`;

const Main = styled.div`font-weight: 600;`;
const Sub  = styled.div`color:#666; font-size: .92rem;`;

export default function AutocompleteInput({
  value, onChange, placeholder, fetchSuggestions, onSelect, disabled
}: Props){
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [hi, setHi] = useState(-1);
  const ref = useRef<HTMLDivElement|null>(null);
  const timer = useRef<any>(null);

  useEffect(()=>{
    function handleClickOutside(e: MouseEvent){
      if(!ref.current) return;
      if(!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return ()=>document.removeEventListener('mousedown', handleClickOutside);
  },[]);

  useEffect(()=>{
    if(!open) return;
    if(timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async ()=>{
      const q = value.trim();
      if(!q){ setItems([]); setLoading(false); return; }
      setLoading(true);
      try{
        const res = await fetchSuggestions(q);
        setItems(res);
      } finally {
        setLoading(false);
      }
    }, 200); // debounce 200ms
    return ()=>{ if(timer.current) clearTimeout(timer.current); };
  },[value, open, fetchSuggestions]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>){
    if(!open) return;
    if(e.key === 'ArrowDown'){ e.preventDefault(); setHi(h=>Math.min(h+1, items.length-1)); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); setHi(h=>Math.max(h-1, 0)); }
    else if(e.key === 'Enter'){
      if(hi>=0 && items[hi]){ e.preventDefault(); select(items[hi]); }
    }else if(e.key === 'Escape'){ setOpen(false); }
  }

  function select(s: Suggestion){
    onChange(s.label);
    setOpen(false);
    setHi(-1);
    onSelect?.(s);
  }

  return (
    <Wrap ref={ref}>
      <Input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={()=>setOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {open && (
        <List>
          {loading && <Item><Main>불러오는 중…</Main></Item>}
          {!loading && items.length===0 && value.trim() && (
            <Item><Main>검색 결과가 없습니다</Main></Item>
          )}
          {!loading && items.map((s, idx)=>(
            <Item key={idx} active={idx===hi} onMouseEnter={()=>setHi(idx)} onMouseDown={(e)=>{e.preventDefault();}} onClick={()=>select(s)}>
              <Main>{s.label}</Main>
              {s.subtitle && <Sub>{s.subtitle}</Sub>}
            </Item>
          ))}
        </List>
      )}
    </Wrap>
  );
}
