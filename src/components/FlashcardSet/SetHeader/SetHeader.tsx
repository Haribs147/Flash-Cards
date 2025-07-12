import { FiEdit, FiShare2, FiX, FiCopy } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import './SetHeader.css';

type SetHeaderProps = {
    title: string;
    description: string;
    initial: string;
    onBackClick: () => void;
};

const SetHeader = ({ title, description, initial, onBackClick  }: SetHeaderProps) => {
    return (
        <header className="set-header">
            <div className="set-avatar">{initial}</div>
            <div className="set-info">
                <h1 className="set-title">{title}</h1>
                <p className="set-description">{description}</p>
            </div>
            <div className="set-header-actions">
                <button className="icon-btn"><FiEdit/></button>
                <button className="icon-btn"><FiCopy/></button>
                <button className="icon-btn"><FiShare2/></button>
                <button  onClick={onBackClick} className="icon-btn close-link"><FiX/></button >
            </div>
        </header>
    );
};

export default SetHeader;