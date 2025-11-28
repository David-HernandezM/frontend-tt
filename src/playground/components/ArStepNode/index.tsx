import { Handle, Position, type NodeProps, type NodeTypes, type Node } from '@xyflow/react';
import cx from 'clsx';
import styles from './TextStepNode.module.css';

export type StepNodeData = {
  id: string;
  fase: string;
  sql?: string;
  arActual: string;
  step: number;
  arHeader: string;
  isRoot?: boolean;
};

interface StepNodeUIProps {
  data: StepNodeData;
  selected?: boolean;
}

export const TextStepNodeUI: React.FC<StepNodeUIProps> = ({ data, selected }) => {
  return (
    <div className={cx(styles.node, selected && styles.nodeSelected)}>
      {/* handle superior (target) */}
      <Handle
        id="in"
        type="target"
        position={Position.Top}
        style={{ visibility: 'hidden' }}   // invisible pero presente
      />

      <div className={styles.header}>
        <span className={styles.badgeFase}>{data.fase}</span>
      </div>

      {
        !data.isRoot && (
          <>
            <div className={styles.label}>AR</div>
            <pre className={styles.sqlBox}>{data.sql}</pre>
          </>
        )
      }

      <div className={styles.label}>Álgebra Relacional</div>
      <pre className={styles.arBox}>{data.arHeader}</pre>

      {/* handle inferior (source) */}
      <Handle
        id="out"
        type="source"
        position={Position.Bottom}
        style={{ visibility: 'hidden' }}
      />
    </div>
  );
};

// Adaptador RF
type RFStepNode = Node<StepNodeData>;
export const TextStepNode: React.FC<NodeProps<RFStepNode>> = ({ data, selected }) => {
  return <TextStepNodeUI data={data} selected={selected} />;
};

export const stepNodeTypes: NodeTypes = {
  step: TextStepNode,
};
