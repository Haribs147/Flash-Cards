import React, { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
    setCurrentFolderId,
    moveItem,
} from "../../../features/materials/materialsSlice";
import "./Breadcrumbs.css";
import { current } from "@reduxjs/toolkit";

const BreadcrumbsSegment = ({
    id,
    name,
    isLast,
}: {
    id: string;
    name: string;
    isLast: boolean;
}) => {
    const dispatch = useAppDispatch();
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLSpanElement>) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLSpanElement>) => {
        setIsOver(false);
    };

    const handleDragDrop = (e: React.DragEvent<HTMLSpanElement>) => {
        e.preventDefault();
        const elementId = e.dataTransfer.getData("text/plain");
        setIsOver(false);
        if (elementId) {
            dispatch(moveItem({ itemId: elementId, targetFolderId: id }));
        }
    };

    const handleClick = () => {
        if (!isLast) {
            dispatch(setCurrentFolderId(id));
        }
    };

    return (
        <span
            className={}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDragDrop}
        >
            {name}
        </span>
    );
};

const Breadcrumbs = () => {
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

    return <div></div>;
};

export default Breadcrumbs;
