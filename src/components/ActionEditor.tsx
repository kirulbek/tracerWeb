import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface ActionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ActionEditor = forwardRef<any, ActionEditorProps>(({ value, onChange, placeholder }, ref) => {
  const quillRef = useRef<ReactQuill>(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => {
      return quillRef.current?.getEditor();
    }
  }));

  // Обновляем содержимое редактора при изменении value
  useEffect(() => {
    if (quillRef.current && quillRef.current.getEditor().root.innerHTML !== value) {
      quillRef.current.getEditor().root.innerHTML = value;
    }
  }, [value]);

  // Устанавливаем placeholder
  useEffect(() => {
    if (quillRef.current && placeholder) {
      const editor = quillRef.current.getEditor();
      const editorElement = editor.root;
      if (editorElement) {
        editorElement.setAttribute('data-placeholder', placeholder);
      }
    }
  }, [placeholder]);

  return (
    <div className="action-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['code-block'],
            ['clean']
          ]
        }}
      />
    </div>
  );
});

ActionEditor.displayName = 'ActionEditor';

export default ActionEditor;

