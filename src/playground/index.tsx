import { useEffect, useState } from 'react';
import { RadioButtonsGroup } from '../shared/RadioButtonsGroup';
import { Modal } from '../shared/Modal';
import { PlaygroundDBSchema } from './components/PlaygroundDBSchema';
import { PlaygroundCode } from './components/PlaygroundCode';
import HelpIcon from '../assets/help_icon.svg';
import styles from './styles/playground.module.css';


import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState, addEdge,
  ConnectionLineType, type Node, type Edge, type Connection
} from '@xyflow/react';

const initialEdges: Edge[] = [];
const initialNodes: Node[] = [];

export const PlayGround = () => {
  const [buttonsSelected, setButtonsSelected] = useState([true, false, false, false]);
  const [activeButtons, setActiveButtons] = useState([true, false, false, false]);
  // const [activeButtons, setActiveButtons] = useState([true, true, true, true]);
  const [code, setCode] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [open, setOpen] = useState(false);
  const [schemaInstructions, setschemaInstructions] = useState(true);

  const onButtonSelectedChange = (id: number) => {
    const buttonsSelected = Array(4).fill(false);
    buttonsSelected[id] = true;

    setButtonsSelected(buttonsSelected);
  }

  useEffect(() => {
    if (nodes.length > 0) {
      setActiveButtons([true, true, false, false]);
    } else {
      setActiveButtons([true, false, false, false]);
    }

    console.log(nodes.length);
  }, [nodes])
  

  return (
    <div
      className={styles.playground}
    >
      <div
        className={styles.playground__options}
      >
        <RadioButtonsGroup
          groupName='PlaygroundOptions'
          buttonsTitles={["Crea", "Programa", "Convierte", "Historial"]}
          initialButtonsSelected={buttonsSelected}
          activeButtons={activeButtons}
          styleUnselected={true}
          onButtonSelected={onButtonSelectedChange}
        />
        <div
          className={styles.playground__help_icon}
        >
          <img src={HelpIcon} alt="Help icon" onClick={() => setOpen(true)}/>
        </div>
      </div>
      <div
        className={styles.playground__canvas}
      >
        { buttonsSelected[0] && <PlaygroundDBSchema nodes={nodes} edges={edges} setEdges={setEdges} setNodes={setNodes} onEdgesChange={onEdgesChange} onNodesChange={onNodesChange} /> }
        { buttonsSelected[1] && <PlaygroundCode code={code} onCodeChange={(newCode) => setCode(newCode)} /> }
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={schemaInstructions ? "¿Cómo se editan las tablas?" : "Como convertir tu consulta"}>
        {
          schemaInstructions ? (
            <div>
              
            </div>
          ) : (
            <div></div>
          )
        }
      </Modal>
    </div>
  )
}
