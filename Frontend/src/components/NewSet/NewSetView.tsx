import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import "./NewSetView.css";
import TiptapEditor from "../TipTap/TipTapEditor";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
    addLocalFlashcard,
    getSet,
    initializeNewSet,
    resetFlashcardSet,
    saveSet,
    setDescription,
    setIsPublic,
    setName,
    updateFlashcardContent,
} from "../../features/flashcardSets/flashcardSetSlice";

const NewSetView = () => {
    const { setId } = useParams<{ setId?: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {
        data: set,
        status,
        error,
    } = useAppSelector((state) => state.flashcardSet);

    useEffect(() => {
        if (setId) {
            dispatch(getSet(Number(setId)));
        } else {
            dispatch(initializeNewSet());
        }

        return () => {
            dispatch(resetFlashcardSet());
        };
    }, [dispatch, setId]);

    const isSaveInitiated = useRef(false);

    useEffect(() => {
        console.log("status" + status);
        console.log("isSaveInitiated" + isSaveInitiated);

        if (status === "succeded" && isSaveInitiated.current) {
            navigate(-1);
        }
    }, [status, navigate]);

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
    }, [set]);

    const addFlashcard = () => {
        dispatch(addLocalFlashcard());
        scrollOnNextRender.current = true;
    };

    const handleCardChange = (
        id: number,
        field: "front" | "back",
        value: string,
    ) => {
        dispatch(
            updateFlashcardContent({
                index: id,
                side: field,
                content: value,
            }),
        );
    };

    const handleSave = () => {
        isSaveInitiated.current = true;
        dispatch(saveSet());
    };

    if (status === "loading") {
        return <div className="feedback-state">Tworzenie zestawu ...</div>;
    }

    if (status === "failed") {
        return <div className="feedback-state">Błąd: {error}</div>;
    }

    if (!set) {
        return <div className="feedback-state">Inicjowanie</div>;
    }

    return (
        <div className="new-set-view">
            <div className="new-set-header">
                <h2>{set.name}</h2>
                <button
                    className="done-btn"
                    disabled={status === "saving"}
                    onClick={handleSave}
                >
                    {status === "saving" ? "Zapisywanie..." : "Zapisz"}
                </button>
            </div>
            <div className="new-set-form">
                <input
                    type="text"
                    value={set.name}
                    onChange={(e) => {
                        dispatch(setName(e.target.value));
                    }}
                    placeholder="Wprowadź nazwę zestawu fiszek"
                    className="new-set-input"
                />
                <textarea
                    value={set.description}
                    onChange={(e) => {
                        dispatch(setDescription(e.target.value));
                    }}
                    placeholder="Wprowadź opis zestawu fiszek"
                    className="new-set-input description-input"
                />
                <div className="privacy-options">
                    <label>
                        <input
                            type="radio"
                            name="privacy"
                            checked={set.is_public}
                            onChange={() => {
                                dispatch(setIsPublic(true));
                            }}
                        />
                        Publiczny
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="privacy"
                            checked={!set.is_public}
                            onChange={() => {
                                dispatch(setIsPublic(false));
                            }}
                        />
                        Prywatny
                    </label>
                </div>
                <div className="divider"></div>
            </div>
            <div className="flashcard-list">
                {set.flashcards.map((card, index) => (
                    <div key={index} className="flashcard-editor-section">
                        <span className="flashcard-number">{index + 1}</span>
                        <div className="flashcard-inputs">
                            <div className="editor-wrapper">
                                <TiptapEditor
                                    content={card.front_content}
                                    onChange={(newContent) =>
                                        handleCardChange(
                                            index,
                                            "front",
                                            newContent,
                                        )
                                    }
                                    placeholder="Wpisz pojęcie (awers)"
                                />
                                <div className="editor-label">POJĘCIE</div>
                            </div>
                            <div className="editor-wrapper">
                                <TiptapEditor
                                    content={card.back_content}
                                    onChange={(newContent) =>
                                        handleCardChange(
                                            index,
                                            "back",
                                            newContent,
                                        )
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
