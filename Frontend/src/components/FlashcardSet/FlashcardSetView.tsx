import { useNavigate, useParams } from "react-router-dom";
import "./FlashcardSetView.css";
import SetHeader from "./SetHeader/SetHeader";
import SetActionButtons from "./SetActionButtons/SetActionButtons";
import FlashcardViewer from "./FlashcardViewer/FlashcardViewer";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useEffect, useState } from "react";
import {
    getSet,
    resetFlashcardSet,
} from "../../features/flashcardSets/flashcardSetSlice";
import { CommentSection } from "./Comments/CommentsSection";

type Flashcard = {
    front_content: string;
    back_content: string;
};

const FlashcardSetView = () => {
    const { setId } = useParams<{ setId: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        data: set,
        status,
        error,
    } = useAppSelector((state) => state.flashcardSet);

    const { isAuthenticated } = useAppSelector((state) => state.auth);

    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (status === "failed" && error?.statusCode === 401) {
            navigate("/login", { replace: true });
        }
    }, [status, error, navigate]);

    useEffect(() => {
        if (set && !set.is_public && !isAuthenticated) {
            navigate("/login", { replace: true });
        }
    }, [isAuthenticated, set, navigate]);

    useEffect(() => {
        if (setId) {
            dispatch(getSet(Number(setId)));
        }

        return () => {
            dispatch(resetFlashcardSet());
        };
    }, [dispatch, setId]);

    useEffect(() => {
        if (set && set.flashcards) {
            setCards(set.flashcards);
            setCurrentIndex(0);
            setIsFlipped(false);
        }
    }, [set]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % cards.length);
        setIsFlipped(false);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
        setIsFlipped(false);
    };

    const handleShuffle = () => {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const handleReverse = () => {
        const reversed = cards.map((card) => ({
            ...card,
            front_content: card.back_content,
            back_content: card.front_content,
        }));
        setCards(reversed);
        setIsFlipped(false);
    };

    const handleFlip = () => {
        setIsFlipped((prev) => !prev);
    };

    const handleEditClick = () => {
        navigate(`/app/set/edit/${setId}`);
    };

    if (status == "loading") {
        return <div></div>;
    }

    if (status == "failed") {
        if (error?.statusCode === 401) {
            return <div></div>;
        }
        return <div>Error: {error?.message}</div>;
    }

    if (!set || cards.length === 0) {
        return <div>Set not found or has no FlashCards</div>;
    }

    return (
        <div className="flashcard-set-view">
            <SetHeader
                onBackClick={() => navigate(-1)}
                onEditClick={handleEditClick}
            />
            <div className="divider"></div>
            <SetActionButtons setId={setId} />
            <FlashcardViewer
                card={cards[currentIndex]}
                isFlipped={isFlipped}
                onNext={handleNext}
                onPrev={handlePrev}
                onShuffle={handleShuffle}
                onReverse={handleReverse}
                onFlip={handleFlip}
            />
            <CommentSection />
        </div>
    );
};

export default FlashcardSetView;
