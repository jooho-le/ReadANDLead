import styled, { css } from 'styled-components';
import AutocompleteInput from './common/AutocompleteInput';
type Variant = 'primary' | 'ghost';
type Edge = 'default' | 'join-left' | 'join-right' | 'square';
type Size = 'md' | 'lg';

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
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px 10px;
  font-size: 14px;
  outline: none;
  background: #fff;
  transition: border-color .15s ease, box-shadow .15s ease;
  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

`;

export const Input = styled.input`
    ${fieldBase};
    box-sizing: border-box;
    max-width: 100%;
    
    @media (max-width: 768px) {
        max-width: 100%;
        font-size: 15px;
        padding: 10px;
      }

  @media (max-width: 480px) {
    font-size: 14px;
    padding: 8px;
  }
    
`;
export const Select = styled.select`
    ${fieldBase};
    box-sizing: border-box;
    max-width: 100%;  
    
    @media (max-width: 768px) {
    max-width: 100%;
    font-size: 15px;
    padding: 10px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    padding: 8px;
  }
`;
export const Textarea = styled.textarea`
  ${fieldBase};
  resize: vertical;
  min-height: 80px;
  box-sizing: border-box;
  max-width: 100%;
    
  @media (max-width: 768px) {
    max-width: 100%;
    font-size: 15px;
    padding: 10px;
    min-height: 140px;
  }

  @media (max-width: 480px) {
    font-size: 14px;
    padding: 8px;
    min-height: 120px;
  }
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

export const Button = styled.button<{variant?: Variant; edge?: Edge; size?: Size}>`
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  
  ${({variant}) => variant === 'ghost'
    ? css`background:#fff;border-color:#e5e7eb;color:#374151;&:hover{background:#f9fafb;}`
    : css`background:#6366f1;color:#fff;&:hover{background:#4f46e5;}`};

  &:disabled { opacity: .6; cursor: not-allowed;}

  ${({size}) => size === 'lg' && css`height:48px; padding:0 16px;`}

  ${({edge}) => edge === 'join-left'  && css`
    border-radius: 0 12px 12px 0;
    border-left: 1px solid #e5e7eb;
  `}
`;

export const InputGroup = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden; /* 둥근 모서리 맞춤 */
  border-radius: 12px;
  flex-wrap: wrap;
`;

export const StyledAutoInput = styled(AutocompleteInput)`
  flex: 1;

  input {
    border: 1px solid #2563eb;
    border-right: none;
    border-radius: 12px 0 0 12px;
    padding: 12px 14px;
    height: 48px;
    font-size: 16px;
    width: 100%;
    box-shadow: none;
    outline: none;
    box-sizing: border-box;
  }
`;

export const StyledSubmitButton = styled(Button)`
  border: 1px solid #2563eb;
  height: 48px;
  border-radius: 12px;
  margin-left: 42px;
  font-size: 16px;
  padding: 0 20px;
`;


export const Divider = styled.div`
  height: 1px;
  background: #f1f5f9;
  margin: 12px 0;
`;
