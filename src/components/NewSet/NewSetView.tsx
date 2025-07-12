import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { useState } from "react";
import "./NewSetView.css";
import TiptapEditor from "../TipTap/TipTapEditor";

const NewSetView = () => {
  const [cardTerm, setCardTerm] = useState("");
  const [cardDefinition, setCardDefinition] = useState("");
  return (
    <div className="new-set-view">
      <div className="new-set-header">
        <h2>Nowy zestaw fiszek</h2>
        <Link to="/" className="close-btn">
          <FiX />
        </Link>
      </div>
      <div className="new-set-form">
        <input
          type="text"
          placeholder="Wprowadź nazwę zestawu fiszek"
          className="new-set-input"
        />
        <textarea
          placeholder="Wprowadź opis zestawu fiszek"
          className="new-set-input description-input"
        />
        <div className="privacy-options">
          <label>
            <input type="radio" name="privacy" value="public" defaultChecked />
            Publiczny
          </label>
          <label>
            <input type="radio" name="privacy" value="private" />
            Prywatny
          </label>
        </div>
        <div className="divider"></div>
      </div>
      <div className="flashcard-editor-section">
        <span className="flashcard-number">1</span>
        <div className="flashcard-inputs">
          <div className="editor-wrapper">
            <TiptapEditor
              content={cardTerm}
              onChange={setCardTerm}
              placeholder="Wpisz pojęcie (awers)"
            />
            <div className="editor-label">POJĘCIE</div>
          </div>
          <div className="editor-wrapper">
            <TiptapEditor
              content={cardDefinition}
              onChange={setCardDefinition}
              placeholder="Wpisz definicję (rewers)"
            />
            <div className="editor-label">DEFINICJA</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSetView;
