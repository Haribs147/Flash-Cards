import "./SetCard.css";

type SetCardProps = {
    name: string;
    description: string;
    creator: string;
};

const SetCard = ({ name, description, creator }: SetCardProps) => {
    const initial = creator ? creator[0].toUpperCase() : "?";

    return (
        <div className="set-card">
            <div className="set-card-header">
                <div className="set-card-initial">{initial}</div>
                <span className="set-card-name">{name}</span>
            </div>
            <p className="set-card-description">{description}</p>
        </div>
    );
};

export default SetCard;
