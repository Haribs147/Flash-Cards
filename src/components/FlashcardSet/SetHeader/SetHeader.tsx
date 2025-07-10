import { FiEdit, FiShare2, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './SetHeader.css';

type SetHeaderProps = {
    title: string;
    description: string;
    initial: string;
};

const SetHeader = ({ title, description, initial }: SetHeaderProps) => {
    return (
        <header className="set-header">
            <div className="set-avatar">{initial}</div>
            <div className="set-info">
                <h1 className="set-title">{title}</h1>
                <p className="set-description">{description}</p>
            </div>
            <div className="set-header-actions">
                <button className="icon-btn"><FiEdit/></button>
                <button className="icon-btn"><FiShare2/></button>
                <Link to="/" className="icon-btn close-link"><FiX/></Link>
            </div>
        </header>
    );
};

export default SetHeader;