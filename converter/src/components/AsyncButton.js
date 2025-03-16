import React, { useState } from 'react';
import "../styles/AsyncButton.css"
import { BeatLoading } from 'respinner'

const AsyncButton = ({ action, title }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        await action();
        setIsLoading(false);
    };

    return (
        <button
            onClick={handleClick}
            className="async-button"
            disabled={isLoading}
        >
            {isLoading ? (
                <BeatLoading fill="#777" borderRadius={4} count={12} />
            ) : (
                title
            )}
        </button>
    );
};

export default AsyncButton;
