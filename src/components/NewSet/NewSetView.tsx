import { Link } from 'react-router-dom';
import { FiX  } from 'react-icons/fi';
import './NewSetView.css';

const NewSetView = () => {
    return (
        <div className="new-set-view">
            <div className="new-set-header">
                <h2>Nowy zestaw fiszek</h2>
                <Link to="/" className="close-btn">
                    <FiX  />
                </Link>
            </div>
            <div className="new-set-form">
                <input 
                    type="text" 
                    placeholder="Wprowadź nazwę zestawu fiszek" 
                    className="new-set-input" 
                />
                <textarea 
                    placeholder="Wprowadź opis zestawu fiszek" 
                    className="new-set-input description-input" 
                />
                <div className="privacy-options">
                    <label>
                        <input type="radio" name="privacy" value="public" defaultChecked />
                        Publiczny
                    </label>
                    <label>
                        <input type="radio" name="privacy" value="private" />
                        Prywatny
                    </label>
                </div>
                <div className="divider"></div>
            </div>
        </div>
    );
};

export default NewSetView;