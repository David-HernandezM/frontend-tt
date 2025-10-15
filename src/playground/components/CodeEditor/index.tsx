import { sql } from '@codemirror/lang-sql';
import CodeMirror from '@uiw/react-codemirror';
import styles from './code_editor.module.css';

interface Props {
    code: string,
    onCodeChange: (code: string) => void,
    disabled?: boolean
}

export const CodeEditor = ({code, onCodeChange = (_: string) => {}, disabled = false}: Props) => {
  return (
     <div
        className={styles.playground_code__editor_container}
    >
        <CodeMirror
            className={styles.playground_code__codemirror}
            value={code}
            extensions={[sql()]}
            editable={!disabled}
            placeholder='Ingresa tu consulta'
            onChange={(value, _) => {
                if (disabled) return;
                onCodeChange(value);
            }}
        />
    </div>
  )
}
