import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { addComment } from "../../../features/flashcardSets/flashcardSetSlice";
import { CommentItem } from "./CommentItem";
import "./Comments.css";

export const CommentSection = () => {
    const dispatch = useAppDispatch();
    const { data: set } = useAppSelector((state) => state.flashcardSet);
    const [newComment, setNewComment] = useState("");

    if (!set || !set.id) {
        return null;
    }

    const handleAddTopLevelComment = () => {
        if (newComment.trim()) {
            dispatch(
                addComment({
                    materialId: set.id!,
                    text: newComment,
                    parentCommentId: null,
                }),
            );
            setNewComment("");
        }
    };
    return (
        <div className="comments-section">
            <div className="divider"></div>
            <h2>Comments ({set.comments?.length || 0})</h2>
            <div className="comment-input-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment ..."
                />
                <button onClick={handleAddTopLevelComment}>
                    Dodaj komentarz
                </button>
            </div>
            <div className="comments-list">
                {(set.comments || []).map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        materialId={set.id!}
                        isTopLevel={true}
                    />
                ))}
            </div>
        </div>
    );
};
