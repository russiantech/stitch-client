// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
// import './styles/global.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// )


// // v2
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App.tsx'
// import '@/styles/global.css'

// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

// v3
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
