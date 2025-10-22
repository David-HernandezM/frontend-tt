// NodeDBTable.tsx
import {
  Handle, Position, type NodeProps, useUpdateNodeInternals, type NodeTypes
} from '@xyflow/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DataType } from '../../../types';
import cx from "clsx";
import styles from './db_table.module.css';

import TrashICon from './../../assets/trash-icon.svg';
import KeyIcon from './../../assets/key.svg';
import KeyColumn from './../../assets/key-idon-column.svg';
import DatabaseIcon from './../../assets/database-icon.svg';
import CloseIcon from './../../assets/x-circle.svg';

/* --------- util ids --------- */
export const makeId = (() => { let c = 0; return () => `f_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const makeFieldId = (() => { let c = 0; return () => `f_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const makeNodeId  = (() => { let c = 0; return () => `t_${Date.now().toString(36)}_${(c++).toString(36)}`; })();
export const nextPosition = (i: number) => ({ x: 100 + (i % 3) * 400, y: 80 + Math.floor(i / 3) * 220 });

const LANE_COUNT = 6;
const LANE_STEP  = 10;

type Field = {
  id: string;
  label: string;
  isPk?: boolean;
  hasType?: boolean;
  dataType?: DataType;
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
  onSetDataType?: (fieldId: string, type: DataType) => void;
};

/* --------- nodo --------- */
export function TableNode({ id, data }: NodeProps) {
  const {
    title, fields, onAddField, onRemove, onRenameTitle, onRenameField,
    onDeleteField, onTogglePk, onToggleType, onSetDataType
  } = data as TableData;

  const update = useUpdateNodeInternals();
  useLayoutEffect(() => {
    update(id);
  }, [
    id,
    title,
    fields.map((f) => `${f.label}:${f.isPk ? 1 : 0}:${f.hasType ? 1 : 0}:${f.dataType ?? ''}`).join('|'),
    update
  ]);

  // estados
  const [menuFieldId, setMenuFieldId] = useState<string | null>(null);
  const [hoverFieldId, setHoverFieldId] = useState<string | null>(null);
  const [typePopupFieldId, setTypePopupFieldId] = useState<string | null>(null); // ya lo tienes
  const [typePopupPos, setTypePopupPos] = useState<{ x: number; y: number } | null>(null);



  const menuRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const closeAll = (e: MouseEvent) => {
      const t = e.target as Element | null;
      const insideMenu  = !!(menuRef.current && t && menuRef.current.contains(t));
      const insidePopup = !!(popupRef.current && t && popupRef.current.contains(t));
      if (!insideMenu && !insidePopup) {
        setMenuFieldId(null);
        setTypePopupFieldId(null);
      }
    };
    document.addEventListener('mousedown', closeAll);
    return () => document.removeEventListener('mousedown', closeAll);
  }, []);

  return (
    <div className={styles.node_table}>
      {/* Título */}
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
          alt="Eliminar tabla"
          className={styles.node_table__close_button}
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
        />
      </div>

      <div className={styles.node_table__column_separator} />

      <div className={styles.node_table__columns_container}>
        {fields.map((field) => {
          const isMenuOpen = menuFieldId === field.id;
          const showHandlers = hoverFieldId === field.id;
          const canDelete = fields.length > 1;

          const guardLeave = (e: React.MouseEvent) => {
            const next = e.relatedTarget as Node | null;
            const toMenu  = !!(menuRef.current  && next && menuRef.current.contains(next));
            const toPopup = !!(popupRef.current && next && popupRef.current.contains(next));
            if (!toMenu && !toPopup) {
              setMenuFieldId(null);
              setTypePopupFieldId(null);
            }

            setHoverFieldId(null);
          };

          return (
            <div
              key={field.id}
              className={styles.node_table__column}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setMenuFieldId(field.id); }}
              onMouseEnter={() => setHoverFieldId(field.id)}
              onMouseLeave={guardLeave}
            >
              {/* AZUL visible */}
              <Handle
                className={cx(showHandlers ? styles.node_handler__blue : styles.node_handler_transparent)}
                type="target"
                id={`${field.id}-in`}
                position={Position.Left}
                style={{ left: 0, top: 0, transform: 'none', width: 12, height: '100%', border: 'none', borderRadius: 0, cursor: 'crosshair' }}
              />
              {/* AZUL ocultos */}
              {Array.from({ length: LANE_COUNT }).map((_, lane) => (
                <Handle
                  key={`blue-${lane}`}
                  type="source"
                  id={`${field.id}-in-src-btm-${lane}`}
                  position={Position.Bottom}
                  style={{ left: 0 + lane * LANE_STEP, width: 12, height: 8, bottom: -2, background: 'transparent', border: 'none', pointerEvents: 'none' }}
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

              {/* ROJO visible */}
              <Handle
                className={cx(showHandlers ? styles.node_handler__red : styles.node_handler_transparent)}
                type="source"
                id={`${field.id}-out`}
                position={Position.Right}
                style={{ right: 0, top: 0, transform: 'none', width: 12, height: '100%', border: 'none', borderRadius: 0, cursor: 'crosshair' }}
              />
              {/* ROJO ocultos */}
              {Array.from({ length: LANE_COUNT }).map((_, lane) => (
                <Handle
                  key={`red-${lane}`}
                  type="target"
                  id={`${field.id}-out-tgt-btm-${lane}`}
                  position={Position.Bottom}
                  style={{ left: `calc(100% - 12px - ${lane * LANE_STEP}px)`, width: 12, height: 8, bottom: -2, background: 'transparent', border: 'none', pointerEvents: 'none' }}
                />
              ))}

              {/* Badges */}
              {(field.isPk || field.hasType) && (
                <div className={styles.node_table__badgesCorner} aria-hidden>
                  {field.hasType && <img src={DatabaseIcon} className={styles.badge_icon_sm} alt="" />}
                  {field.isPk && <img src={KeyColumn} className={styles.badge_icon_sm} alt="" />}
                </div>
              )}

              {/* ===== Menú contextual ===== */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className={cx('nodrag', styles.node_table__column_menu)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseLeave={(e) => {
                    const next = e.relatedTarget as Node | null;
                    if (popupRef.current && next && popupRef.current.contains(next)) return; // ← NO cerrar si vas al popup
                    setMenuFieldId(null);
                    setTypePopupFieldId(null);
                  }}
                >
                  {/* rojo: eliminar */}
                  <button
                    className={cx(styles.menu_item, styles.menu_red, !canDelete && styles.menu_disabled)}
                    disabled={!canDelete}
                    onClick={() => { if (canDelete) onDeleteField?.(field.id); setMenuFieldId(null); setTypePopupFieldId(null); }}
                    title={canDelete ? 'Eliminar columna' : 'Agrega otra columna para poder eliminar ésta'}
                  >
                    <img src={TrashICon} alt="Eliminar" />
                  </button>

                  {/* amarillo: PK toggle */}
                  <button
                    className={cx(styles.menu_item, styles.menu_yellow)}
                    onClick={() => { onTogglePk?.(field.id, !field.isPk); setMenuFieldId(null); setTypePopupFieldId(null); }}
                    title={field.isPk ? 'Quitar PK' : 'Marcar como PK'}
                  >
                    <img src={KeyIcon} alt="PK" />
                  </button>

                  {/* verde: abrir POPUP tipos */}
                  <button
                    className={cx(styles.menu_item, styles.menu_green)}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setTypePopupFieldId(field.id);
                      setTypePopupPos({ x: rect.right, y: rect.top - 6 });
                      setMenuFieldId(field.id); 
                    }}
                    title="Seleccionar tipo"
                  >
                    <img src={DatabaseIcon} alt="Tipo" />
                  </button>
                </div>
              )}

              {/* ===== Popup de tipos ===== */}
              {typePopupFieldId === field.id && typePopupPos && createPortal(
                <div
                  ref={popupRef}
                  className={styles.type_popup_portal}
                  style={{ left: typePopupPos.x, top: typePopupPos.y }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {(['INT','DATE', 'VARCHAR'] as DataType[]).map((dt) => (
                    <button
                      key={dt}
                      className={cx(styles.type_item, field.dataType === dt && styles.type_item_active)}
                      onClick={() => {
                        onSetDataType?.(field.id, dt);
                        onToggleType?.(field.id, true);
                        setTypePopupFieldId(null);
                        setMenuFieldId(null);
                      }}
                    >
                      {dt}
                    </button>
                  ))}
                </div>,
                document.body
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

