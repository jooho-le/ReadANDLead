import styled, { css } from 'styled-components';

export const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 12px;
`;

export const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.04);
`;

export const Row = styled.div<{gap?: number}>`
  display: flex;
  align-items: center;
  gap: ${({gap = 8}) => `${gap}px`};
`;

export const Col = styled.div<{gap?: number}>`
  display: grid;
  gap: ${({gap = 8}) => `${gap}px`};
`;

const fieldBase = css`
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
  background: #fff;
  transition: border-color .15s ease, box-shadow .15s ease;
  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
`;

export const Input = styled.input`${fieldBase}`;
export const Select = styled.select`${fieldBase}`;
export const Textarea = styled.textarea`
  ${fieldBase};
  resize: vertical;
  min-height: 80px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: #6b7280;
`;

export const Help = styled.p`
  margin: 4px 0 0;
  font-size: 12px;
  color: #9ca3af;
`;

export const Button = styled.button<{variant?: 'primary'|'ghost'}>`
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  ${({variant}) => variant === 'ghost'
    ? css`background:#fff;border-color:#e5e7eb;color:#374151;&:hover{background:#f9fafb;}`
    : css`background:#6366f1;color:#fff;&:hover{background:#4f46e5;}`};
  &:disabled { opacity: .6; cursor: not-allowed; }
`;

export const Divider = styled.div`
  height: 1px;
  background: #f1f5f9;
  margin: 12px 0;
`;
