import { useNavigate } from "react-router-dom";
import "./SetActionButtons.css";

type SetActionButtonsProps = {
    setId: string | undefined;
};

const SetActionButtons = ({ setId }: SetActionButtonsProps) => {
    const navigate = useNavigate();

    const handleCheckKnowledgeClick = () => {
        if (setId) {
            navigate(`/set/${setId}/check`);
        }
    };

    return (
        <div className="set-main-actions">
            <button
                className="action-btn-pink"
                onClick={handleCheckKnowledgeClick}
            >
                Sprawdź wiedzę
            </button>
            <button className="action-btn-pink">Ucz się</button>
            <button className="action-btn-pink">Testy</button>
        </div>
    );
};

export default SetActionButtons;
