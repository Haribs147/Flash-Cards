import { useState } from 'react';
import './App.css'
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';

function App() {

  const [activePage, setActivePage] = useState('home');

  return (
    
    <div className='App'>
      <Navbar />
      <Sidebar activeItem={activePage} onItemClick={setActivePage} />
        
      <div className='main-content'>
        essa
      </div>
    </div>

  )
}

export default App
