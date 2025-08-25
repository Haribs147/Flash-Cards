import { useNavigate, useParams } from "react-router-dom";
import "./FlashcardSetView.css";
import SetHeader from "./SetHeader/SetHeader";
import SetActionButtons from "./SetActionButtons/SetActionButtons";
import FlashcardViewer from "./FlashcardViewer/FlashcardViewer";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useEffect } from "react";
import {
    getSet,
    resetFlashcardSet,
} from "../../features/flashcardSets/flashcardSetSlice";

const FlashcardSetView = () => {
    const { setId } = useParams<{ setId: string }>();
    console.log(setId);
    const {
        data: set,
        status,
        error,
    } = useAppSelector((state) => state.flashcardSet);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (setId) {
            dispatch(getSet(Number(setId)));
        }

        return () => {
            dispatch(resetFlashcardSet());
        };
    }, [dispatch, setId]);

    const handleEditClick = () => {
        navigate(`/set/edit/${setId}`);
    };

    if (status == "loading") {
        return <div></div>;
    }

    if (status == "failed") {
        return <div>Error: {error}</div>;
    }

    if (!set) {
        return <div>Set not found</div>;
    }

    return (
        <div className="flashcard-set-view">
            <SetHeader
                title={set.name}
                description={set.description}
                creator={set.creator}
                sharedWith={set.shared_with}
                onBackClick={() => navigate(-1)}
                onEditClick={handleEditClick}
            />
            <div className="divider"></div>
            <SetActionButtons setId={setId} />
            <FlashcardViewer cardText={set.flashcards[0].front_content} />
        </div>
    );
};

export default FlashcardSetView;
