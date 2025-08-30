import {
    FiChevronLeft,
    FiChevronRight,
    FiShuffle,
    FiCopy,
} from "react-icons/fi";
import "./FlashcardViewer.css";

type FlashcardViewerProps = {
    card: { front_content: string; back_content: string };
    isFlipped: boolean;
    onNext: () => void;
    onPrev: () => void;
    onShuffle: () => void;
    onReverse: () => void;
    onFlip: () => void;
};

const FlashcardViewer = ({
    card,
    isFlipped,
    onNext,
    onPrev,
    onShuffle,
    onReverse,
    onFlip,
}: FlashcardViewerProps) => {
    const cardText = isFlipped ? card.back_content : card.front_content;
    return (
        <div className="flashcard-viewer-container">
            <div className="flashcard-viewer">
                <button onClick={onPrev} className="nav-arrow left">
                    <FiChevronLeft size={32} />
                </button>
                <div
                    className="flashcard-content"
                    onClick={onFlip}
                    dangerouslySetInnerHTML={{ __html: cardText }}
                ></div>
                <button onClick={onNext} className="nav-arrow right">
                    <FiChevronRight size={32} />
                </button>
            </div>
            <footer className="flashcard-footer-controls">
                <button onClick={onShuffle} className="icon-btn">
                    <FiShuffle />
                </button>
                <button onClick={onReverse} className="icon-btn">
                    <FiCopy />
                </button>
            </footer>
        </div>
    );
};

export default FlashcardViewer;
