import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
    setCurrentFolderId,
    moveItem,
} from "../../../features/materials/materialsSlice";
import "./Breadcrumbs.css";

const BreadcrumbsSegment = ({
    id,
    name,
    isLast,
    draggedItemId,
}: {
    id: string | null;
    name: string;
    isLast: boolean;
    draggedItemId: string;
}) => {
    const dispatch = useAppDispatch();
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLSpanElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDragDrop = (e: React.DragEvent<HTMLSpanElement>) => {
        e.preventDefault();
        setIsOver(false);
        if (draggedItemId) {
            dispatch(moveItem({ itemId: draggedItemId, targetFolderId: id }));
        }
    };

    const handleClick = () => {
        if (!isLast) {
            dispatch(setCurrentFolderId(id));
        }
    };

    return (
        <span
            className={`breadcrumb-segment ${isLast ? "active" : ""} ${isOver ? "drop-target" : ""}`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDragDrop}
        >
            {name}
        </span>
    );
};

const Breadcrumbs = ({ draggedItemId }: { draggedItemId: string }) => {
    const { items, currentFolderId } = useAppSelector(
        (state) => state.materials,
    );

    const breadcrumbPath = useMemo(() => {
        const path = [];
        let currentId = currentFolderId;

        while (currentId) {
            const folder = items.find((item) => item.id === currentId);
            if (folder) {
                path.unshift(folder);
                currentId = folder.parentId;
            } else {
                break;
            }
        }
        path.unshift({
            id: null,
            name: "Materiały",
            type: "folder",
            parentId: "root",
        });
        return path;
    }, [items, currentFolderId]);

    return (
        <nav className="breadcrumbs-nav">
            {breadcrumbPath.map((crumb, index) => (
                <span key={crumb.id || "root"}>
                    <BreadcrumbsSegment
                        id={crumb.id}
                        name={crumb.name}
                        isLast={index === breadcrumbPath.length - 1}
                        draggedItemId={draggedItemId}
                    />
                    {index < breadcrumbPath.length - 1 && " / "}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumbs;
