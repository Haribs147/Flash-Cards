import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
    addComment,
    deleteComment,
    updateComment,
    voteOnComment,
    type Comment,
} from "../../../features/flashcardSets/flashcardSetSlice";
import "./Comments.css";
import ItemActions from "../../common/ItemActions/ItemActions";
import { VoteButtons } from "../../common/VoteButtons/VoteButtons";

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
    const { user } = useAppSelector((state) => state.auth);

    const [isReplying, setIsReplying] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [editText, setEditText] = useState(comment.text);

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

    const handleUpdateSubmit = () => {
        if (editText.trim() && editText.trim() !== comment.text) {
            dispatch(updateComment({ commentId: comment.id, text: editText }));
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm("Czy na pewno chcesz usunąć ten komentarz?")) {
            dispatch(deleteComment(comment.id));
        }
    };

    const handleVote = (vote_type: "upvote" | "downvote") => {
        dispatch(voteOnComment({ commentId: comment.id, vote_type }));
    };

    const isAuthor = String(user?.email) === String(comment.author_email);

    console.log("Author Check:", {
        loggedInEmail: String(user?.email),
        commentAuthorEmail: String(comment.author_email),
        // This will tell us the exact result of the comparison
        isMatch: String(user?.email) === String(comment.author_email),
    });

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
                {isEditing ? (
                    <div className="comment-input-form">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                        />
                    </div>
                ) : (
                    <p className="comment-text">{comment.text}</p>
                )}
                <div className="comment-actions">
                    {isEditing ? (
                        <div className="edit-actions">
                            <button
                                className="action-btn cancel"
                                onClick={() => setIsEditing(false)}
                            >
                                Anuluj
                            </button>
                            <button
                                className="action-btn"
                                onClick={handleUpdateSubmit}
                            >
                                Zapisz
                            </button>
                        </div>
                    ) : (
                        <>
                            <VoteButtons
                                upvotes={comment.upvotes}
                                downvotes={comment.downvotes}
                                userVote={comment.user_vote}
                                onVote={handleVote}
                                size="small"
                            />
                            {isTopLevel && (
                                <button
                                    className="reply-btn"
                                    onClick={() => setIsReplying(!isReplying)}
                                >
                                    Odpowiedz
                                </button>
                            )}
                            {isAuthor && !isEditing && (
                                <ItemActions
                                    onEditClick={() => setIsEditing(true)}
                                    onDeleteClick={handleDelete}
                                />
                            )}
                        </>
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
