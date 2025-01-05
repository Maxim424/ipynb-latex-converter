import React, { useState } from 'react';
import "./AsyncButton.css"
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
                <BeatLoading fill="#38a3a5" borderRadius={4} count={3} />
            ) : (
                title
            )}
        </button>
    );
};

export default AsyncButton;
