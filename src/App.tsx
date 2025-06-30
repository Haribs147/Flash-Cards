import { useState } from 'react';
import './App.css'
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import MaterialsView from './components/Materials/MaterialsView';

function App() {

  const [activePage, setActivePage] = useState('home');

  return (
    
    <div className='App'>
      <Navbar />
      <Sidebar activeItem={activePage} onItemClick={setActivePage} />
        
      <main className='main-content'>
        <MaterialsView/>
      </main>
    </div>

  )
}

export default App
