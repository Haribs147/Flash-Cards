import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { addComment } from "../../../features/flashcardSets/flashcardSetSlice";
import { CommentItem } from "./CommentItem";
import "./Comments.css";

export const CommentSection = () => {
    const dispatch = useAppDispatch();
    const { data: set } = useAppSelector((state) => state.flashcardSet);
    const commentsData = set?.comments_data;
    const [newComment, setNewComment] = useState("");

    if (!set || !set.id || !commentsData) {
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

    const numberOfComments = Object.keys(commentsData.comments).length;
    return (
        <div className="comments-section">
            <div className="divider"></div>
            <h2>Comments ({numberOfComments})</h2>
            <div className="comment-input-form">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Dodaj komentarz ..."
                />
                <button onClick={handleAddTopLevelComment}>
                    Dodaj komentarz
                </button>
            </div>
            <div className="comments-list">
                {commentsData.top_level_comment_ids.map((commentId) => (
                    <CommentItem
                        key={commentId}
                        commentId={commentId}
                        materialId={set.id!}
                        isTopLevel={true}
                    />
                ))}
            </div>
        </div>
    );
};
