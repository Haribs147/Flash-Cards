import { useParams } from 'react-router-dom';
import './FlashcardSetView.css';
import SetHeader from './SetHeader';
import SetActionButtons from './SetActionButtons';
import FlashcardViewer from './FlashCardViewer';

const FlashcardSetView = () => {
    // In a real app, you'd use this ID to fetch the actual set data
    const { setId } = useParams();

    // Placeholder data
    const set = {
        title: "Nazwa zestawu fiszek",
        description: `Opis zestawu fiszek (ID: ${setId})`,
        initial: "M"
    };

    const currentCard = {
        text: "Jakiś tekst do fiszki"
    };

    return (
        <div className="flashcard-set-view">
            <SetHeader
                title={set.title}
                description={set.description}
                initial={set.initial}
            />
            <div className="divider"></div>
            <SetActionButtons />
            <FlashcardViewer cardText={currentCard.text} />
        </div>
    );
};

export default FlashcardSetView;