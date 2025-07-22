import { useNavigate, useParams } from "react-router-dom";
import SetHeader from "./SetHeader/SetHeader";
import FlashcardViewer from "./FlashcardViewer/FlashcardViewer";
import ProgressBar from "./ProgressBar/ProgressBar";
import "./FlashcardSetView.css";

const KnowledgeCheckView = () => {
    const { setId } = useParams();
    const navigate = useNavigate();

    const set = {
        title: "Nazwa zestawu fiszek",
        description: `Opis zestawu fiszek (ID: ${setId})`,
        initial: "M",
    };

    const currentCard = {
        text: "Jakiś tekst do fiszki",
    };

    const progress = {
        incorrect: 5,
        correct: 3,
        total: 15,
    };

    return (
        <div className="flashcard-set-view">
            <SetHeader
                title={set.title}
                description={set.description}
                initial={set.initial}
                onBackClick={() => navigate(-1)}
            />
            <div className="divider"></div>
            <ProgressBar
                correct={progress.correct}
                incorrect={progress.incorrect}
                total={progress.total}
            />
            <FlashcardViewer cardText={currentCard.text} />
        </div>
    );
};

export default KnowledgeCheckView;
