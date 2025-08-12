import { useNavigate, useParams } from "react-router-dom";
import "./FlashcardSetView.css";
import SetHeader from "./SetHeader/SetHeader";
import SetActionButtons from "./SetActionButtons/SetActionButtons";
import FlashcardViewer from "./FlashcardViewer/FlashcardViewer";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useEffect } from "react";
import {
    clearSet,
    getSet,
} from "../../features/flashcardSets/flashcardSetViewerSlice";

const FlashcardSetView = () => {
    const { setId } = useParams<{ setId: string }>();
    console.log(setId);
    const { set, status, error } = useAppSelector(
        (state) => state.flashcardSetViewer,
    );
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (setId) {
            dispatch(getSet(Number(setId)));
        }

        return () => {
            dispatch(clearSet());
        };
    }, [dispatch, setId]);

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
                initial={set.creator}
                onBackClick={() => navigate(-1)}
            />
            <div className="divider"></div>
            <SetActionButtons setId={setId} />
            <FlashcardViewer cardText={set.flashcards[0].front_content} />
        </div>
    );
};

export default FlashcardSetView;
