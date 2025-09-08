import { FiEdit, FiTrash2 } from "react-icons/fi";
import "./ItemActions.css";

type ItemActionsProps = {
    onEditClick: (e: React.MouseEvent) => void;
    onDeleteClick: (e: React.MouseEvent) => void;
};

const ItemActions = ({ onEditClick, onDeleteClick }: ItemActionsProps) => {
    return (
        <div className="item-actions">
            <button onClick={onEditClick} className="action-button">
                <FiEdit size={18} />
            </button>

            <button onClick={onDeleteClick} className="action-button">
                <FiTrash2 size={18} />
            </button>
        </div>
    );
};

export default ItemActions;
