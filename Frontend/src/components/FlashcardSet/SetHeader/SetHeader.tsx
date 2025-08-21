import { useState, useRef, useEffect } from "react";
import { FiEdit, FiShare2, FiX, FiCopy } from "react-icons/fi";
import "./SetHeader.css";

type SetHeaderProps = {
    title: string;
    description: string;
    initial: string;
    onBackClick: () => void;
    onEditClick: () => void;
};

const SetHeader = ({
    title,
    description,
    initial,
    onBackClick,
    onEditClick,
}: SetHeaderProps) => {
    const [isSharePopupOpen, setSharePopupOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const shareButtonRef = useRef<HTMLButtonElement>(null);

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

    return (
        <header className="set-header">
            <div className="set-avatar">{initial}</div>
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
                                <input type="text" placeholder="Dodaj osoby" />
                                <button>Dodaj</button>
                            </div>
                            <p className="popup-subtitle">Osoby z dostępem</p>
                            <ul className="person-list">
                                <li className="person-item">
                                    <span>Michał Jagodziński</span>
                                    <span className="owner-text">
                                        Właściciel
                                    </span>
                                </li>
                                <li className="person-item">
                                    <span>Magda Brudnowska</span>
                                    <select className="role-select">
                                        <option value="editor">
                                            Edytujący
                                        </option>
                                        <option value="viewer">
                                            Wyświetlający
                                        </option>
                                    </select>
                                </li>
                                <li className="person-item">
                                    <span>Michał Jakiś</span>
                                    <select
                                        className="role-select"
                                        defaultValue="viewer"
                                    >
                                        <option value="editor">
                                            Edytujący
                                        </option>
                                        <option value="viewer">
                                            Wyświetlający
                                        </option>
                                    </select>
                                </li>
                            </ul>
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
