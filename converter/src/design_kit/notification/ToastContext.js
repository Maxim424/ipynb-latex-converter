import React, { createContext, useContext, useState } from "react";
import ToastNotification from "./ToastNotification";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toastMessage, setToastMessage] = useState("");

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(""), 3500);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toastMessage && <ToastNotification message={toastMessage} onClose={() => setToastMessage("")} />}
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
