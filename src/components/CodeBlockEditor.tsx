import { useState, useRef, useEffect } from 'react';
import { ActionCodeBlock } from '../types';
import { highlightBSL } from '../utils/bsl-highlighter-v2';

interface CodeBlockEditorProps {
  codeBlock?: ActionCodeBlock;
  onSave: (codeBlock: Omit<ActionCodeBlock, 'actionId' | 'orderIndex'>) => void;
  onCancel: () => void;
  blockStartMarker?: string;
  blockEndMarker?: string;
}

// Функция для очистки кода от HTML и нормализации переносов строк
const normalizeCodeText = (text: string | undefined): string => {
  if (!text) return '';
  // Удаляем HTML теги и конвертируем <br> в \n
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n') // Нормализуем Windows переносы
    .replace(/\r/g, '\n'); // Нормализуем Mac переносы
};

const CodeBlockEditor = ({ codeBlock, onSave, onCancel, blockStartMarker, blockEndMarker }: CodeBlockEditorProps) => {

  const [formData, setFormData] = useState({
    language: codeBlock?.language || 'BSL',
    codeText: normalizeCodeText(codeBlock?.codeText),
    collapsible: codeBlock?.collapsible || false
  });
  const [showPreview, setShowPreview] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const languages = ['BSL', 'SQL', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Other'];

  // Обновление formData при изменении codeBlock
  useEffect(() => {
    if (codeBlock) {
      setFormData({
        language: codeBlock.language || 'BSL',
        codeText: normalizeCodeText(codeBlock.codeText),
        collapsible: codeBlock.collapsible || false
      });
    }
  }, [codeBlock?.id]);

  // Обновление предпросмотра при изменении кода
  useEffect(() => {
    if (!editorContainerRef.current || formData.language !== 'BSL') return;
    
    // Обновляем предпросмотр при изменении кода
    if (formData.codeText) {
      editorContainerRef.current.innerHTML = highlightBSL(formData.codeText, blockStartMarker, blockEndMarker);
    } else {
      editorContainerRef.current.innerHTML = '';
    }
  }, [formData.codeText, formData.language, blockStartMarker, blockEndMarker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onSave({
      id: codeBlock?.id || `codeblock-${Date.now()}`,
      language: formData.language,
      codeText: formData.codeText,
      collapsible: formData.collapsible
    });
  };

  return (
    <div className="code-block-editor">
      <h3>{codeBlock ? 'Редактировать блок кода' : 'Добавить блок кода'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="code-language">Язык программирования</label>
          <select
            id="code-language"
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            cursor: 'pointer',
            marginBottom: 0,
            fontWeight: 'normal'
          }}>
            <input
              type="checkbox"
              checked={formData.collapsible}
              onChange={(e) => setFormData({ ...formData, collapsible: e.target.checked })}
              style={{ 
                margin: 0, 
                width: 'auto', 
                flexShrink: 0,
                cursor: 'pointer'
              }}
            />
            <span style={{ margin: 0 }}>Свернуть по умолчанию в отчете</span>
          </label>
        </div>
        <div className="form-actions" style={{ marginBottom: '1.5rem' }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            onClick={(e) => e.stopPropagation()}
          >
            Сохранить
          </button>
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }} 
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
        <div className="form-group">
          <label htmlFor="code-text">Код *</label>
          <textarea
            id="code-text"
            value={formData.codeText}
            onChange={(e) => setFormData({ ...formData, codeText: e.target.value })}
            rows={15}
            required
            style={{ 
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: '5px',
              width: '100%',
              boxSizing: 'border-box',
              resize: 'vertical',
              marginBottom: '15px'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          />
          {formData.language === 'BSL' && formData.codeText && (
            <div style={{ marginTop: '8px', marginBottom: '8px' }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowPreview(!showPreview);
                }}
                style={{
                  color: '#667eea',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {showPreview ? 'Скрыть предпросмотр' : 'Показать предпросмотр'}
              </a>
            </div>
          )}
          {formData.language === 'BSL' && formData.codeText && showPreview && (
            <div style={{ marginTop: '10px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'bold',
                color: '#667eea'
              }}>
                Предпросмотр с подсветкой:
              </label>
              <div
                ref={editorContainerRef}
                style={{
                  fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  padding: '0.75rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px',
                  minHeight: '200px',
                  maxHeight: '400px',
                  overflow: 'auto',
                  backgroundColor: '#f8f8f8',
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{ 
                  __html: highlightBSL(formData.codeText, blockStartMarker, blockEndMarker) 
                }}
              />
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default CodeBlockEditor;

