import {
  FiChevronLeft,
  FiChevronRight,
  FiShuffle,
  FiCopy,
} from "react-icons/fi";
import "./FlashcardViewer.css";

type FlashcardViewerProps = {
  cardText: string;
};

const FlashcardViewer = ({ cardText }: FlashcardViewerProps) => {
  return (
    <div className="flashcard-viewer-container">
      <div className="flashcard-viewer">
        <button className="nav-arrow left">
          <FiChevronLeft size={32} />
        </button>
        <div className="flashcard-content">{cardText}</div>
        <button className="nav-arrow right">
          <FiChevronRight size={32} />
        </button>
      </div>
      <footer className="flashcard-footer-controls">
        <button className="icon-btn">
          <FiShuffle />
        </button>
        <button className="icon-btn">
          <FiCopy />
        </button>
      </footer>
    </div>
  );
};

export default FlashcardViewer;
