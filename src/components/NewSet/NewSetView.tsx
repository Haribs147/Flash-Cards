import { Link } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import "./NewSetView.css";
import TiptapEditor from "../TipTap/TipTapEditor";

const NewSetView = () => {
  const [flashcards, setFlashcards] = useState([
    { id: 1, term: "", definition: "" },
  ]);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const scrollOnNextRender = useRef(false);
  useEffect(() => {
    if (scrollOnNextRender.current) {
      buttonRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      scrollOnNextRender.current = false;
    }
  }, [flashcards]);

  const addFlashcard = () => {
    const maxId =
      flashcards.length > 0
        ? Math.max(...flashcards.map((card) => card.id))
        : 0;

    const newCard = {
      id: maxId + 1,
      term: "",
      definition: "",
    };

    scrollOnNextRender.current = true;

    setFlashcards([...flashcards, newCard]);
  };

  const handleCardChange = (id: number, field: string, value: string) => {
    setFlashcards(
      flashcards.map((card) =>
        card.id === id ? { ...card, [field]: value } : card,
      ),
    );
  };

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
      <div className="flashcard-list">
        {flashcards.map((card, index) => (
          <div key={card.id} className="flashcard-editor-section">
            <span className="flashcard-number">{index + 1}</span>
            <div className="flashcard-inputs">
              <div className="editor-wrapper">
                <TiptapEditor
                  content={card.term}
                  onChange={(newContent) =>
                    handleCardChange(card.id, "term", newContent)
                  }
                  placeholder="Wpisz pojęcie (awers)"
                />
                <div className="editor-label">POJĘCIE</div>
              </div>
              <div className="editor-wrapper">
                <TiptapEditor
                  content={card.definition}
                  onChange={(newContent) =>
                    handleCardChange(card.id, "term", newContent)
                  }
                  placeholder="Wpisz definicję (rewers)"
                />
                <div className="editor-label">DEFINICJA</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="add-flashcard-wrapper">
        <button
          ref={buttonRef}
          onClick={addFlashcard}
          className="add-flashcard-btn"
        >
          Dodaj Fiszkę
        </button>
      </div>
    </div>
  );
};

export default NewSetView;
