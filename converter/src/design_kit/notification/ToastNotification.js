import React, { useState, useEffect } from "react";
import "./ToastNotification.css";

const ToastNotification = ({ message, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true);

        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 500);
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast ${visible ? "show" : ""}`} onClick={onClose}>
            {message}
        </div>
    );
};

export default ToastNotification;
