import logo from './logo.svg';
import './App.css';
import HomePage from './components/HomePage';
import ProcessPage from './components/ProcessPage';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage/>} />
        <Route path='/process' element={<ProcessPage/>} />
      </Routes>
    </Router>
  );
}

export default App;
