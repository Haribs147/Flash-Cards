import { useState, useRef, useEffect, useMemo } from "react";
import { FiEdit, FiShare2, FiX, FiCopy, FiTrash2 } from "react-icons/fi";
import "./SetHeader.css";
import {
    copySet,
    removeShare,
    savePermissionChanges,
    shareSet,
    voteOnMaterial,
    type SharedUser,
} from "../../../features/flashcardSets/flashcardSetSlice";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { VoteButtons } from "../../common/VoteButtons/VoteButtons";
import CopySetModal from "../../modals/CopySetModal";

type SetHeaderProps = {
    onBackClick: () => void;
    onEditClick: () => void;
};

const SetHeader = ({ onBackClick, onEditClick }: SetHeaderProps) => {
    const { setId } = useParams<{ setId: string }>();
    const dispatch = useAppDispatch();

    const { data: set } = useAppSelector((state) => state.flashcardSet);

    const [emailToShare, setEmailToShare] = useState("");
    const [isSharePopupOpen, setSharePopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);

    const [localShares, setLocalShares] = useState<SharedUser[]>([]);

    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

    const handleConfirmCopy = (targetFolderId: number | null) => {
        if (!setId) {
            return;
        }

        dispatch(copySet({ setId: Number(setId), targetFolderId }))
            .unwrap()
            .then(() => {
                console.log("yay, set was copied");
            })
            .catch((error) => {
                console.error(`:(, set was not copied ${error}`);
            });
        setIsCopyModalOpen(false);
    };

    useEffect(() => {
        if (set) {
            setLocalShares(set.shared_with);
        }
    }, [set?.shared_with]);

    const hasChanges = useMemo(() => {
        if (!set?.shared_with || !localShares) {
            return false;
        }
        const originalMap = new Map(
            set.shared_with.map((user) => [user.user_id, user.permission]),
        );
        for (const localUser of localShares) {
            if (originalMap.get(localUser.user_id) !== localUser.permission) {
                return true;
            }
        }
    }, [set?.shared_with, localShares]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                shareButtonRef.current &&
                shareButtonRef.current.contains(event.target as Node)
            ) {
                return;
            }

            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node)
            ) {
                setSharePopupOpen(false);
            }
        };

        if (isSharePopupOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isSharePopupOpen]);

    const handleVote = (voteType: "upvote" | "downvote") => {
        if (!setId) {
            return;
        }
        dispatch(
            voteOnMaterial({ materialId: Number(setId), vote_type: voteType }),
        );
    };

    const handleAddShare = () => {
        if (!emailToShare || !setId) {
            return;
        }
        dispatch(shareSet({ setId: Number(setId), email: emailToShare }));
        setEmailToShare("");
    };

    const handleRemoveShare = (userId: number) => {
        if (!userId) {
            return;
        }
        dispatch(removeShare({ setId: Number(setId), userId: userId }));
    };

    const handlePermissionChange = (
        userId: number,
        newPermission: "viewer" | "editor",
    ) => {
        setLocalShares((current) =>
            current.map((user) =>
                user.user_id === userId
                    ? { ...user, permission: newPermission }
                    : user,
            ),
        );
    };

    const handleSave = () => {
        if (!setId || !hasChanges) {
            return;
        }

        const updates = localShares
            .filter((localUser) => {
                const originalUser = set?.shared_with.find(
                    (user) => user.user_id === localUser.user_id,
                );
                return (
                    originalUser &&
                    originalUser.permission !== localUser.permission
                );
            })
            .map((user) => ({
                user_id: user.user_id,
                permission: user.permission,
            }));

        if (updates.length > 0) {
            dispatch(savePermissionChanges({ setId: Number(setId), updates }));
            setSharePopupOpen(false);
        }
    };

    return (
        <>
            <header className="set-header">
                <div className="set-avatar">
                    {set?.creator[0].toUpperCase()}
                </div>
                <div className="set-info">
                    <h1 className="set-title">{set?.name}</h1>
                    <p className="set-description">{set?.description}</p>
                </div>
                <div className="set-header-actions">
                    {set && (
                        <VoteButtons
                            upvotes={set.upvotes}
                            downvotes={set.downvotes}
                            userVote={set.user_vote}
                            onVote={handleVote}
                            size="medium"
                        />
                    )}

                    <button className="icon-btn" onClick={onEditClick}>
                        <FiEdit />
                    </button>
                    <button
                        className="icon-btn"
                        onClick={() => setIsCopyModalOpen(true)}
                    >
                        <FiCopy />
                    </button>
                    <div className="share-button-wrapper">
                        <button
                            ref={shareButtonRef}
                            onClick={() => setSharePopupOpen(!isSharePopupOpen)}
                            className={`icon-btn ${isSharePopupOpen ? "active" : ""}`}
                        >
                            <FiShare2 />
                        </button>

                        {isSharePopupOpen && (
                            <div ref={popupRef} className="share-popup">
                                <h3 className="popup-title">
                                    Udostępnij zestaw
                                </h3>
                                <div className="add-person-form">
                                    <input
                                        type="email"
                                        placeholder="Dodaj osoby (email)"
                                        value={emailToShare}
                                        onChange={(e) =>
                                            setEmailToShare(e.target.value)
                                        }
                                    />
                                    <button onClick={handleAddShare}>
                                        Dodaj
                                    </button>
                                </div>
                                <p className="popup-subtitle">
                                    Osoby z dostępem
                                </p>
                                <ul className="person-list">
                                    {set?.creator && (
                                        <li className="person-item">
                                            <span>{set.creator}</span>
                                            <span className="owner-text">
                                                Właściciel
                                            </span>
                                        </li>
                                    )}
                                    {set?.shared_with.map((user) => (
                                        <li
                                            key={user.email}
                                            className="person-item"
                                        >
                                            <span>{user.email}</span>
                                            <select
                                                className="role-select"
                                                defaultValue={user.permission}
                                                onChange={(e) =>
                                                    handlePermissionChange(
                                                        user.user_id,
                                                        e.target.value as
                                                            | "viewer"
                                                            | "editor",
                                                    )
                                                }
                                            >
                                                <option value="editor">
                                                    Edytujący
                                                </option>
                                                <option value="viewer">
                                                    Wyświetlający
                                                </option>
                                            </select>
                                            <button
                                                className="remove-btn"
                                                onClick={() =>
                                                    handleRemoveShare(
                                                        user.user_id,
                                                    )
                                                }
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {hasChanges && (
                                    <div className="popup-actions">
                                        <button
                                            className="save-btn"
                                            onClick={handleSave}
                                        >
                                            Gotowe
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onBackClick}
                        className="icon-btn close-link"
                    >
                        <FiX />
                    </button>
                </div>
            </header>

            <CopySetModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                onConfirm={handleConfirmCopy}
            />
        </>
    );
};

export default SetHeader;
