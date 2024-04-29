"use client"
import Menu from "@/components/Menu";
import Signup from "@/components/Signup"
import { SnackbarProvider} from 'notistack'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

export default function Home() {
  return (
    <SnackbarProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </Router>
    </SnackbarProvider>
  )
}
