import { useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import {
    addComment,
    type Comment,
} from "../../../features/flashcardSets/flashcardSetSlice";
import "./Comments.css";

type CommentItemProps = {
    comment: Comment;
    materialId: number;
    isTopLevel: boolean;
};

export const CommentItem = ({
    comment,
    materialId,
    isTopLevel,
}: CommentItemProps) => {
    const dispatch = useAppDispatch();
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");

    const handleReplySubmit = () => {
        if (replyText.trim()) {
            dispatch(
                addComment({
                    materialId,
                    text: replyText,
                    parentCommentId: comment.id,
                }),
            );
            setReplyText("");
            setIsReplying(false);
        }
    };

    return (
        <div className="comment-item">
            <div className="comment-avatar">
                {comment.author_email[0]?.toUpperCase()}
            </div>
            <div className="comment-body">
                <div className="comment-header">
                    <span className="comment-author">
                        {comment.author_email}
                    </span>
                    <span className="comment-date">
                        {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-actions">
                    {isTopLevel && (
                        <button
                            className="reply-btn"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            Odpowiedz
                        </button>
                    )}
                </div>
                {isReplying && (
                    <div className="comment-input-form reply-form">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Odpowiadasz ${comment.author_email}...`}
                            autoFocus
                        />
                        <div className="reply-actions">
                            <button
                                className="cancel-btn"
                                onClick={() => setIsReplying(false)}
                            >
                                Anuluj
                            </button>
                            <button onClick={handleReplySubmit}>
                                Odpowiedz
                            </button>
                        </div>
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="comment-replies">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                materialId={materialId}
                                isTopLevel={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
