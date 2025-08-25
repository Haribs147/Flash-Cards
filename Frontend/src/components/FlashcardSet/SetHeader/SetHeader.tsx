import { useState, useRef, useEffect, useMemo } from "react";
import { FiEdit, FiShare2, FiX, FiCopy, FiTrash2 } from "react-icons/fi";
import "./SetHeader.css";
import {
    removeShare,
    savePermissionChanges,
    shareSet,
    type SharedUser,
} from "../../../features/flashcardSets/flashcardSetSlice";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "../../../app/hooks";

type SetHeaderProps = {
    title: string;
    description: string;
    creator: string;
    sharedWith: SharedUser[];
    onBackClick: () => void;
    onEditClick: () => void;
};

const SetHeader = ({
    title,
    description,
    creator,
    sharedWith,
    onBackClick,
    onEditClick,
}: SetHeaderProps) => {
    const { setId } = useParams<{ setId: string }>();
    const dispatch = useAppDispatch();
    const [emailToShare, setEmailToShare] = useState("");
    const [isSharePopupOpen, setSharePopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);

    const [localShares, setLocalShares] = useState<SharedUser[]>([]);

    useEffect(() => {
        setLocalShares(sharedWith);
    }, [sharedWith]);

    const hasChanges = useMemo(() => {
        if (!sharedWith || !localShares) {
            return false;
        }
        const originalMap = new Map(
            sharedWith.map((user) => [user.user_id, user.permission]),
        );
        for (const localUser of localShares) {
            if (originalMap.get(localUser.user_id) !== localUser.permission) {
                return true;
            }
        }
    }, [sharedWith, localShares]);

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
                const originalUser = sharedWith.find(
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
        <header className="set-header">
            <div className="set-avatar">{creator[0].toUpperCase()}</div>
            <div className="set-info">
                <h1 className="set-title">{title}</h1>
                <p className="set-description">{description}</p>
            </div>
            <div className="set-header-actions">
                <button className="icon-btn" onClick={onEditClick}>
                    <FiEdit />
                </button>
                <button className="icon-btn">
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
                            <h3 className="popup-title">Udostępnij zestaw</h3>
                            <div className="add-person-form">
                                <input
                                    type="email"
                                    placeholder="Dodaj osoby (email)"
                                    value={emailToShare}
                                    onChange={(e) =>
                                        setEmailToShare(e.target.value)
                                    }
                                />
                                <button onClick={handleAddShare}>Dodaj</button>
                            </div>
                            <p className="popup-subtitle">Osoby z dostępem</p>
                            <ul className="person-list">
                                {creator && (
                                    <li className="person-item">
                                        <span>{creator}</span>
                                        <span className="owner-text">
                                            Właściciel
                                        </span>
                                    </li>
                                )}
                                {sharedWith.map((user) => (
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
                                                handleRemoveShare(user.user_id)
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
                <button onClick={onBackClick} className="icon-btn close-link">
                    <FiX />
                </button>
            </div>
        </header>
    );
};

export default SetHeader;
