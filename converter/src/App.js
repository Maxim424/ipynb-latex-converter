import './styles/App.css';
import HomePage from './pages/home/HomePage';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProcessPageController from './pages/processing/ProcessPageController';
import { ToastProvider } from "./design_kit/notification/ToastContext"

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={
          <ToastProvider>
            <HomePage />
          </ToastProvider>
        } />
        <Route path='/process' element={
          <ToastProvider>
            <ProcessPageController />
          </ToastProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;
