import { Route, Routes } from "react-router-dom"
import "./App.css"
import Navbar from "./components/Navbar/navbar.component"

export const App = () => (
  <div className="App">
    <Routes>
      <Route path="/" element={<Navbar />}>
        <Route index element={<></>} />
      </Route>
    </Routes>
  </div>
)
