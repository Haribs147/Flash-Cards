import { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import './App.css'
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import MaterialsView from './components/Materials/MaterialsView';
import NewSetView from './components/NewSet/NewSetView';
import FlashcardSetView from './components/FlashcardSet/FlashcardSetView';

function App() {

  const [activePage, setActivePage] = useState('home');

  return (
    
    <div className='App'>
      <Navbar />
      <Sidebar activeItem={activePage} onItemClick={setActivePage} />
        
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<MaterialsView />} />
          <Route path="/new-set" element={<NewSetView />} />
          <Route path="/set/:setId" element={<FlashcardSetView />} />
        </Routes>
      </main>
    </div>

  )
}

export default App
