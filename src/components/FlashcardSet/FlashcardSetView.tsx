import { useNavigate, useParams } from "react-router-dom";
import "./FlashcardSetView.css";
import SetHeader from "./SetHeader/SetHeader";
import SetActionButtons from "./SetActionButtons/SetActionButtons";
import FlashcardViewer from "./FlashcardViewer/FlashcardViewer";

const FlashcardSetView = () => {
  // In a real app, you'd use this ID to fetch the actual set data
  const navigate = useNavigate();
  const { setId } = useParams();

  // Placeholder data
  const set = {
    title: "Nazwa zestawu fiszek",
    description: `Opis zestawu fiszek (ID: ${setId})`,
    initial: "M",
  };

  const currentCard = {
    text: "Jakiś tekst do fiszki",
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
      <SetActionButtons setId={setId} />
      <FlashcardViewer cardText={currentCard.text} />
    </div>
  );
};

export default FlashcardSetView;
