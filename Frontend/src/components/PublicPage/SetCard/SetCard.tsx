import "./SetCard.css";

type SetCardProps = {
    name: string;
    description: string;
    initial: string;
};

const SetCard = ({ name, description, initial }: SetCardProps) => {
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
