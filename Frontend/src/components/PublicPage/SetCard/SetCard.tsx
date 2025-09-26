import { FiCalendar, FiEye, FiHeart } from "react-icons/fi";
import "./SetCard.css";

type SetCardProps = {
    name: string;
    description: string;
    creator: string;
    created_at: string;
    view_count?: number;
    like_count?: number;
};

const formatNumber = (number: number): string => {
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}m.`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}k.`;
    return number.toString();
};

const SetCard = ({
    name,
    description,
    creator,
    created_at,
    view_count,
    like_count,
}: SetCardProps) => {
    const initial = creator ? creator[0].toUpperCase() : "?";
    const formattedDate = created_at
        ? new Date(created_at).toLocaleDateString()
        : "";

    return (
        <div className="set-card">
            <div>
                <div className="set-card-header">
                    <div className="set-card-initial">{initial}</div>
                    <span className="set-card-name">{name}</span>
                </div>
                <p className="set-card-description">{description}</p>
            </div>
            <div className="set-card-footer">
                <div className="card-stat">
                    <FiCalendar size={14} />
                    <span>{formattedDate}</span>
                </div>
                <div className="card-extra-stats">
                    {typeof view_count === "number" && (
                        <div className="card-stat">
                            <FiEye size={14} />
                            <span>{formatNumber(view_count)}</span>
                        </div>
                    )}
                    {typeof like_count === "number" && (
                        <div className="card-stat">
                            <FiHeart size={14} />
                            <span>{formatNumber(like_count)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetCard;
