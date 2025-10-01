import {
  Handle, Position, type NodeProps, useUpdateNodeInternals, type NodeTypes
} from '@xyflow/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import cx from "clsx";
import styles from './db_table.module.css';

import TrashICon from './../../assets/trash-icon.svg';
import KeyIcon from './../../assets/key.svg';
import KeyColumn from './../../assets/key-idon-column.svg';
import DatabaseIcon from './../../assets/database-icon.svg';
import CloseIcon from './../../assets/x-circle.svg';

/* --------- util: ids únicos --------- */
export const makeId = (() => { let c = 0; return () => `f_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const makeFieldId = (() => { let c = 0; return () => `f_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const makeNodeId  = (() => { let c = 0; return () => `t_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const nextPosition = (i: number) => ({ x: 100 + (i % 3) * 400, y: 80 + Math.floor(i / 3) * 220 });

/* --------- lanes para separar conexiones --------- */
const LANE_COUNT = 6;   // cantidad de carriles
const LANE_STEP  = 10;  // separación horizontal (px)

/* --------- tipos --------- */
type Field = {
  id: string;
  label: string;
  isPk?: boolean;
  hasType?: boolean;
};
export type TableData = {
  title: string;
  fields: Field[];
  onAddField?: () => void;
  onRenameTitle?: (value: string) => void;
  onRenameField?: (fieldId: string, value: string) => void;
  onRemove: () => void;
  onDeleteField?: (fieldId: string) => void;
  onTogglePk?: (fieldId: string, value: boolean) => void;
  onToggleType?: (fieldId: string, value: boolean) => void;
};

/* --------- nodo tabla (editable) --------- */
export function TableNode({ id, data }: NodeProps) {
  const {
    title, fields, onAddField, onRemove, onRenameTitle, onRenameField,
    onDeleteField, onTogglePk, onToggleType
  } = data as TableData;

  const update = useUpdateNodeInternals();
  useLayoutEffect(() => {
    update(id);
  }, [
    id,
    title,
    fields.map((field) => `${field.label}:${field.isPk ? '1' : '0'}:${field.hasType ? '1' : '0'}`).join('|'),
    update
  ]);

  const [menuFieldId, setMenuFieldId] = useState<string | null>(null);
  const [menuFieldIdSelected, setmenuFieldIdSelected] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const el = menuRef.current;
      const target = e.target as Element | null;
      if (!el || !target || !el.contains(target)) setMenuFieldId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className={styles.node_table}>
      {/* Título (drag handle) */}
      <div className={cx('drag-handle', styles.node_table__title_container)}>
        <input
          type="text"
          className={cx('nodrag', styles.node_table__title)}
          value={title}
          size={Math.max((title ?? '').length, 6)}
          onChange={(e) => onRenameTitle?.(e.target.value)}
        />

        <img 
          src={CloseIcon} 
          alt="Remove table icon" 
          className={styles.node_table__close_button}
        />

        {/* <button
          className={cx('nodrag', styles.node_table__close_button)}
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          title="Eliminar tabla"
        >×</button> */}
      </div>

      <div className={styles.node_table__column_separator} />

      <div className={styles.node_table__columns_container}>
        {fields.map((field) => {
          const isHandlersActive = menuFieldIdSelected === field.id; 
          const isMenuOpen = menuFieldId === field.id;
          const canDelete = fields.length > 1;

          const closeIfRealLeave = (e: React.MouseEvent<HTMLDivElement>) => {
            const next = e.relatedTarget as Element | null;
            if (!next || !e.currentTarget.contains(next)) {
              setMenuFieldId(null);
            }
          };

          return (
            <div
              key={field.id}
              className={styles.node_table__column}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenuFieldId(field.id); }}
              onMouseLeave={(e) => {
                if (isMenuOpen) closeIfRealLeave(e);
                setmenuFieldIdSelected(null);

                // setshowHandlers(false);
                // isMenuOpen ? closeIfRealLeave : undefined
              }}
              onMouseEnter={() => setmenuFieldIdSelected(field.id)}
            >
              {/* ====== AZUL visible (target) – izquierda ====== */}
              <Handle
                className={cx(
                  isHandlersActive ? styles.node_handler__blue : styles.node_handler_transparent
                )}
                type="target"
                id={`${field.id}-in`}
                position={Position.Left}
                style={{
                  left: 0, top: 0, transform: 'none',
                  width: 12, height: '100%', borderRadius: 0, border: 'none',
                  cursor: 'crosshair'
                }}
              />

              {/* ====== AZUL ocultos (source) – carriles abajo ====== */}
              {Array.from({ length: LANE_COUNT }).map((_, lane) => (
                <Handle
                  key={`blue-lane-${lane}`}
                  type="source"
                  id={`${field.id}-in-src-btm-${lane}`}
                  position={Position.Bottom}
                  style={{
                    left: 0 + lane * LANE_STEP,
                    width: 12, height: 8,
                    bottom: -2,
                    background: 'transparent',
                    border: 'none',
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Texto columna */}
              <input
                className={cx('nodrag', styles.node_table__column_input)}
                value={field.label}
                onChange={(e) => onRenameField?.(field.id, e.target.value)}
                size={Math.max((field.label ?? '').length, 1)}
                type="text"
              />

              {/* ====== ROJO visible (source) – derecha ====== */}
              <Handle
                className={cx(
                  isHandlersActive ? styles.node_handler__red : styles.node_handler_transparent
                )}
                type="source"
                id={`${field.id}-out`}
                position={Position.Right}
                style={{
                  right: 0, top: 0, transform: 'none',
                  width: 12, height: '100%', borderRadius: 0, border: 'none',
                  cursor: 'crosshair'
                }}
              />

              {/* ====== ROJO ocultos (target) – carriles abajo ====== */}
              {Array.from({ length: LANE_COUNT }).map((_, lane) => (
                <Handle
                  key={`red-lane-${lane}`}
                  type="target"
                  id={`${field.id}-out-tgt-btm-${lane}`}
                  position={Position.Bottom}
                  style={{
                    left: `calc(100% - 12px - ${lane * LANE_STEP}px)`,
                    width: 12, height: 8,
                    bottom: -2,
                    background: 'transparent',
                    border: 'none',
                    pointerEvents: 'none'
                  }}
                />
              ))}

              {/* Badges (PK/tipo) */}
              {(field.isPk || field.hasType) && (
                <div className={styles.node_table__badgesCorner} aria-hidden>
                  {field.hasType && <img src={DatabaseIcon} className={styles.badge_icon_sm} alt="" />}
                  {field.isPk && <img src={KeyColumn} className={styles.badge_icon_sm} alt="" />}
                </div>
              )}

              {/* Menú contextual */}
              
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className={cx('nodrag', styles.node_table__column_menu)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseLeave={() => setMenuFieldId(null)}
                >
                  <button
                    className={cx(styles.menu_item, styles.menu_red, !canDelete && styles.menu_disabled)}
                    disabled={!canDelete}
                    onClick={() => { if (canDelete) onDeleteField?.(field.id); setMenuFieldId(null); }}
                    title={canDelete ? 'Eliminar columna' : 'Agrega otra columna para poder eliminar ésta'}
                  >
                    <img src={TrashICon} alt="Eliminar" />
                  </button>
                  <button
                    className={cx(styles.menu_item, styles.menu_yellow)}
                    onClick={() => { onTogglePk?.(field.id, !field.isPk); setMenuFieldId(null); }}
                    title={field.isPk ? 'Quitar PK' : 'Marcar como PK'}
                  >
                    <img src={KeyIcon} alt="PK" />
                  </button>
                  <button
                    className={cx(styles.menu_item, styles.menu_green)}
                    onClick={() => { onToggleType?.(field.id, !field.hasType); setMenuFieldId(null); }}
                    title={field.hasType ? 'Quitar tipo' : 'Marcar tipo'}
                  >
                    <img src={DatabaseIcon} alt="Tipo" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* + columna */}
        <button
          className={cx('nodrag', styles.node_table__add_column_button)}
          onClick={(e) => { e.stopPropagation(); onAddField?.(); }}
          title="Agregar columna"
        >+</button>
      </div>
    </div>
  );
}

export const nodeTypes = { table: TableNode } as unknown as NodeTypes;