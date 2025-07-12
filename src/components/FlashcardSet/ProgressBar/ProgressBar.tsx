import './ProgressBar.css';

type ProgressBarProps = {
    correct: number;
    incorrect: number;
    total: number;
};

const ProgressBar = ({ correct, incorrect, total }: ProgressBarProps) => {
    const correctPercent = (correct / total) * 100;
    const incorrectPercent = (incorrect / total) * 100;

    return (
        <div className="progress-bar-container">
            <span className="progress-label-start">{incorrect}</span>
            <div className="progress-bar">
                <div className="progress-incorrect" style={{ width: `${incorrectPercent}%` }}></div>
                <div className="progress-correct" style={{ width: `${correctPercent}%` }}></div>
            </div>
            <span className="progress-label-end">{total}</span>
        </div>
    );
};

export default ProgressBar;