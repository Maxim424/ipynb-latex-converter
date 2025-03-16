import './App.css';
import HomePage from './components/HomePage';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProcessPageController from './components/ProcessPageController';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage/>} />
        <Route path='/process' element={<ProcessPageController/>} />
      </Routes>
    </Router>
  );
}

export default App;
