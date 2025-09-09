import { FiThumbsDown, FiThumbsUp } from "react-icons/fi";
import "./VoteButtons.css";
type VoteButtonProps = {
    upvotes: number;
    downvotes: number;
    userVote: "upvote" | "downvote" | null;
    onVote: (voteType: "upvote" | "downvote") => void;
    size?: "small" | "medium";
};

export const VoteButtons = ({
    upvotes,
    downvotes,
    userVote,
    onVote,
    size = "medium",
}: VoteButtonProps) => {
    const iconSize = size === "small" ? 16 : 22;
    return (
        <div className={`vote-buttons-container size-${size}`}>
            <button
                className={`vote-btn ${userVote === "upvote" ? "active" : ""}`}
                onClick={() => {
                    onVote("upvote");
                }}
            >
                <FiThumbsUp size={iconSize} />
                <span>{upvotes}</span>
            </button>

            <button
                className={`vote-btn ${userVote === "downvote" ? "active" : ""}`}
                onClick={() => {
                    onVote("downvote");
                }}
            >
                <FiThumbsDown size={iconSize} />
                <span>{downvotes}</span>
            </button>
        </div>
    );
};
