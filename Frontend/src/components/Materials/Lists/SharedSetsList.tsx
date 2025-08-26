import "./SharedSetsList.css";
import { FiCheck, FiX } from "react-icons/fi";
import "./RecentSetsList.css";
import "./SharedSetsList.css";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useEffect } from "react";
import {
    acceptShare,
    fetchPendingShares,
    rejectShare,
} from "../../../features/shares/sharesSlice";

type SharedSetsListProps = {
    searchTerm: string;
};

const SharedSetsList = ({ searchTerm }: SharedSetsListProps) => {
    const dispatch = useAppDispatch();
    const { pending: pendingShares, status } = useAppSelector(
        (state) => state.shares,
    );

    useEffect(() => {
        if (status == "idle") {
            dispatch(fetchPendingShares());
        }
        console.log(pendingShares);
    }, [status, dispatch]);

    const handleAccept = (shareId: number) => {
        dispatch(acceptShare(shareId));
    };

    const handleReject = (shareId: number) => {
        dispatch(rejectShare(shareId));
    };

    if (status == "loading") {
        return <div></div>;
    }

    const filteredShares = pendingShares.filter((set) =>
        set.material_name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return (
        <div className="item-list">
            {filteredShares.map((share) => (
                <div key={share.share_id} className="list-item-set">
                    <div
                        className="set-avatar"
                        style={{ backgroundColor: "#007bff" }}
                    >
                        {share.sharer_email.charAt(0).toUpperCase()}
                    </div>
                    <div className="item-details">
                        <span className="item-name">{share.material_name}</span>
                        <span className="sharer-email">
                            Shared by: {share.sharer_email}
                        </span>
                    </div>

                    <div className="shared-actions">
                        <button
                            className="shared-btn accept"
                            onClick={() => handleAccept(share.share_id)}
                        >
                            <FiCheck />
                        </button>
                        <button
                            className="shared-btn reject"
                            onClick={() => handleReject(share.share_id)}
                        >
                            <FiX />
                        </button>
                    </div>
                </div>
            ))}
            {pendingShares.length === 0 && status === "succeded" && (
                <div className="no-shares-message">No pending shares</div>
            )}
        </div>
    );
};

export default SharedSetsList;
